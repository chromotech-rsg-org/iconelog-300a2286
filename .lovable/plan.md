

## Ajustes Visuais e Funcionais no Tracking Consolidado e Estoque Consolidado

### Tracking Consolidado

#### 1. KPI Card "Quantidade de Pedidos" - Aumentar numero (imagem 1)
- Aumentar o valor de `text-5xl` para `text-6xl` ou `text-7xl` no componente `TrackingKPICards.tsx`

#### 2. Cards laterais (No Prazo / Fora do Prazo) - Valores maiores (imagem 2)
- Aumentar valores de `text-xl` para `text-2xl` e labels de `text-[10px]` para `text-xs` em `TrackingKPICards.tsx`

#### 3. Gauge Chart - Contraste no hover (imagem 3)
- Nos botoes "No Prazo" / "Fora do Prazo" do `TrackingGaugeChart.tsx`, ajustar o hover para texto com contraste adequado (texto escuro sobre fundo claro, ou usar fundo mais opaco)

#### 4. Pedido | Regiao - Card maior e legenda a esquerda (imagem 4)
- No `TrackingRegionalPieChart.tsx`: ajustar `outerRadius`, posicionar a legenda com `layout="vertical" align="left"`, e garantir que o grafico nao seja cortado
- No `Tracking.tsx`, aumentar a proporcao do card de `h-[35%]` para `h-[40%]` na divisao Regional/Mapa

#### 5. Mapa do Brasil - Zoom e Pan
- No `TrackingBrazilMap.tsx`, envolver o mapa num container com CSS `transform`, `scale` e `translate`
- Implementar zoom via `onWheel` (scroll do mouse) e pan via `mousedown + mousemove + mouseup`
- Usar `useState` para `scale` e `translate` e aplicar via `style={{ transform }}`

#### 6. Tabelas (Pedidos e Itens) - Rodape fixo na tabela + Scroll horizontal fixo
- Em `TrackingPedidosTable.tsx` e `TrackingItensTable.tsx`: garantir que a barra de paginacao (rodape) e a barra de scroll horizontal fiquem fixas na area visivel da tabela, sem depender do scroll do BI todo
- Usar estrutura CSS com `flex-col`, `overflow-y: auto` no corpo da tabela e `sticky bottom-0` no rodape, com `overflow-x: scroll` visivel

---

### Estoque Consolidado

#### 7. Graficos de Rosca - Percentuais corretos e cores
- **Representacao do Estoque | Grupo** (grafico 1): tons de azul (conforme imagem 7), labels mostrando percentuais corretos
- **Valor Estoque | Grupo** (grafico 2): tons de azul, labels com valor em R$ dentro ou fora da barra (texto maior e legivel)
- **Tempo Parado | SKU** (grafico 3): legenda ao lado esquerdo, percentuais corretos conforme imagem 9 (25%, 39%, 16%, 19%), tons amarelos para "Antes que 30 dias" e "Entre 31 e 60 dias", laranja para "Entre 61 e 90 dias" e vermelho suave (nao rosa) para "Mais que 91 dias"
- **Tempo Parado Medio | Grupo** (grafico 4): tons amarelos, labels com valor "X dias"

#### 8. Correcao da formula SLA (Tempo Parado)
- O campo correto e `nr_qtde_dias_ultima` (conforme a formula do Power BI: `MAPALOGISTICO[Column1.nr_qtde_dias_ultima]`)
- Atualizar o hook `useEstoqueConsolidadoData.ts` para usar `item.nr_qtde_dias_ultima` em vez de `item.nr_qtde_dias_ultima_mov`, com fallback
- A logica de faixas ja esta correta: `< 30`, `<= 60`, `<= 90`, `> 90`

#### 9. Cores dos graficos
- Graficos 1 e 2 (Estoque Matriz): tons de **azul** (ex: `hsl(217, 91%, 60%)`, `hsl(217, 70%, 45%)`)
- Graficos 3 e 4 (Estoque Base): tons de **amarelo** (ex: `hsl(45, 100%, 50%)`, `hsl(45, 80%, 40%)`)
- Tempo Parado cores: verde claro (< 30 dias), amarelo (31-60), laranja (61-90), **vermelho suave** (91+ dias) - mudar de `hsl(340, 82%, 52%)` (rosa) para `hsl(0, 65%, 50%)` (vermelho mais suave)

#### 10. Cards KPI - Aumentar textos e valores
- Aumentar tamanho do texto nos cards ESTOQUE MATRIZ e ESTOQUE BASE (valores e labels maiores)

#### 11. Tabelas do Estoque Consolidado - Paginacao, busca e itens por pagina
- Adicionar controles de paginacao, campo de busca textual e seletor de itens por pagina (5, 10, 25, 50) nas tabelas Estoque Matriz e Estoque Base
- Manter rodape fixo na tabela com scroll horizontal visivel
- Comecar com 5 ou 10 itens por pagina

#### 12. Hover Card do produto - Campos Base, Cidade e UF
- O `EstoqueMatrizHoverCard` mostra dados da MAPALOGISTICO que nao tem campos `cidade` e `uf` nativamente
- Solucao: o campo `base` ja existe na MAPALOGISTICO; para cidade/uf, cruzar com SALDOBASE pelo codigo do produto, ou simplesmente exibir o campo `base` que ja esta no item
- Garantir que a imagem do produto carrega corretamente (URL `https://icone-api.bfranca.com.br/fotos/icone_${codigo}.jpg`) e mostrar fallback quando nao disponivel

---

### Detalhes Tecnicos

#### Arquivos a modificar:

| Arquivo | Alteracao |
|---|---|
| `src/components/tracking/TrackingKPICards.tsx` | Aumentar fontes dos valores e labels |
| `src/components/tracking/TrackingGaugeChart.tsx` | Melhorar contraste no hover dos botoes |
| `src/components/tracking/TrackingRegionalPieChart.tsx` | Aumentar grafico, legenda vertical a esquerda |
| `src/components/tracking/TrackingBrazilMap.tsx` | Adicionar zoom (scroll) e pan (drag) ao mapa |
| `src/components/tracking/TrackingPedidosTable.tsx` | Fixar rodape e scroll horizontal na tabela |
| `src/components/tracking/TrackingItensTable.tsx` | Fixar rodape e scroll horizontal na tabela |
| `src/pages/Tracking.tsx` | Ajustar proporcoes Regional/Mapa |
| `src/hooks/useEstoqueConsolidadoData.ts` | Corrigir campo SLA para `nr_qtde_dias_ultima` |
| `src/pages/EstoqueConsolidado.tsx` | Cores azuis/amarelas nos graficos, paginacao/busca nas tabelas, valores maiores nos cards, labels de valor em R$ no grafico de barras, legenda esquerda no Tempo Parado SKU |
| `src/components/stock/EstoqueProductHoverCard.tsx` | Verificar campos Base/Cidade/UF no hover card |

#### Zoom e Pan no mapa:
```text
Estado: { scale: number, translateX: number, translateY: number }
onWheel -> ajusta scale (min 1, max 4)
onMouseDown -> inicia drag
onMouseMove -> atualiza translate
onMouseUp -> finaliza drag
Container: overflow hidden, cursor grab/grabbing
SVG wrapper: transform: scale(scale) translate(translateX, translateY)
```

#### Tabelas com paginacao (Estoque Consolidado):
```text
Estado: search, page, perPage (default 10)
Controles: Input busca + Select (5,10,25,50) + Botoes prev/next
Rodape: sticky bottom-0 com contagem e navegacao
Scroll horizontal: overflow-x scroll visivel
```
