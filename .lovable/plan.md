

# Plano de Implementacao Completa - Sistema de Relatorios

## Visao Geral

Este plano cobre a implementacao completa do sistema de relatorios com:
- Header unificado em todas as paginas
- Melhorias no B-Side Estoque (tabela com paginacao, grafico ajustado, modal de detalhes)
- Novas paginas: B-Side Entregas, Tracking Consolidado, Estoque Consolidado, Faturamento, Analitico
- Sistema de Admin com usuarios, perfis e permissoes (usando dados mock)

---

## Fase 1: Componentes Compartilhados

### 1.1 Header Unificado (SharedHeader)

Criar um componente de header reutilizavel que sera usado em todas as paginas:

**Estrutura do Header:**
- Logo + Nome da aba ativa (ex: "B-Side Estoque", "Minutas Expedidas x Baixadas")
- Ultima atualizacao + botao de refresh
- Filtros (meses, ano, regional) - visibilidade controlada por props
- Botao Exportar Excel
- Menu de navegacao (hamburger)
- Menu Admin (apenas para usuarios com permissao)

**Arquivos a criar:**
- `src/components/shared/SharedHeader.tsx` - Header unificado
- `src/components/shared/NavigationMenu.tsx` - Menu de navegacao

### 1.2 Sistema de Permissoes (Mock)

**Estrutura de dados:**
```text
Usuario:
- id, nome, email, senha (hash), perfilId
- isDeveloper (boolean - oculto de todos)

Perfil:
- id, nome
- permissoes: {
    paginaId: {
      visualizar: boolean,
      exportar: boolean,
      atualizar: boolean,
      acessoPublico: boolean (sem login),
      apenasDev: boolean
    }
  }
```

**Arquivos a criar:**
- `src/data/authData.ts` - Dados mock de usuarios e perfis
- `src/contexts/AuthContext.tsx` - Contexto de autenticacao
- `src/hooks/usePermissions.ts` - Hook para verificar permissoes

---

## Fase 2: Melhorias no B-Side Estoque

### 2.1 Tabela Aprimorada

Baseado na imagem de referencia "Pedidos Consolidados":

**Melhorias:**
- Dropdown "Mostrar: 10/25/50/100" para itens por pagina
- Campo de busca no canto direito
- Paginacao numerada (1/14, etc.)
- Contador de registros (ex: "134 registros")
- Barra de rolagem estilizada
- Icone de expandir (fullscreen)
- Largura reduzida da tabela

**Arquivos a modificar:**
- `src/components/stock/StockTable.tsx`

### 2.2 Grafico de Categoria Ajustado

Corrigir o grafico de pizza que esta cortando:

**Melhorias:**
- Aumentar altura do container
- Ajustar padding interno
- Legenda posicionada corretamente

**Arquivos a modificar:**
- `src/components/stock/StockCategoryChart.tsx`

### 2.3 Painel de Produto Simplificado + Modal Detalhado

**Novo fluxo:**
1. Ao clicar no produto na tabela: mostra preview simplificado abaixo do grafico
2. Botao "Mais Detalhes" abre modal maior com todas as informacoes

**Arquivos a criar/modificar:**
- `src/components/stock/ProductSimplePreview.tsx` - Preview compacto
- `src/components/stock/ProductDetailModal.tsx` - Modal completo
- Modificar `src/pages/Estoque.tsx` para novo layout

---

## Fase 3: Novas Paginas

### 3.1 B-Side Entregas (/entregas)

Baseado na imagem "Kit Restaurante":

**Componentes:**
- Header com filtros de mes/ano
- Cards: Entrega Finalizado, Entrega em Transito, Reposicao Finalizado, Reposicao em Transito
- Barras de progresso (Entrega/Reposicao)
- Grid de cards por regiao (Sao Paulo, Rio de Janeiro, etc.)
- Tabelas de Entrega e Reposicao por regional

**Arquivos a criar:**
- `src/pages/Entregas.tsx`
- `src/components/entregas/EntregasKPICards.tsx`
- `src/components/entregas/ProgressBars.tsx`
- `src/components/entregas/RegionalCards.tsx`
- `src/components/entregas/EntregasTable.tsx`
- `src/data/entregasData.ts`

### 3.2 Tracking Consolidado (/tracking)

