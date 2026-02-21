

## Tracking Consolidado - Correcao de Valores e Mapa Interativo

### Problemas Identificados

1. **Valores nao batem com o Power BI**: A funcao `getTrackingData` filtra por campos de data (`dt_previsao`, `dt_entrega_real`, `dt_expedicao`) em vez de usar os tags `_fetch_month`/`_fetch_year` que ja foram corrigidos no modulo de Entregas. Isso causa a mesma discrepancia de valores.

2. **Mapa do Brasil - Hover/Tooltip nao funciona**: O codigo atual tenta detectar estados via atributo `data-uf` nos elementos SVG, mas a biblioteca `react-brazil-heatmap` NAO renderiza esse atributo. Por isso, o tooltip nunca aparece ao passar o mouse.

3. **Mapa do Brasil - Clique para filtrar**: O `onClick` do componente ja esta conectado, mas a deteccao de estado no hover esta quebrada. A biblioteca tem um componente `Tooltip` proprio que pode ser usado como child do `BrazilHeatmap`.

4. **Tamanho do mapa pequeno**: O mapa esta dentro de um container com `h-1/2` (metade de 480px = 240px), e o card tem padding/header que reduzem ainda mais o espaco.

---

### Plano de Implementacao

#### 1. Corrigir filtro de dados do Tracking (`src/hooks/useFollowupData.ts`)

Na funcao `getTrackingData`, aplicar a mesma logica de `_fetch_month`/`_fetch_year` que ja funciona em `getEntregasData`:

- Quando `months`/`years` estiverem ativos (sem dateRange), priorizar os tags `_fetch_month` e `_fetch_year` dos registros
- Manter fallback para parsing de campos de data para dados de cache antigos

#### 2. Reescrever o componente do Mapa (`src/components/tracking/TrackingBrazilMap.tsx`)

**Substituir a logica de hover customizada** (que depende de `data-uf` inexistente) pelo componente `Tooltip` nativo da biblioteca:

- Usar `metadata` prop do `BrazilHeatmap` para passar dados de cada estado (Nome Estado, Contagem de Cod Conhecimento, Sem/Com Ocorrencia, % No Prazo, % Fora do Prazo)
- Usar o componente `<Tooltip>` como child do `<BrazilHeatmap>` com `trigger="hover"` e `float` habilitado
- Customizar o `tooltipContent` para renderizar o layout igual ao Power BI (imagem 2): tabela com "Nome Estado", "Contagem de Cod Conhecimento", "Sem Ocorrencia", "Com Ocorrencia", "% No Prazo", "% Fora do Prazo"
- Manter o `onClick` para filtrar todo o BI pelo estado clicado
- Manter o destaque visual (opacity/stroke) para o estado selecionado

#### 3. Aumentar tamanho do mapa no layout (`src/pages/Tracking.tsx`)

- Alterar a proporcao do bloco que contem Regional Pie + Mapa: em vez de `h-1/2` cada, dar mais espaco ao mapa (ex: `h-[40%]` para pie e `h-[60%]` para mapa)
- Reduzir padding interno do card do mapa para maximizar area util
- Aumentar a `height` fixa do Bloco 2 de 480px para ~520px

---

### Detalhes Tecnicos

**`getTrackingData` - filtro corrigido:**
```typescript
// Usar _fetch_month/_fetch_year tags (mesmo padrao do getEntregasData)
if (item._fetch_month != null && item._fetch_year != null) {
  const matchYear = years.length === 0 || years.includes(item._fetch_year);
  const matchMonth = months.length === 0 || months.includes(item._fetch_month);
  return matchYear && matchMonth;
}
// Fallback para dados sem tags
```

**`TrackingBrazilMap` - tooltip nativo:**
```typescript
import BrazilHeatmap, { Tooltip } from "react-brazil-heatmap";

// Usar metadata para passar dados extras por UF
const metadata = { SP: { name: "Sao Paulo", pedidos: 1392, ... }, ... };

<BrazilHeatmap data={heatmapData} metadata={metadata} onClick={handleClick}>
  <Tooltip float trigger="hover" tooltipContent={(meta) => (
    <div>/* Layout igual Power BI */</div>
  )} />
</BrazilHeatmap>
```

### Arquivos a Modificar

| Arquivo | Alteracao |
|---|---|
| `src/hooks/useFollowupData.ts` | Corrigir `getTrackingData` para usar `_fetch_month`/`_fetch_year` |
| `src/components/tracking/TrackingBrazilMap.tsx` | Reescrever tooltip com componente nativo da biblioteca + aumentar mapa |
| `src/pages/Tracking.tsx` | Ajustar proporcoes do layout do Bloco 2 para mapa maior |

### Resultado Esperado

- Valores do Tracking batem com o Power BI (15.160 pedidos, 90.67% no prazo)
- Mapa do Brasil maior e mais visivel
- Ao passar o mouse em um estado, tooltip aparece com: Nome Estado, Contagem, Sem/Com Ocorrencia, % No Prazo, % Fora do Prazo
- Ao clicar em um estado, filtra todo o dashboard pelo estado selecionado (ja funciona, so o feedback visual melhora)

