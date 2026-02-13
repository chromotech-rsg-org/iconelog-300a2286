
# Plano: Carregamento Instantaneo + Filtros do Banco + Feedback de Atualizacao

## Problemas Identificados

1. **Carregamento lento**: O cache existe no banco (14.300 registros, ~777KB), mas o loading spinner bloqueia a tela inteira enquanto carrega. O `settingsLoading` tambem causa delay.
2. **Filtros de mes/ano nao funcionam**: O cache salva todos os dados com uma unica chave (`followup_099`), sem distinguir mes/ano. Os dados tem o campo `dt_inicio` (ex: `2026/02/12`) que permite filtrar por mes/ano no client-side.
3. **Sem feedback durante atualizacao**: Ao clicar em "Atualizar", nao ha indicacao visual do progresso.

## Solucao

### 1. Carregamento Instantaneo do Cache

- Remover o loading spinner de tela cheia para o carregamento do cache
- Mostrar os dados imediatamente assim que o cache for carregado, sem bloquear a renderizacao
- Separar o estado `loading` (cache) do estado `refreshing` (API)
- Se nao houver dados no cache, mostrar mensagem "Nenhum dado. Clique em Atualizar" ao inves de spinner

### 2. Filtros de Mes/Ano 100% Client-Side

- Adicionar filtragem por mes/ano nos metodos `getMinutasData()` e `getMinutasDailyData()` usando o campo `dt_inicio` dos dados cacheados
- Passar `selectedMonths` e `selectedYears` como parametros para esses metodos
- Os filtros operam instantaneamente sobre os dados ja carregados do banco, sem consultar a API
- Ao mudar mes/ano, apenas recalcula os dados filtrados localmente

### 3. Feedback Visual de Atualizacao com Etapas

- Criar um componente `RefreshProgress` que mostra o progresso da atualizacao em etapas:
  - "Solicitando dados da API..."
  - "Recebendo dados do Followup... (X registros)"
  - "Recebendo dados de Produtos..."
  - "Salvando no banco..."
  - "Concluido!"
- Exibir como um toast/banner fixo durante a atualizacao, sem bloquear os dados ja exibidos
- Os dados antigos continuam visiveis enquanto a atualizacao acontece em background

## Detalhes Tecnicos

### Arquivo: `src/hooks/useFollowupData.ts`

- Adicionar estado `refreshing` separado de `loading`
- Adicionar estado `refreshStage` para rastrear etapas ("requesting_followup", "receiving_followup", "requesting_produtos", "saving", "done")
- Modificar `getMinutasData(months, years)` e `getMinutasDailyData(months, years)` para filtrar por `dt_inicio`:
  ```
  // Extrair mes/ano de dt_inicio (formato "2026/02/12")
  const [y, m] = item.dt_inicio.split("/").map(Number);
  if (!years.includes(y) || !months.includes(m)) return; // skip
  ```
- O `loadCache` nao ativa `loading` -- apenas carrega silenciosamente
- O `fetchFollowup` ativa `refreshing` + `refreshStage` em vez de `loading`

### Arquivo: `src/pages/Index.tsx`

- Remover dependencia do `loading` para exibir spinner de tela cheia
- Se `followupData` estiver vazio e nao estiver carregando cache, mostrar mensagem de "sem dados"
- Passar `selectedMonths` e `selectedYears` para `getMinutasData` e `getMinutasDailyData`
- Exibir componente de progresso quando `refreshing === true`
- Os graficos continuam visiveis durante a atualizacao

### Novo componente: `src/components/dashboard/RefreshProgress.tsx`

- Barra/banner no topo mostrando etapa atual da atualizacao
- Icone de spinner ao lado da etapa
- Desaparece automaticamente quando concluido (com breve mensagem de sucesso)
