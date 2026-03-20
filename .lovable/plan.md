

## Problema

Dois problemas identificados:

1. **404 na página duplicada**: O `DynamicBiRoute.tsx` usa um mapa fixo (`pageComponents`) que mapeia `page_id` para componentes. O BI duplicado tem `page_id: entregas-copy-1774032238111`, que não existe no mapa, causando 404.

2. **Filtro de campanhas**: O `getEntregasData` atual **exclui** as campanhas BASICO (linhas 556-557). O novo BI "Kit Básico" precisa mostrar **apenas** essas campanhas.

## Plano

### 1. Resolver duplicações automáticas no DynamicBiRoute

**Arquivo**: `src/components/auth/DynamicBiRoute.tsx`

Alterar a lógica para que, quando o `page_id` não for encontrado no mapa fixo, ele tente extrair o `page_id` base (antes do `-copy-`). Exemplo: `entregas-copy-1774032238111` resolve para `entregas`, que existe no mapa. Isso faz qualquer BI duplicado funcionar automaticamente.

```
page_id "entregas-copy-1774032238111" → base "entregas" → pageComponents["entregas"] ✓
```

### 2. Criar variante de getEntregasData com filtro de campanhas parametrizável

**Arquivo**: `src/hooks/useFollowupData.ts`

Adicionar um parâmetro `campaignMode` ao `getEntregasData`:
- `"kit-completo"` (padrão atual): exclui campanhas BASICO
- `"kit-basico"`: inclui **apenas** campanhas BASICO (POSITIVAÇÃO KIT, KIT RESTAURANTE para Entrega; REPOSIÇÃO KIT para Reposição)

### 3. Fazer a página Entregas detectar qual BI está renderizando

**Arquivo**: `src/pages/Entregas.tsx`

Usar o slug ou page_id atual (via URL ou contexto) para determinar se deve usar `"kit-completo"` ou `"kit-basico"`. Quando o slug é `b-side-entregas-kit-basico`, passa `campaignMode="kit-basico"` para `getEntregasData`.

Lógica:
- Detectar o `page_id` do BI atual via `useParams` + `useBiSettings`
- Se o `page_id` contém `entregas` e o slug contém `basico` → modo `kit-basico`
- Caso contrário → modo `kit-completo` (comportamento atual)

### 4. Ajustar codCli para usar o page_id correto

**Arquivo**: `src/pages/Entregas.tsx`

O `getCodCli("entregas")` está hardcoded. Precisa resolver o `cod_cli` do BI atual (que pode ser `entregas-copy-...`), fazendo fallback para o base `entregas` se necessário.

## Detalhes Técnicos

**Resolução de page_id base** (DynamicBiRoute):
```typescript
function resolveBasePageId(pageId: string): string {
  if (pageComponents[pageId]) return pageId;
  const base = pageId.replace(/-copy-\d+$/, "");
  return pageComponents[base] ? base : pageId;
}
```

**Campanhas Kit Básico** (apenas estas 3):
- Entrega: `99FOOD_BASICO_POSITIVAÇÃO KIT`, `99FOOD_BASICO_KIT RESTAURANTE`
- Reposição: `99FOOD_BASICO_REPOSIÇÃO KIT`

**Arquivos a modificar**:
- `src/components/auth/DynamicBiRoute.tsx` — resolver page_id base para duplicações
- `src/hooks/useFollowupData.ts` — parametrizar filtro de campanhas
- `src/pages/Entregas.tsx` — detectar modo e passar parâmetro correto

