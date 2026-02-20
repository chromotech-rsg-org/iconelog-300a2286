

# Tracking Consolidado - Implementacao com APIs Reais

## Visao Geral

Transformar a pagina de Tracking Consolidado de dados mock para dados reais das APIs FOLLOWUP e PRODUTOSDISTRIBUIDOS, mantendo todas as informacoes fidedignas ao Power BI atual, com o layout visual do sistema (modo escuro, tons amarelos).

## Fontes de Dados

- **FOLLOWUP**: Dados de pedidos (nr_pedido, ds_tipo_servico, ds_modalidade_transporte, nm_campanha, ds_cidade_DES, ds_uf_DES, fl_status_real, dt_previsao, dt_entrega_real, nm_solicitante, nr_qtde_SKU, vl_total, cod_conhecimento)
- **PRODUTOSDISTRIBUIDOS**: Itens dos pedidos (nr_pedido, cod_prod_cliente, descricao, nm_sub_grupo, m3_total, vl_total, nr_qtde)

## Logica de "No Prazo" vs "Fora do Prazo"

- Se `dt_entrega_real` existe e `dt_entrega_real <= dt_previsao` -> No Prazo
- Se `dt_entrega_real` existe e `dt_entrega_real > dt_previsao` -> Fora do Prazo
- Se nao tem `dt_entrega_real` (ainda em transito), usa data atual vs `dt_previsao`

## Componentes Visuais

### 1. KPI Cards (destaque maior para Quantidade de Pedidos)
- **Quantidade de Pedidos** (card maior, fonte maior)
- Qtde no Prazo / % no Prazo
- Qtde Fora do Prazo / % Fora do Prazo
- Status: Finalizado / Transito

### 2. Grafico de Performance (Velocimetro/Gauge)
- Estilo semi-circular tipo velocimetro (nao donut)
- Mostra a % No Prazo no centro
- Cores: verde para No Prazo, salmao/rosa para Fora do Prazo
- Filtros clicaveis "No Prazo" e "Fora do Prazo" abaixo do gauge
- Implementado com Recharts PieChart customizado (startAngle=180, endAngle=0)

### 3. Status Pedidos (barras horizontais)
- FINALIZADO e TRANSITO com contagem

### 4. Pedidos por Tipo de Servico (barras horizontais)
- ENTREGA, REENTREGA, COLETA, RETIRA MATRIZ, DESCARTE
- Agrupado pelo campo `ds_tipo_servico`

### 5. Pedidos por Modalidade (donut chart)
- RODOVIARIO, EXCLUSIVO, etc.
- Campo `ds_modalidade_transporte`

### 6. Entregas por Cidade (barras horizontais com status)
- Top cidades com barras divididas por FINALIZADO/TRANSITO
- Clicavel para filtrar

### 7. Pedido por Regiao (pie chart)
- Sudeste, Nordeste, Sul, Centro-Oeste
- Usa mapeamento regional existente (city_regional_mapping)

### 8. Pedidos por Estado (barras verticais)
- Campo `ds_uf_DES`

### 9. Mapa do Brasil
- SVG do mapa do Brasil com estados clicaveis
- Colorido por volume de pedidos
- Clicar em um estado filtra todos os dados
- Implementado com SVG paths para cada estado brasileiro

### 10. Tabela "Pedidos Consolidados"
Colunas conforme imagem 2:
- N Mov (cod_conhecimento)
- Pedido (nr_pedido)
- Tipo de Servico (ds_tipo_servico)
- Modalidade (ds_modalidade_transporte)
- Campanha (nm_campanha)
- Qtde SKU (nr_qtde_SKU)
- Vl. Tot. Pedido (vl_total do followup)
- Prev. de Entrega (dt_previsao)
- Data Entrega Real (dt_entrega_real)
- Status (fl_status_real)
- Cidade Destino (ds_cidade_DES)
- UF (ds_uf_DES)
- Solicitante (nm_solicitante)

