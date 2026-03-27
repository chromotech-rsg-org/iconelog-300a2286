

## Ajuste: M³ nos cards com 1 casa decimal

**Arquivo:** `src/pages/EstoqueConsolidado.tsx`

Alterar a formatação dos valores de M³ nos KPI cards superiores (tanto Estoque Matriz quanto Estoque Base) de 4 casas decimais para 1 casa decimal.

Trocar `minimumFractionDigits: 4, maximumFractionDigits: 4` por `minimumFractionDigits: 1, maximumFractionDigits: 1` apenas nos cards KPI de M³. As tabelas e rodapés continuam com 4 casas decimais.

