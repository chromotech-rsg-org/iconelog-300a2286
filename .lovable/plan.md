

## Diagnóstico Completo

**Causa raiz confirmada**: O banco de dados está com **queries pesadas travadas** na tabela `bi_data_cache` que consomem todas as conexões disponíveis (pool de 10 conexões). Isso impede que a autenticação complete:

- Query travada há **3 minutos** (estado: aborted, ocupando conexão)
- Query ativa há **1 min 15s** carregando cache de 1.8MB
- A tabela `bi_data_cache` tem **16MB** com registros individuais de até **1.8MB** de JSON

Quando um usuário abre a página de login, o `BiSettingsProvider` e `LanguageProvider` já disparam queries ao banco. Quando múltiplos usuários fazem isso simultaneamente, as 10 conexões se esgotam, e o endpoint de autenticação (`/auth/v1/token`) retorna **504 timeout** após 35 segundos.

## Solução em 3 Partes

### 1. Matar queries travadas (imediato)
Não é possível via código — precisa ser feito via migração com `SELECT pg_terminate_backend(pid)` para liberar as conexões bloqueadas.

### 2. Otimizar carregamento do cache (código)
O problema é que `useFollowupData` carrega **todos os fragmentos de cache sequencialmente** no mount, cada um com 500KB-1.8MB de JSON. Isso satura o banco.

**Arquivo: `src/hooks/useFollowupData.ts`**
- Carregar apenas o cache principal (`followup_{codCli}`) no mount
- Carregar fragmentos históricos (`followup_{codCli}_YYYY_MM`) somente sob demanda (quando o usuário filtra por mês/ano específico)
- Adicionar `AbortController` com timeout de 10s para cada query de cache

### 3. Adicionar statement_timeout nas queries pesadas (migração)
Criar uma migração que define `statement_timeout` no role `authenticator` para evitar que queries de cache bloqueiem a autenticação indefinidamente.

### 4. Melhorar resiliência do login (código)
**Arquivo: `src/pages/Auth.tsx`**
- O `handleLogin` já tem o timeout de 5s, mas o `signInWithPassword` do Supabase SDK não tem timeout próprio — ele espera até 35s+ pelo servidor
- Envolver a chamada `login()` em um `Promise.race` com timeout de 15s, mostrando mensagem amigável "Servidor lento, tente novamente em alguns segundos"

**Arquivo: `src/hooks/useSupabaseAuth.ts`**
- No `signIn`, envolver o `signInWithPassword` em um timeout de 15s (atualmente só o fetchProfile tem timeout)

## Resumo de Mudanças

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | `pg_terminate_backend` para matar queries travadas + `statement_timeout` de 30s |
| `src/hooks/useFollowupData.ts` | Lazy-load de fragmentos históricos, timeout de 10s por query |
| `src/hooks/useSupabaseAuth.ts` | Timeout de 15s no `signInWithPassword` |
| `src/pages/Auth.tsx` | Mensagem amigável quando servidor está lento |

