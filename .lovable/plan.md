

# Ajuste na Logica de Contagem de Minutas

## Problema Atual

A logica atual filtra os registros usando qualquer campo de data disponivel (`dt_inicio`, `dt_expedicao`, `dt_baixa_minuta`) e depois conta expedidas/baixadas apenas verificando se o campo existe. Isso gera contagens incorretas porque:

1. Um registro pode entrar no filtro por causa do `dt_inicio`, mas nao ter `dt_expedicao` no periodo selecionado
2. A contagem nao valida se a data especifica de cada campo esta dentro do periodo
3. O campo `dt_inicio` nao deveria ser usado

## Nova Logica

Para cada registro, contar **independentemente**:
- **Expedidas**: apenas se `dt_expedicao` cair dentro do periodo selecionado
- **Baixadas**: apenas se `dt_baixa_minuta` cair dentro do periodo selecionado

Exemplo do usuario: filtrando dias 09 e 10/02 em Porto Alegre, contar quantos registros tem `dt_expedicao` nesses dias (259) e quantos tem `dt_baixa_minuta` nesses dias (205).

## Alteracoes Tecnicas

### Arquivo: `src/hooks/useFollowupData.ts`

1. **Remover `dt_inicio` de `parseDateField`** - usar apenas `dt_expedicao` e `dt_baixa_minuta`

2. **Refatorar `filterByMonthYear`** - incluir registro se `dt_expedicao` OU `dt_baixa_minuta` cair no mes/ano selecionado (sem `dt_inicio`)

3. **Refatorar `filterByDateRange`** - remover `dt_inicio` da lista de datas candidatas

4. **Refatorar `getMinutasData`** - em vez de apenas verificar se o campo existe, verificar se a data do campo esta dentro do periodo selecionado:
   - Se filtro por calendario (dateRange): contar expedida somente se `dt_expedicao` estiver no range, contar baixada somente se `dt_baixa_minuta` estiver no range
   - Se filtro por mes/ano: contar expedida somente se `dt_expedicao` bater com mes/ano, contar baixada somente se `dt_baixa_minuta` bater com mes/ano

5. **`getMinutasDailyData` ja esta correto** - ele ja conta expedidas e baixadas independentemente por data. Apenas remover `dt_inicio` do pre-filtro.

### Resumo do Impacto

- Apenas o arquivo `src/hooks/useFollowupData.ts` sera alterado
- Os componentes visuais (KPICards, graficos, tabelas) permanecem inalterados
- A contagem passara a refletir exatamente quantas expedicoes e baixas ocorreram no periodo selecionado

