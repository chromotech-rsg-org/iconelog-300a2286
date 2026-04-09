

## Diagnóstico: Banco de dados com pool de conexões esgotado (novamente)

O banco está retornando "Connection terminated due to connection timeout" em todas as queries. Isso impede o carregamento de permissões após o login, e o SmartRedirect redireciona para `/no-access` após 3 tentativas falhadas.

### Causa raiz recorrente

A query `.or()` com padrões LIKE na tabela `bi_data_cache` (16MB+ de JSONB) no mount de cada BI consome múltiplas conexões simultaneamente. Com o pool pequeno (10 conexões), basta 2-3 abas abertas para esgotar tudo. O scheduled-update agrava o problema ao rodar queries pesadas no mesmo pool.

### Solução definitiva (3 partes)

**Parte 1: Migração SQL — Matar conexões travadas + criar índice**
- Executar `pg_terminate_backend()` para liberar conexões bloqueadas (igual fizemos antes)
- Criar um **índice parcial** na tabela `bi_data_cache` para acelerar as queries LIKE:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_bi_data_cache_shared_key 
  ON bi_data_cache (cache_key) 
  WHERE page_id = '_shared';
  ```
- Isso reduz drasticamente o tempo de cada query de cache, liberando conexões mais rápido

**Parte 2: Limitar queries concorrentes no frontend (`useFollowupData.ts`)**
- Substituir as 2 queries paralelas (followup + produtos) por queries sequenciais
- Adicionar um **debounce global**: se outro componente já está fazendo query de cache, esperar em vez de abrir nova conexão
- Reduzir o timeout de 15s para 8s — se o cache não carregou em 8s, desistir e esperar o refresh manual

**Parte 3: Proteger o fluxo de login contra saturação do cache (`useSupabaseAuth.ts`)**
- As queries de auth (profiles, roles, permissions) são leves e rápidas, mas ficam em fila atrás das queries pesadas de cache
- Mover o `fetchPublicAccess` para depois do login (não no mount do app) — essa query roda para todos os visitantes, inclusive não autenticados, consumindo conexões desnecessariamente
- No `SmartRedirect`, se o cache local tem permissões válidas (< 24h), usá-las imediatamente sem esperar o banco

### Resumo de mudanças

| Arquivo | Mudança |
|---|---|
| Migração SQL | `pg_terminate_backend` + índice em `bi_data_cache(cache_key)` |
| `src/hooks/useFollowupData.ts` | Queries sequenciais, timeout 8s, debounce global |
| `src/hooks/useSupabaseAuth.ts` | Lazy-load do `fetchPublicAccess`, priorizar cache local |
| `src/components/auth/SmartRedirect.tsx` | Usar cache de permissões local antes de consultar o banco |

