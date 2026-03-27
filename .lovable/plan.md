

## Problem

The KPI card for "M³" in Estoque Base sums the **unit M³** (`i.m3`) per row, resulting in ~2110.6. The table footer correctly calculates **M³ Total** (`i.m3 * i.saldo`), resulting in ~5,427,616.99.

The table footer is correct. The KPI card needs to match.

## Fix

**File: `src/pages/EstoqueConsolidado.tsx`** (line 144)

Change the `filteredBaseTotals.m3` calculation from:
```ts
m3: filteredBase.reduce((s, i) => s + i.m3, 0),
```
to:
```ts
m3: filteredBase.reduce((s, i) => s + (i.m3 * i.saldo), 0),
```

This single-line change makes the KPI card show M³ Total (unit M³ × stock quantity), matching the table footer.