### 11. Tabela "Itens dos Pedidos"
Colunas conforme imagem 3 (dados da API PRODUTOSDISTRIBUIDOS):
- Pedido (nr_pedido)
- Cod. Item (cod_prod_cliente)
- Descricao (descricao)
- SubGrupo (nm_sub_grupo)
- M3 Total (m3_total)
- Vl. Total (vl_total)

## Alteracoes Tecnicas

### 1. `src/hooks/useFollowupData.ts`
- Adicionar funcao `getTrackingData()` que retorna KPIs e dados agregados para o tracking
- Incluir logica de "No Prazo" baseada em `dt_previsao` vs `dt_entrega_real`
- Agrupamentos por tipo_servico, modalidade, cidade, estado, regiao
- O fetch de PRODUTOSDISTRIBUIDOS sera ativado tambem para `pageId === "tracking"` (alem de "minutas")
- Adicionar cache para tracking (`followup_099` e `produtos_099` com page_id "tracking")

### 2. `src/components/tracking/` (novos arquivos)
- `TrackingKPICards.tsx` - Cards de KPI com destaque no total
- `TrackingGaugeChart.tsx` - Grafico velocimetro de performance
- `TrackingStatusBars.tsx` - Barras de status (Finalizado/Transito)
- `TrackingTipoServicoChart.tsx` - Barras horizontais por tipo servico
- `TrackingModalidadeChart.tsx` - Donut por modalidade
- `TrackingCidadeChart.tsx` - Barras por cidade com status
- `TrackingRegionalPieChart.tsx` - Pizza por regiao
- `TrackingEstadoChart.tsx` - Barras por estado
- `TrackingBrazilMap.tsx` - Mapa SVG do Brasil interativo
- `TrackingPedidosTable.tsx` - Tabela de pedidos consolidados
- `TrackingItensTable.tsx` - Tabela de itens dos pedidos

### 3. `src/pages/Tracking.tsx` (reescrita completa)
- Remover dados mock e importar `useFollowupData` com pageId "tracking"
- Integrar com `SharedHeader` e sistema de filtros (meses, anos, regionais, calendario)
- Layout em grid reproduzindo a estrutura do Power BI:
  - Coluna esquerda: KPIs, Status, Tipo Servico, Entregas por Cidade
  - Centro: Performance (gauge), Modalidade, Regiao, Estado, Mapa
  - Direita: Tabela Pedidos Consolidados, Tabela Itens
- Todos os graficos e tabelas sao interativos (clique filtra globalmente)
- Tabs B-SIDE / D-SIDE mantidas

### 4. `src/data/trackingData.ts`
- Remover dados mock (nao sera mais usado)

### 5. Mapa do Brasil SVG
- Criar `src/components/tracking/brazil-map-paths.ts` com os paths SVG de cada estado
- Cada estado colorido proporcionalmente ao volume de pedidos
- Click em estado aplica filtro global por UF

## Fluxo de Dados

```text
API FOLLOWUP ──> bi_data_cache (page_id: "tracking")
                       │
                       ▼
              useFollowupData(codCli, "tracking")
                       │
                       ├── getTrackingData(months, years, dateRange)
                       │     ├── KPIs (total, prazo, status)
                       │     ├── Por tipo servico
                       │     ├── Por modalidade  
                       │     ├── Por cidade (com status)
                       │     ├── Por estado
                       │     └── Por regiao
                       │
API PRODUTOS ──> produtosData
                       │
                       └── Tabela Itens dos Pedidos
```

## Cores e Estilo

- Fundo escuro (#0a0a0a), bordas finas
- Destaque amarelo (#ffcc00) para KPIs e elementos ativos
- Verde para "No Prazo", vermelho/salmao para "Fora do Prazo"
- Gauge com gradiente verde -> amarelo -> vermelho
- Mapa em tons de amarelo (mais escuro = mais pedidos)

