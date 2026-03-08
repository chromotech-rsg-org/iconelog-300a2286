

# Plan: Fix 2025 Data, Translation System, and Map Filter

## Issue 1: 2025 Data Not Showing in BIs

**Root Cause**: Type mismatch in `getFaturamentoData` (line 664) — `ys.includes(item._fetch_year)` compares without `Number()` conversion. Also, line 285 uses strict equality `i._fetch_year === currentYear` which fails when `_fetch_year` is stored as a string in JSON cache.

**Fix** (in `src/hooks/useFollowupData.ts`):
- Line 285: Change `i._fetch_year === currentYear` to `Number(i._fetch_year) === currentYear`
- Line 664: Change `ys.includes(item._fetch_year)` to `ys.includes(Number(item._fetch_year))`
- Line 665: Change `ms.includes(item._fetch_month)` to `ms.includes(Number(item._fetch_month))`
- Audit all other `_fetch_year`/`_fetch_month` comparisons to ensure `Number()` wrapping

---

## Issue 2: Translation System Not Working + Permission + Language Management

**Root Causes**:
1. The `t()` function from `useLanguage` is never called in any page or component — all text is hardcoded in Portuguese
2. No admin permission controls the language toggle visibility
3. No admin UI to manage languages/translations

**Plan**:

### A. Add `tradutor` admin permission
- DB migration: Add `'tradutor'` to the `admin_permissions_permission_type_check` constraint
- This controls visibility of the language toggle in SharedHeader

### B. Fix translation toggle visibility
- In `SharedHeader.tsx`: Only show the language toggle button if the user has the `tradutor` permission (via `canViewAdmin('tradutor')`)

### C. Replace Globe icon with country flag
- Show 🇧🇷 (Brazilian flag emoji or SVG) for pt-BR, 🇺🇸 (US flag) for EN
- Remove the `Globe` icon import, use flag emoji text instead

### D. Make translations actually work
- In `SharedHeader.tsx`: Use `t()` for labels like "Última atualização", "Filtros", "Meses", "Ano", etc.
- In KPI components and chart titles across Tracking, Entregas, Estoque pages: wrap user-facing strings with `t()`
- Priority: header labels, KPI labels, filter labels, and chart titles (the most visible elements)

### E. Admin UI for managing translations
- Create a new admin section (under "Configurar BI" or new tab) where admins can:
  - See all translation keys
  - Add/edit translations for each language
  - Store custom translations in a new `translations` DB table
- DB migration: Create `translations` table with columns: `id`, `language`, `key`, `value`, `created_at`, `updated_at`
- The LanguageContext will load translations from DB, falling back to the hardcoded `translations.ts` dictionary

---

## Issue 3: Brazil Map Click Filter Not Working in Tracking

**Root Cause**: The `useEffect` that attaches click handlers via DOM uses `querySelector` with a 500ms delay, but: (1) SVG paths may use different selectors depending on `react-brazil-heatmap` version, and (2) re-renders may remove listeners. The click propagation may also be swallowed by the zoom/pan mouse handlers.

**Fix** (in `src/components/tracking/TrackingBrazilMap.tsx`):
- Add `pointer-events: all` to state paths via CSS
- Increase the timer or use a MutationObserver to ensure SVG is rendered
- Prevent drag handler from interfering: only set `isDragging` if mouse moved more than a threshold (e.g., 5px), so clicks don't get consumed by the drag logic
- Add `scale` to the useEffect dependency array to re-attach listeners after zoom changes
- Try using event delegation on the container instead of attaching to each path individually

---

## Files to Modify

1. **`src/hooks/useFollowupData.ts`** — Fix `Number()` coercion for `_fetch_year`/`_fetch_month` in all data getter functions
2. **`src/components/tracking/TrackingBrazilMap.tsx`** — Fix click handler attachment and drag/click distinction
3. **`src/components/shared/SharedHeader.tsx`** — Permission-gated language toggle, flag icons, use `t()` for labels
4. **`src/contexts/LanguageContext.tsx`** — Load translations from DB, merge with defaults
5. **`src/i18n/translations.ts`** — Expand translation keys for all UI labels
6. **DB migration** — Add `tradutor` to admin permissions check constraint, create `translations` table

## Files to Create

1. **Admin translations management component** (e.g., `src/components/admin/TranslationsManager.tsx`)

