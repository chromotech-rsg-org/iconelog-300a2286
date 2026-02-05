
# Plano de Implementacao

Este plano aborda tres areas principais: (1) melhorias na tela de Configuracoes, (2) adicao de graficos e tabelas faltantes no B-Side Estoque, e (3) padronizacao dos filtros em todos os BIs.

---

## Resumo das Alteracoes

1. **Configuracoes - Sistema Administrativo**
   - Adicionar secao para upload de logo unico para telas administrativas (Login, Admin, Settings)
   - Adicionar campo de ordenacao (numero) para os BIs no menu

2. **B-Side Estoque - Graficos e Tabelas Faltantes**
   - Adicionar layout com duas colunas de KPIs (Estoque Matriz e Estoque Base)
   - Adicionar grafico de pizza "Representacao do Estoque | Grupo"
   - Adicionar grafico de barras "Valor Estoque | Grupo"
   - Adicionar grafico de pizza "Tempo Parado | SKU" (por periodos de tempo)
   - Adicionar grafico de barras "Tempo Parado Medio | Grupo"
   - Adicionar tabelas "Estoque Matriz" e "Estoque Base"

3. **Filtros Padronizados em Todos os BIs**
   - Adicionar filtros de meses, anos e regionais em todas as paginas de BI
   - Manter comportamento interativo existente (clique para filtrar)

---

## Alteracoes no Banco de Dados

### Nova Coluna e Tabela

```text
Tabela: bi_settings
  Nova coluna: display_order (integer, default 0)
  - Controla a ordem de exibicao dos BIs no menu de navegacao

Nova linha especial na tabela bi_settings:
  - page_id: "system" (para logo e nome do sistema administrativo)
  - display_name: "Relatorios Icone Log"
  - logo_url: null (pode ser atualizado)
```

---

## Arquivos a Criar/Modificar

### 1. Pagina de Configuracoes (src/pages/Settings.tsx)

**Alteracoes:**
- Adicionar secao separada no topo para "Logo do Sistema"
  - Este logo sera usado na tela de Login, Admin e Settings
  - Upload de imagem e campo de nome
- Adicionar campo numerico de "Ordem" para cada BI
- Reorganizar layout em duas areas: Sistema e BIs

**Nova estrutura visual:**

```text
+------------------------------------------+
|  CONFIGURACOES DO SISTEMA               |
+------------------------------------------+
| [Logo Sistema]  Nome: Relatorios ...    |
|                 [Upload] [Salvar]        |
+------------------------------------------+

+------------------------------------------+
|  CONFIGURACOES DOS BIs                   |
+------------------------------------------+
| Card BI 1:           | Card BI 2:        |
| [Logo] Nome: ...     | [Logo] Nome: ...  |
| Ordem: [1]           | Ordem: [2]        |
+------------------------------------------+
```

### 2. B-Side Estoque (src/pages/Estoque.tsx)

**Alteracoes Estruturais:**

O layout atual mostra apenas KPIs simples, uma tabela e um grafico de categoria. Baseado na imagem de referencia, precisa incluir:

```text
+------------------------+------------------------+
|   ESTOQUE MATRIZ       |   ESTOQUE BASE         |
| Valor | M3 | Qtde SKUs | Valor | M3 | Qtde SKUs |
+------------------------+------------------------+

+-------------+-------------+-------------------+
| Repr. Grupo | Valor Grupo | Estoque Matriz    |
| (Pie Chart) | (Bar Chart) | (Tabela detalhes) |
+-------------+-------------+-------------------+
| Tempo SKU   | Tempo Grupo | Estoque Base      |
| (Pie Chart) | (Bar Chart) | (Tabela detalhes) |
+-------------+-------------+-------------------+
```

**Novos Componentes:**
- `StockDualKPICards.tsx` - Cards duplos Matriz/Base
- `StockGroupPieChart.tsx` - Pizza de representacao por grupo
- `StockValueBarChart.tsx` - Barras de valor por grupo
- `StockTimePieChart.tsx` - Pizza de tempo parado por periodo
- `StockTimeBarChart.tsx` - Barras de tempo medio por grupo
- `StockMatrizTable.tsx` - Tabela detalhada Matriz
- `StockBaseTable.tsx` - Tabela detalhada Base

**Novos Dados (src/data/stockData.ts):**
- Adicionar campo `grupo` aos itens (FOOD D-SIDE, FOOD B-SIDE)
- Adicionar campo `tempoParado` (dias parado)
- Adicionar funcoes para calcular Matriz vs Base
- Adicionar funcoes para agrupar por tempo parado

### 3. Filtros Globais - SharedHeader e Paginas

**SharedHeader (src/components/shared/SharedHeader.tsx):**
- Ja possui suporte a filtros (showFilters=true)
- Verificar se precisa ajustes para todos os BIs

**Paginas que precisam adicionar filtros:**
- `src/pages/Estoque.tsx` - adicionar showFilters=true
- `src/pages/Entregas.tsx` - adicionar showFilters=true
- `src/pages/Tracking.tsx` - adicionar showFilters=true
- `src/pages/Faturamento.tsx` - adicionar showFilters=true
- `src/pages/EstoqueConsolidado.tsx` - adicionar showFilters=true
- `src/pages/Analitico.tsx` - adicionar showFilters=true

**Para cada pagina, adicionar:**
```typescript
const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth]);
const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
```

