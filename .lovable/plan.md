
# Integrar API Real nos BIs: Minutas, B-Side Entregas e B-Side Estoque

## Resumo

Os hooks de dados reais (`useFollowupData`, `useEstoqueData`, `useApiProxy`) ja estao criados mas nao sao usados. As tres paginas ainda importam dados mock (`mockData.ts`, `entregasData.ts`, `stockData.ts`). Este plano conecta cada pagina aos dados reais via Edge Function `api-proxy`.

Cada pagina lera o `cod_cli` configurado em `bi_settings` para o respectivo `page_id`.

---

## Pagina 1: Minutas (`src/pages/Index.tsx`)

### O que muda
- Remover imports de `generateAllRegionalDailyData`, `calculateTotals` de `mockData.ts`
- Importar `useFollowupData` e `useBiSettingsContext`
- Ler `cod_cli` do `bi_settings` para `page_id = "minutas"`
- No mount, chamar `fetchFollowup()` e `fetchProdutosDistribuidos()`
- Substituir `barChartData` por `getMinutasData()`
- Substituir `aggregatedDailyData` por `getMinutasDailyData()`
- Usar `getTotalValue()` para exibir valor financeiro nos KPIs
- Calcular `totalExpedidas` e `totalBaixadas` a partir dos dados reais
- Manter todos os filtros interativos (dia, metrica, regiao) funcionando sobre os dados reais
- Adicionar estado de loading e mensagem de erro
- O botao "Atualizar" re-chama as APIs

### Componentes afetados
- `KPICards` - recebe dados reais, sem mudanca de interface
- `RegionalBarChart` - recebe dados reais, sem mudanca de interface
- `RegionalLineCharts` - recebe dados reais, sem mudanca de interface

---

## Pagina 2: B-Side Entregas (`src/pages/Entregas.tsx`)

### O que muda
- Remover imports de `generateDeliveryData`, `generateDeliveryItems`, `calculateDeliveryTotals` de `entregasData.ts`
- Importar `useFollowupData` e `useBiSettingsContext`
- Ler `cod_cli` do `bi_settings` para `page_id = "entregas"`
- No mount, chamar `fetchFollowup()`
- Substituir `deliveryData` por `getEntregasData()` que ja retorna o formato `DeliveryData[]`
- Remover a tabela "Ultimas Movimentacoes" (dados granulares mock) -- ou manter usando `followupData` raw filtrado
- Calcular totals a partir do array retornado por `getEntregasData()`
- Manter filtros de regional, tipo e status funcionando
- Adicionar loading e erro
- O botao "Atualizar" re-chama a API

### Componentes afetados
- `EntregasKPICards` - sem mudanca de interface
- `ProgressBars` - sem mudanca de interface
- `RegionalCards` - precisa aceitar o novo formato (ja compativel com `DeliveryData`)
- `EntregasTables` - precisa aceitar o novo formato (ja compativel com `DeliveryData`)
- A tabela de "Ultimas Movimentacoes" sera alimentada por dados raw do Followup

---

## Pagina 3: B-Side Estoque (`src/pages/Estoque.tsx`)

### O que muda
- Remover imports de `generateStockData`, `calculateMatrizTotals`, etc. de `stockData.ts`
- Importar `useEstoqueData` e `useBiSettingsContext`
- Ler `cod_cli` do `bi_settings` para `page_id = "estoque"`
- No mount, chamar `fetchSaldoBase()` e `fetchRecebimentos()`
- Substituir `stockData` por `stockItems` do hook (ja processado com whitelist e kits)
- Layout simplificado: apenas tabela Matriz (Barueri), sem graficos, sem tabela Base
- Remover os 4 graficos (PieChart, BarChart, TimePieChart, TimeBarChart)
- Manter layout 3:1 com tabela + ProductDetailPanel
- Usar `totals` do hook para KPIs (valor, m3, qtdeSKUs, kits)
- Adaptar `StockLocationTables` ou criar versao simplificada com apenas Matriz
- Adicionar colunas "Ult. Entrada Qtd" e "Ult. Entrada Data" na tabela
- Foto maior com hover para preview
- Adicionar loading e erro

### Componentes afetados
- `StockDualKPICards` - simplificar para single KPI (apenas Matriz)
- `StockLocationTables` - adaptar para mostrar apenas Matriz com novas colunas
- `ProductDetailPanel` - sem mudanca
- Remover uso de `StockGroupPieChart`, `StockValueBarChart`, `StockTimePieChart`, `StockTimeBarChart`

---

## Detalhes Tecnicos

### Leitura do cod_cli
Cada pagina usara o `useBiSettingsContext()` para buscar as settings do page_id e extrair o `cod_cli`:
```text
const { settings } = useBiSettingsContext();
const biSetting = settings.find(s => s.page_id === "minutas");
const codCli = biSetting?.cod_cli || "";
```

### Fluxo de dados
```text
Pagina monta -> le cod_cli do bi_settings -> passa para useFollowupData(codCli) ou useEstoqueData(codCli) -> hook chama fetchFollowup/fetchSaldoBase -> useApiProxy chama Edge Function api-proxy -> Edge Function faz request para API externa -> retorna dados -> hook processa e retorna dados formatados -> pagina renderiza
```

### Tratamento de Loading/Erro
- Cada pagina exibira um skeleton/spinner enquanto `loading === true`
- Se `error` existir, mostra alerta com a mensagem
- Se `cod_cli` nao estiver configurado, mostra mensagem orientando o admin a configurar

### Arquivos modificados
1. `src/pages/Index.tsx` - conectar a useFollowupData
2. `src/pages/Entregas.tsx` - conectar a useFollowupData
3. `src/pages/Estoque.tsx` - conectar a useEstoqueData, simplificar layout
4. `src/components/stock/StockLocationTables.tsx` - adicionar colunas de ultima entrada
5. `src/components/stock/StockDualKPICards.tsx` - adaptar para single (apenas Matriz)
6. `src/hooks/useBiSettings.ts` - garantir que `cod_cli` esta no type BiSetting
7. `src/contexts/BiSettingsContext.tsx` - expor metodo para obter cod_cli por pageId
