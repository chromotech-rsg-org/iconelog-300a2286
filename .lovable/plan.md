

## Diagnóstico

Dois problemas identificados:

### 1. Edge Function `scheduled-update` — erro de escopo (`apiName is not defined`)
O bloco de dados de 2025 (linhas 277-323) está **fora** do loop `for (const integration of integrations)` que termina na linha 275. As variáveis `apiName`, `integration`, `defaultBody`, `headers` não existem nesse escopo. Isso causa o erro que aparece nos logs e impede a atualização agendada de completar.

### 2. Refresh manual trava no B-Side Entregas
O `fetchFollowup` em `useFollowupData.ts` tenta buscar 12 meses de 2025 **de forma síncrona** antes de mostrar qualquer dado. Com ~18k registros/mês, isso leva vários minutos e a UI fica presa no "Carregando...".

## Plano de Correção

### A. Corrigir `scheduled-update/index.ts`
- Mover o bloco de fetch de 2025 para **dentro** do loop de integrations, logo após salvar os dados do ano corrente (antes do `catch`)
- Garantir que `apiName`, `headers`, `defaultBody` etc. estejam no escopo correto

### B. Desbloquear refresh manual em `useFollowupData.ts`
- No `fetchFollowup`, **primeiro** buscar e exibir dados do ano corrente (fluxo rápido, ~3 meses)
- **Depois** de salvar e mostrar os dados correntes, disparar a busca de 2025 **em background** (sem bloquear a UI)
- Adicionar um estágio de progresso separado para 2025 (ex: `"loading_2025"`) que não impede a visualização dos dados já carregados
- Se 2025 já existe no cache, pular completamente (comportamento atual mas sem travar)

### C. Redeploy da Edge Function
- Reimplantar `scheduled-update` com a correção de escopo

### Resultado esperado
- Atualização manual carrega dados correntes em ~2min e exibe imediatamente
- Dados de 2025 carregam em segundo plano sem travar a tela
- Atualizações agendadas param de falhar com "apiName is not defined"