Baseado na imagem "Tracking Entrega":

**Componentes:**
- Filtros de meses + tabs B-SIDE / D-SIDE
- KPIs: Quantidade de Pedidos, Qtde no Prazo, % no Prazo, etc.
- Status Pedidos (Finalizado, Transito)
- Pedidos por Tipo de Servico (barras horizontais)
- Performance (grafico donut)
- Pedidos por Modalidade
- Entregas por Cidade (barras horizontais)
- Pedido por Regiao (mapa/pizza)
- Pedidos por Estado
- Tabelas: Pedidos Consolidados, Itens dos Pedidos

**Arquivos a criar:**
- `src/pages/Tracking.tsx`
- `src/components/tracking/TrackingKPIs.tsx`
- `src/components/tracking/PerformanceChart.tsx`
- `src/components/tracking/DeliveryByCity.tsx`
- `src/components/tracking/OrdersTable.tsx`
- `src/data/trackingData.ts`

### 3.3 Estoque Consolidado (/estoque-consolidado)

Baseado na imagem "Estoque":

**Componentes:**
- Cards ESTOQUE MATRIZ (Valor, M3, Qtde SKUs)
- Cards ESTOQUE BASE
- Grafico pizza "Representacao do Estoque | Grupo"
- Grafico "Tempo Parado | SKU"
- Grafico barras "Valor Estoque | Grupo"
- Grafico "Tempo Parado Medio | Grupo"
- Tabelas: Estoque Matriz, Estoque Base

**Arquivos a criar:**
- `src/pages/EstoqueConsolidado.tsx`
- `src/components/estoque-consolidado/EstoqueKPIs.tsx`
- `src/components/estoque-consolidado/EstoqueCharts.tsx`
- `src/components/estoque-consolidado/EstoqueTables.tsx`
- `src/data/estoqueConsolidadoData.ts`

### 3.4 Faturamento (/faturamento)

Baseado na imagem "Faturamento":

**Componentes:**
- Tabs B-SIDE / D-SIDE
- Card grande "Faturamento" (R$ 645.600)
- Cards: R$ Armazenagem, % Armazenagem, R$ Transporte, % Transporte
- Grafico "Transporte Mensal"
- Grafico linha "Faturamento Mensal"
- Pizza "Faturamento | Regiao"
- Barras "Faturamento | Modalidade"
- Barras "Faturamento | Tipo de Servico"
- Barras "Faturamento | Campanha"
- Grafico "Armazenagem Mensal"

**Arquivos a criar:**
- `src/pages/Faturamento.tsx`
- `src/components/faturamento/FaturamentoKPIs.tsx`
- `src/components/faturamento/FaturamentoCharts.tsx`
- `src/data/faturamentoData.ts`

### 3.5 Analitico (/analitico)

**Componentes:**
- Dashboard com metricas avancadas
- Graficos comparativos
- Tabelas de dados detalhados
- 6 navegacoes internas (sub-abas)

**Arquivos a criar:**
- `src/pages/Analitico.tsx`
- `src/components/analitico/*`
- `src/data/analiticoData.ts`

---

## Fase 4: Sistema de Admin

### 4.1 Pagina de Login (/auth)

**Funcionalidades:**
- Login com email/senha
- Opcao "Acessar sem login" para paginas publicas
- Redirecionar para pagina principal apos login

**Arquivos a criar:**
- `src/pages/Auth.tsx`

### 4.2 Pagina de Admin (/admin)

**Secoes:**

**4.2.1 Gerenciamento de Usuarios**
- Lista de usuarios (exceto desenvolvedor)
- Criar/Editar/Excluir usuarios
- Atribuir perfil ao usuario

**4.2.2 Gerenciamento de Perfis**
- Lista de perfis
- Criar/Editar/Excluir perfis
- Matriz de permissoes por pagina:
  - Visualizar
  - Exportar
  - Atualizar
  - Acesso Publico (sem login)
  - Apenas Desenvolvedor

**Arquivos a criar:**
- `src/pages/Admin.tsx`
- `src/components/admin/UserManagement.tsx`
- `src/components/admin/ProfileManagement.tsx`
- `src/components/admin/PermissionsMatrix.tsx`

### 4.3 Protecao de Rotas

- HOC ou wrapper para verificar permissoes
- Redirecionar para login se nao autenticado
- Mostrar "Acesso negado" se sem permissao

