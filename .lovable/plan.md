

## Plano de Implementacao - Multiplas Melhorias

### 1. Filtrar perfil "Desenvolvedor" no seletor de perfis (Novo Usuario)

**Problema:** Usuarios nao-dev veem o perfil "Desenvolvedor" no dropdown ao criar/editar usuarios.

**Solucao:** No `Admin.tsx`, filtrar a lista de `roles` no `<Select>` de perfil do usuario para esconder roles vinculadas a dev (o perfil "Desenvolvedor" ID `00000000-0000-0000-0000-000000000002`) quando `isDeveloper` for false.

### 2. Mover "Empresas / Clientes" e "Produtos & Kits" para fora de Configuracoes

**Solucao:** No `AdminSidebar.tsx`, mover esses dois itens de `configItems` para `mainItems`, mantendo-os no mesmo nivel dos outros menus como Usuarios, Perfis, etc.

### 3. Formatar data "Ult. Ent. Data" no padrao brasileiro (dd/MM/yyyy)

**Solucao:** No `StockLocationTables.tsx`, formatar `item.lastEntryDate` usando uma funcao que converte a data da API para formato `dd/MM/yyyy`. Aplicar tambem no tooltip hover e no modal.

### 4. Inverter colunas "Ult. Ent. Qtd" e "Ult. Ent. Data"

**Solucao:** No `StockLocationTables.tsx`, trocar a ordem dos `<TableHead>` e `<TableCell>` dessas duas colunas - Data vem antes, Qtd depois.

### 5. Dados do fornecedor em negrito

**Solucao:** No `StockLocationTables.tsx`, alterar a classe CSS da celula do fornecedor de `text-muted-foreground` para `text-foreground font-semibold`.

### 6. Aumentar fonte 1 tamanho em todo o B-Side Estoque

**Solucao:** Nos componentes do B-Side Estoque (`StockDualKPICards.tsx`, `StockLocationTables.tsx`), incrementar cada classe de texto em 1 nivel do Tailwind:
- `text-xs` -> `text-sm`
- `text-sm` -> `text-base`
- `text-lg` -> `text-xl`
- `text-xl` -> `text-2xl`

### 7. Campo "Produtos Unificados" e logica de Kits Completo

**Mudanca no banco:** Adicionar coluna `unified_code` (text, nullable) na tabela `stock_product_whitelist`.

**UI - StockProductsManager:** Adicionar campo "Produtos Unificados" no formulario e na tabela.

**Logica - Estoque.tsx:** No calculo de `kitsCompleto`:
1. Para cada produto, verificar se possui `unified_code` na whitelist.
2. Agrupar produtos pelo `unified_code` e somar seus `kitsQuantity`.
3. Produtos sem `unified_code` manteem seu valor individual.
4. O `kitsCompleto` sera o `Math.min()` entre todos os valores agrupados/individuais.
5. O valor de kits na **linha de cada produto** permanece inalterado.

**Exemplo:** Produto A (200 kits, codigo unificado "X") + Produto B (500 kits, codigo unificado "X") = 700 kits agrupados. Produto C (400 kits, sem codigo unificado) = 400 individual. Kits Completo = min(700, 400) = 400.

---

### Detalhes Tecnicos

**Arquivos modificados:**
- `src/pages/Admin.tsx` - Filtro de roles no selector
- `src/components/admin/AdminSidebar.tsx` - Reorganizar menus
- `src/components/stock/StockLocationTables.tsx` - Formato de data BR, inversao de colunas, fornecedor negrito, aumento de fonte
- `src/components/stock/StockDualKPICards.tsx` - Aumento de fonte
- `src/components/admin/StockProductsManager.tsx` - Campo unified_code
- `src/hooks/useEstoqueData.ts` - Carregar unified_code da whitelist
- `src/pages/Estoque.tsx` - Nova logica de kitsCompleto com agrupamento

**Migracao SQL:**
```sql
ALTER TABLE public.stock_product_whitelist 
ADD COLUMN unified_code text;
```

