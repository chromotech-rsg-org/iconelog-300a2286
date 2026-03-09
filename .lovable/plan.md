

## Plano: Traduzir TODOS os elementos restantes dos BIs + Corrigir salvamento de traduções

### Problema 1: Salvamento não funciona no TranslationsManager
O `handleSave` não verifica o retorno das operações `insert`/`update`/`delete` do banco. Se houver erro de RLS ou qualquer outro, ele silenciosamente falha e mostra "Tradução salva com sucesso" mesmo sem ter salvo.

**Correção:** Verificar `{ error }` em cada chamada supabase e exibir `toast.error` com a mensagem real.

### Problema 2: Componentes com textos hardcoded em português

Segue a lista completa de componentes que ainda precisam de `useLanguage()` + `t()`:

**Tracking (sub-componentes):**
- `TrackingPedidosTable.tsx` — "Pedidos Consolidados", "Pesquisar...", headers de tabela ("Nº Mov.", "Pedido", "Tipo de Serviço", "Modalidade", "Campanha", "Qtde. SKU", "Vl. Tot.", "Prev. Entrega", "Entrega Real", "Status", "Cidade", "UF", "Solicitante"), "registros"
- `TrackingItensTable.tsx` — "Itens dos Pedidos", "Pesquisar...", headers ("Pedido", "Cód. Item", "Descrição", "SubGrupo", "M³ Total", "Vl. Total"), "Nenhum dado disponível", "registros", "Vl. Total:"
- `TrackingStatusBars.tsx` — "Status Pedidos", "FINALIZADO", "TRÂNSITO", "Pedidos" (tooltip)
- `TrackingTipoServicoChart.tsx` — "Pedidos | Tipo de Serviço", "Pedidos" (tooltip)
- `TrackingModalidadeChart.tsx` — "Pedidos | Modalidade", "Pedidos" (tooltip)
- `TrackingCidadeChart.tsx` — "Entregas por Cidade", "FINALIZADO", "TRÂNSITO"
- `TrackingRegionalPieChart.tsx` — "Pedido | Região", "pedidos"
- `TrackingEstadoChart.tsx` — "Pedidos por Estado"
- `TrackingBrazilMap.tsx` — "Pedidos | Estado", "Contagem de Cod Conhecimento", "Sem Ocorrência", "Com Ocorrência", "% No Prazo", "% Fora do Prazo"
- `TrackingGaugeChart.tsx` — "Performance", "No Prazo", "Fora do Prazo"

**Entregas:**
- `EntregasTables.tsx` — "ENTREGA", "REPOSIÇÃO", "REGIONAL", "UF", "FINALIZADO", "EM TRÂNSITO", "TOTAL", "Total"

**Estoque Consolidado (sub-componentes):**
- `StockDualKPICards.tsx` — "ESTOQUE MATRIZ (BARUERI)", "Valor", "M³", "Qtde SKUs", "Kits Completo"

**Dashboard (Minutas):**
- `RegionalBarChart.tsx` — "Comparativo por Regional", "Expedidas", "Baixadas", "Clique para filtrar"
- `RegionalLineCharts.tsx` — "Evolução Diária por Regional", "Dia X destacado"
- `Index.tsx` — "Configuração necessária", "Carregando dados", etc.

**Tracking.tsx page** — "Carregando dados", "Recuperando dados...", "Nenhum dado disponível", "Processando filtros...", "Configuração necessária"

**Entregas.tsx page** — "Carregando dados", "Recuperando dados...", "Nenhum dado disponível", "Processando filtros..."

### Novas chaves de tradução necessárias (em `src/i18n/translations.ts`)

Adicionar ~40 novas chaves cobrindo:
- Títulos de gráficos do Tracking
- Headers de tabelas
- Labels de tooltips
- Textos de estados vazios/loading
- Labels do mapa do Brasil

### Implementação

1. **Corrigir `TranslationsManager.tsx`**: verificar `{ error }` em insert/update/delete e mostrar erro real
2. **Expandir `src/i18n/translations.ts`** com todas as chaves faltantes
3. **Atualizar ~15 componentes** para usar `useLanguage()` + `t()`
4. **Padrão**: `import { useLanguage } from "@/contexts/LanguageContext"` + `const { t } = useLanguage()` + substituir strings

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/i18n/translations.ts` | +40 chaves pt-BR/en |
| `src/components/admin/TranslationsManager.tsx` | Fix save: check errors |
| `src/components/tracking/TrackingPedidosTable.tsx` | +useLanguage, t() em títulos/headers |
| `src/components/tracking/TrackingItensTable.tsx` | +useLanguage, t() em títulos/headers |
| `src/components/tracking/TrackingStatusBars.tsx` | +useLanguage, t() |
| `src/components/tracking/TrackingTipoServicoChart.tsx` | +useLanguage, t() |
| `src/components/tracking/TrackingModalidadeChart.tsx` | +useLanguage, t() |
| `src/components/tracking/TrackingCidadeChart.tsx` | +useLanguage, t() |
| `src/components/tracking/TrackingRegionalPieChart.tsx` | +useLanguage, t() |
| `src/components/tracking/TrackingEstadoChart.tsx` | +useLanguage, t() |
| `src/components/tracking/TrackingBrazilMap.tsx` | +useLanguage, t() |
| `src/components/tracking/TrackingGaugeChart.tsx` | +useLanguage, t() |
| `src/components/entregas/EntregasTables.tsx` | +useLanguage, t() |
| `src/components/stock/StockDualKPICards.tsx` | +useLanguage, t() |
| `src/components/dashboard/RegionalBarChart.tsx` | +useLanguage, t() |
| `src/components/dashboard/RegionalLineCharts.tsx` | +useLanguage, t() |
| `src/pages/Index.tsx` | +useLanguage, t() em textos de loading/empty |
| `src/pages/Tracking.tsx` | t() em textos de loading/empty restantes |
| `src/pages/Entregas.tsx` | t() em textos de loading/empty restantes |