E passar para o SharedHeader:
```typescript
<SharedHeader
  showFilters={true}
  selectedMonths={selectedMonths}
  selectedYears={selectedYears}
  selectedRegions={selectedRegions}
  onMonthsChange={setSelectedMonths}
  onYearsChange={setSelectedYears}
  onRegionsChange={setSelectedRegions}
  // ... outros props
/>
```

### 4. Menu de Navegacao Ordenado

**NavigationMenu (src/components/shared/NavigationMenu.tsx):**
- Modificar para buscar BIs ordenados pelo campo `display_order`
- Atualizar contexto BiSettingsContext para fornecer ordem

**BiSettingsContext (src/contexts/BiSettingsContext.tsx):**
- Adicionar funcao `getOrderedPages()` que retorna BIs ordenados
- Usar essa funcao no NavigationMenu

### 5. Logo do Sistema nas Telas Administrativas

**Arquivos afetados:**
- `src/pages/Auth.tsx` - usar logo do sistema
- `src/pages/Admin.tsx` - usar logo do sistema (via SharedHeader)
- `src/pages/Settings.tsx` - usar logo do sistema (via SharedHeader)

**BiSettingsContext:**
- Adicionar funcao `getSystemLogo()` que retorna logo para page_id="system"
- Adicionar funcao `getSystemName()` que retorna nome do sistema

---

## Secao Tecnica

### Migracao SQL

```sql
-- Adicionar coluna de ordenacao
ALTER TABLE bi_settings 
ADD COLUMN display_order integer NOT NULL DEFAULT 0;

-- Inserir registro do sistema
INSERT INTO bi_settings (page_id, display_name, logo_url, display_order)
VALUES ('system', 'Relatorios Icone Log', NULL, -1);

-- Definir ordem inicial dos BIs existentes
UPDATE bi_settings SET display_order = 1 WHERE page_id = 'minutas';
UPDATE bi_settings SET display_order = 2 WHERE page_id = 'entregas';
UPDATE bi_settings SET display_order = 3 WHERE page_id = 'estoque';
UPDATE bi_settings SET display_order = 4 WHERE page_id = 'tracking';
UPDATE bi_settings SET display_order = 5 WHERE page_id = 'estoque-consolidado';
UPDATE bi_settings SET display_order = 6 WHERE page_id = 'faturamento';
UPDATE bi_settings SET display_order = 7 WHERE page_id = 'analitico';
```

### Hook useBiSettings - Novas Funcoes

```typescript
// Retorna configuracao do sistema (login/admin/settings)
const getSystemSetting = (): BiSetting | undefined => {
  return settings.find(s => s.page_id === 'system');
};

// Retorna BIs ordenados (exclui 'system')
const getOrderedBiSettings = (): BiSetting[] => {
  return settings
    .filter(s => s.page_id !== 'system')
    .sort((a, b) => a.display_order - b.display_order);
};

// Atualiza ordem de um BI
const updateDisplayOrder = async (pageId: string, order: number) => {
  // ... update no banco
};
```

### Estrutura de Dados do Estoque Expandida

```typescript
export interface SKUItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  grupo: 'FOOD D-SIDE' | 'FOOD B-SIDE';  // NOVO
  stockQuantity: number;
  kitsQuantity: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  m3: number;  // NOVO - volume em metros cubicos
  tempoParado: number;  // NOVO - dias parado
  imageUrl: string;
  lastUpdate: Date;
  location: string;
  locationType: 'matriz' | 'base';  // NOVO
  base?: string;  // NOVO - nome da base (se locationType='base')
  supplier: string;
}

// Funcao para categorizar tempo parado
export const getTempoParadoCategory = (dias: number): string => {
  if (dias <= 30) return 'Antes que 30 dias';
  if (dias <= 60) return 'Entre 31 e 60 dias';
  if (dias <= 90) return 'Entre 61 e 90 dias';
  return 'Mais que 91 dias';
};
```

### Fluxo de Filtros nas Paginas

Cada pagina de BI tera:

1. **Estados de filtro globais** (mes, ano, regional)
2. **Estados de filtro interativos** (especificos de cada BI)
3. **Dados filtrados via useMemo** combinando ambos
4. **Barra de filtros ativos** mostrando todos os filtros aplicados

---

## Ordem de Implementacao

1. **Fase 1 - Banco de Dados**
   - Criar migracao para adicionar coluna display_order
   - Inserir registro 'system' na tabela bi_settings

2. **Fase 2 - Hook e Contexto**
   - Atualizar useBiSettings com novas funcoes
   - Atualizar BiSettingsContext para expor funcoes de sistema e ordenacao

3. **Fase 3 - Pagina Settings**
   - Adicionar secao de logo/nome do sistema
   - Adicionar campo de ordem para cada BI
   - Atualizar layout visual

4. **Fase 4 - B-Side Estoque**
   - Expandir dados mockados com novos campos
   - Criar novos componentes visuais
   - Atualizar layout da pagina

5. **Fase 5 - Filtros em Todas as Paginas**
   - Adicionar estados de filtro em cada BI
   - Habilitar showFilters=true no SharedHeader
   - Integrar filtros com dados existentes

6. **Fase 6 - Menu Ordenado**
   - Atualizar NavigationMenu para usar ordem do banco
   - Usar logo do sistema nas telas administrativas

