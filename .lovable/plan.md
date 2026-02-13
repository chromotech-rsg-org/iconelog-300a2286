
## Correcoes

### 1. Eixo X dos graficos mostra "10/00" em vez de "10/02"

**Problema**: O `MiniLineChart` usa `selectedMonths?.[0]` para formatar o eixo X, mas quando o calendario esta ativo, `selectedMonths` esta vazio (`[]`), resultando em `undefined` que vira `00`.

**Correcao**: Passar o `selectedDateRange` para o `MiniLineChart` (via `RegionalLineCharts`) e usar o mes da data selecionada quando `selectedMonths` estiver vazio. Se houver dados com datas variadas, extrair o mes diretamente dos dados do grafico.

Arquivo: `src/pages/Index.tsx`
- Passar `selectedDateRange` para `RegionalLineCharts`

Arquivo: `src/components/dashboard/RegionalLineCharts.tsx`
- Receber e repassar `selectedDateRange` para cada `MiniLineChart`

Arquivo: `src/components/dashboard/MiniLineChart.tsx`
- Receber `selectedDateRange` como prop
- No `tickFormatter` do eixo X, derivar o mes: se `selectedMonths` tiver valor, usa ele; senao usa o mes de `selectedDateRange.from`; senao usa o mes atual
- Formato: `dia/mes` (ex: `10/02`)

### 2. Calendario: comportamento de selecao de dia unico vs periodo

**Problema atual**: No modo "single", clicar em um dia funciona, mas o usuario quer um comportamento mais intuitivo sem precisar de toggle - primeiro clique filtra o dia, segundo clique em outro dia cria um periodo.

**Correcao**: Remover o toggle de modo e implementar logica inteligente:
- **1 clique**: seleciona aquele dia (from = to = dia clicado)
- **Clicar em outro dia quando ja tem 1 dia selecionado**: cria periodo (from = primeiro dia, to = segundo dia)
- **Clicar quando ja tem um periodo**: reseta e seleciona apenas o novo dia clicado
- **Clicar no mesmo dia ja selecionado (dia unico)**: limpa a selecao

Arquivo: `src/components/shared/CalendarFilter.tsx`
- Usar `mode="range"` sempre, mas controlar a logica manualmente
- Manter estado interno para saber se o usuario esta no "primeiro clique" ou "segundo clique"
- Primeiro clique: definir `from` e `to` como o mesmo dia (filtra imediatamente)
- Segundo clique em dia diferente: atualizar `to` para o novo dia (cria periodo)
- Qualquer clique quando ja existe um periodo: resetar para o novo dia clicado como dia unico
- Clique no mesmo dia unico: limpar selecao

---

## Resumo dos arquivos alterados

1. **`src/components/shared/CalendarFilter.tsx`** - Reescrever logica de selecao sem toggle
2. **`src/components/dashboard/MiniLineChart.tsx`** - Corrigir formatacao do eixo X usando dateRange
3. **`src/components/dashboard/RegionalLineCharts.tsx`** - Passar dateRange como prop
4. **`src/pages/Index.tsx`** - Passar selectedDateRange para RegionalLineCharts
