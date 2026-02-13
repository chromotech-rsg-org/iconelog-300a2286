
# Fix: Erro 401 na Edge Function e Última Atualização

## Problemas Identificados

1. **Edge Function retorna 401**: O metodo `getClaims(token)` nao existe na versao padrao do `@supabase/supabase-js@2` importada via esm.sh. A chamada falha silenciosamente, e a funcao retorna "Unauthorized".
2. **Ultima atualizacao nao persiste**: O upsert em `bi_last_update` e `bi_data_cache` tambem falha com 401 porque e feito via client-side e pode haver um problema de sessao expirada. Alem disso, o `lastUpdateAt` e atualizado localmente antes de confirmar que o save funcionou.
3. **Sem logs de debug**: A edge function nao tem console.log para diagnosticar erros, dificultando a depuracao.

## Solucao

### 1. Corrigir autenticacao na Edge Function

Substituir `getClaims(token)` por `getUser(token)` que e o metodo padrao e funciona em todas as versoes do supabase-js:

```typescript
const { data: { user }, error: userError } = await supabase.auth.getUser(token);
if (userError || !user) {
  console.error("Auth error:", userError?.message);
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
```

### 2. Adicionar logs de debug na Edge Function

Adicionar `console.error` e `console.log` em pontos criticos para facilitar depuracao futura:
- Log quando auth falha (com mensagem de erro)
- Log da URL sendo chamada
- Log de erros do fetch externo

### 3. Garantir persistencia da ultima atualizacao

No hook `useFollowupData.ts`, so atualizar `lastUpdateAt` localmente apos confirmar que o upsert no banco funcionou (verificar o retorno do upsert).

### 4. Redeploiar e testar

Apos as alteracoes, redeploiar a edge function e testar chamando-a diretamente para confirmar que o 401 foi resolvido.

## Arquivos Modificados

- `supabase/functions/api-proxy/index.ts` - Trocar getClaims por getUser, adicionar logs
- `src/hooks/useFollowupData.ts` - Melhorar tratamento de erro no saveLastUpdate
