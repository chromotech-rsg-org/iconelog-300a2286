

## Analysis

Looking at `getEntregasData` in `src/hooks/useFollowupData.ts` (lines 513-524), the current campaign classification logic is:

```text
Campaign normalized → contains "REPOSICAO" or "REPOSITIVACAO" → reposicao
Campaign normalized → contains "KIT RESTAURANTE" or "POSITIVACAO" → entrega
Otherwise → skip (item ignored)
```

Checking the 3 requested campaigns against this logic:
- **99FOOD_BASICO_POSITIVAÇÃO KIT** → normalized to `99FOOD_BASICO_POSITIVACAO KIT` → already matches "POSITIVACAO" → **already counted as entrega** ✓
- **99FOOD_BASICO_KIT RESTAURANTE** → matches "KIT RESTAURANTE" → **already counted as entrega** ✓  
- **99FOOD_PIZZA KIT** → does NOT match any pattern → **currently ignored** ✗

## Plan

Only one change is needed: add `"PIZZA KIT"` (or `"99FOOD_PIZZA"`) to the entrega classification conditions in `getEntregasData`.

**File: `src/hooks/useFollowupData.ts`** (line ~521)

Change the entrega condition from:
```ts
} else if (campanhaNorm.includes("KIT RESTAURANTE") || campanhaNorm.includes("POSITIVACAO")) {
```
to:
```ts
} else if (campanhaNorm.includes("KIT RESTAURANTE") || campanhaNorm.includes("POSITIVACAO") || campanhaNorm.includes("PIZZA KIT")) {
```

This single-line change ensures all 3 campaigns are classified as "ENTREGAS".