**Arquivos a criar:**
- `src/components/auth/ProtectedRoute.tsx`

---

## Fase 5: Atualizacoes de Navegacao e Rotas

### 5.1 App.tsx - Novas Rotas

```text
/               - Minutas Expedidas x Baixadas (Index)
/estoque        - B-Side Estoque
/entregas       - B-Side Entregas
/tracking       - Tracking Consolidado
/estoque-consolidado - Estoque Consolidado
/faturamento    - Faturamento
/analitico      - Analitico
/admin          - Painel de Administracao
/auth           - Login
```

### 5.2 Menu de Navegacao Atualizado

Adicionar "Admin" ao menu (visivel apenas para usuarios com permissao).

---

## Secao Tecnica

### Estrutura de Arquivos Final

```text
src/
  contexts/
    AuthContext.tsx
  hooks/
    usePermissions.ts
  data/
    mockData.ts (existente)
    stockData.ts (existente)
    authData.ts (novo)
    entregasData.ts (novo)
    trackingData.ts (novo)
    estoqueConsolidadoData.ts (novo)
    faturamentoData.ts (novo)
    analiticoData.ts (novo)
  components/
    shared/
      SharedHeader.tsx
      NavigationMenu.tsx
    auth/
      ProtectedRoute.tsx
    admin/
      UserManagement.tsx
      ProfileManagement.tsx
      PermissionsMatrix.tsx
    stock/
      (melhorias nos existentes)
      ProductSimplePreview.tsx
      ProductDetailModal.tsx
    entregas/
      EntregasKPICards.tsx
      ProgressBars.tsx
      RegionalCards.tsx
      EntregasTable.tsx
    tracking/
      TrackingKPIs.tsx
      PerformanceChart.tsx
      DeliveryByCity.tsx
      OrdersTable.tsx
    estoque-consolidado/
      EstoqueKPIs.tsx
      EstoqueCharts.tsx
      EstoqueTables.tsx
    faturamento/
      FaturamentoKPIs.tsx
      FaturamentoCharts.tsx
    analitico/
      (componentes especificos)
  pages/
    Index.tsx (atualizar header)
    Estoque.tsx (atualizar layout)
    Entregas.tsx (novo)
    Tracking.tsx (novo)
    EstoqueConsolidado.tsx (novo)
    Faturamento.tsx (novo)
    Analitico.tsx (novo)
    Admin.tsx (novo)
    Auth.tsx (novo)
```

### Dependencias Existentes

O projeto ja possui todas as dependencias necessarias:
- recharts (graficos)
- xlsx e file-saver (exportacao Excel)
- radix-ui (componentes UI)
- react-router-dom (navegacao)

### Padroes de Codigo

- Usar variaveis CSS do tema (dashboard-accent, dashboard-blue, etc.)
- Seguir padrao de componentes existentes
- Manter consistencia visual com dark theme
- Usar formatNumber e formatCurrency de mockData.ts

---

## Resumo de Entregaveis

| Fase | Componentes | Paginas |
|------|-------------|---------|
| 1 | SharedHeader, NavigationMenu, AuthContext | - |
| 2 | StockTable (melhorado), StockCategoryChart (ajustado), ProductSimplePreview, ProductDetailModal | Estoque (atualizado) |
| 3 | 20+ novos componentes | Entregas, Tracking, EstoqueConsolidado, Faturamento, Analitico |
| 4 | UserManagement, ProfileManagement, PermissionsMatrix, ProtectedRoute | Admin, Auth |
| 5 | - | App.tsx (rotas atualizadas), Index.tsx (header atualizado) |

---

## Observacoes Importantes

1. **Usuario Desenvolvedor**: Sera criado automaticamente nos dados mock, mas ficara completamente oculto de todos os usuarios normais. Nenhuma interface mostrara este usuario ou perfil.

2. **Permissoes "Apenas Dev"**: Funcionalidades marcadas como "apenasDev" so serao visiveis quando logado como desenvolvedor.

3. **Dados Mock**: Todos os dados sao simulados. Estrutura preparada para futura integracao com API real.

4. **Escopo Grande**: Por ser um projeto extenso, a implementacao sera feita de forma incremental, garantindo que cada parte funcione antes de avancar.

