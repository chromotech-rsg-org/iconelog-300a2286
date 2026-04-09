
Diagnóstico

A instância maior ajudou na infraestrutura, mas não removeu o gargalo principal: o app continua esgotando o pool de conexões do backend com consultas e cargas concorrentes. O sinal mais forte está nos logs de auth: o worker aplica limite fixo de 10 conexões (`config_max_pool_size=10`, `limit_max_open_conns=10`) mesmo com o banco aceitando mais (`server_max_conns=60`). Ou seja: aumentar a instância não resolve se o app ainda consome rapidamente essas 10 conexões.

O que encontrei no código

- `src/hooks/useSupabaseAuth.ts`
  - Após login, abre várias queries em sequência/paralelo: `profile + roles`, depois `page_permissions + admin_permissions`, e ainda `fetchPublicAccess`.
  - Para visitantes sem sessão, `fetchPublicAccess` ainda roda depois de 3s em todo carregamento.
- `src/hooks/useFollowupData.ts`
  - O “debounce global” não é global; `cacheLoadLockRef` é local por instância do hook. Em múltiplas abas/componentes, as consultas ainda acontecem ao mesmo tempo.
  - O lazy-load histórico usa chave antiga (`followup_${codCli}_${year}_${month}`), enquanto o cache novo foi padronizado para `{api}_{year}_{month}_{codCli}`. Isso causa miss de cache e mais chamadas pesadas.
- `src/hooks/useDynamicFilters.ts`
  - Faz `select("cache_key")` em toda `bi_data_cache`, sem filtrar por página/cliente. Em tabela grande, isso vira varredura recorrente.
- `supabase/functions/scheduled-update/index.ts`
  - Para APIs pesadas, ainda faz refresh anual completo e depois várias gravações de fragmentos, além de limpeza por `.like()` em `bi_data_cache`. Isso continua pressionando o mesmo pool compartilhado.

Por que continua falhando mesmo na instância grande

1. O limite efetivo do app continua sendo 10 conexões do worker de auth/api.
2. O problema é de padrão de acesso, não só de CPU/RAM:
   - fan-out de queries no login,
   - scans desnecessários na tabela de cache,
   - refresh agendado pesado concorrendo com autenticação,
   - fallback de cache ainda incompleto.
3. Quando o pool lota, o login até autentica, mas perfil/permissões/public access atrasam ou falham; daí aparecem “servidor indisponível”, timeout ou redirecionamento incorreto.

Plano de correção

1. Blindar o login
- Em `useSupabaseAuth.ts`, reduzir o fan-out:
  - carregar `profile -> roles -> permissions` de forma sequencial/priorizada,
  - não buscar `public_page_settings` no fluxo inicial de visitante,
  - usar cache local válido imediatamente quando o banco estiver lento.
- Em `SmartRedirect.tsx`, usar o cache local antes das 3 tentativas, não só no fim.

2. Cortar leituras desnecessárias do cache
- Em `useDynamicFilters.ts`, parar de ler todos os `cache_key` da `bi_data_cache`; derivar anos do dataset já carregado ou consultar somente chaves do cliente/página atual.
- Em `useFollowupData.ts`, corrigir o lazy-load histórico para o formato novo:
  - `followup_${year}_${month}_${codCli}`
  - `produtosdistribuidos_${year}_${month}_${codCli}`

3. Tornar o “lock global” realmente global
- Substituir o `useRef` local por um lock compartilhado entre instâncias/tabs (variável de módulo + promise compartilhada, ou `localStorage`/`BroadcastChannel`).
- Assim apenas uma carga pesada de cache roda por vez.

4. Reduzir a pressão do agendado
- Em `scheduled-update/index.ts`:
  - limitar 1 job pesado por cliente/API por ciclo,
  - evitar limpeza por busca ampla com `.like()` sempre que possível,
  - só atualizar fragmentos necessários e com escrita mais contida,
  - impedir que refresh pesado concorra com auth quando houver fila acumulada.

5. Separar “metadados de cache” de “payload de cache”
- Manter `bi_data_cache` para JSON e usar metadados leves (anos disponíveis, freshness, fragmentos existentes) sem scan da tabela principal.
- Isso evita que a interface faça leituras estruturais numa tabela feita para blobs grandes.

Detalhes técnicos importantes

- Evidência de runtime:
  - logs de auth com `/token` levando ~8–9s,
  - `/logout` com 500 e `context canceled`,
  - restart recente do worker de auth,
  - limite aplicado de 10 conexões apesar do servidor aceitar mais.
- Conclusão:
  - a instância grande não é a raiz do problema;
  - o gargalo está no desenho das queries e na concorrência entre login, leitura de cache e atualização agendada.

Arquivos a ajustar
- `src/hooks/useSupabaseAuth.ts`
- `src/components/auth/SmartRedirect.tsx`
- `src/hooks/useFollowupData.ts`
- `src/hooks/useDynamicFilters.ts`
- `supabase/functions/scheduled-update/index.ts`

Resultado esperado após a correção
- login volta a responder mesmo sob carga,
- menos “servidor indisponível”,
- menos picos de uso no backend,
- atualização automática deixa de competir com autenticação,
- cache histórico funciona sem forçar refresh manual.
