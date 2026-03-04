

# Plano de Implementação — 7 Melhorias nos BIs

## 1. Carregar dados de 2025 em todos os BIs (menos Minutas) — cache unificado

**Problema**: Hoje `useFollowupData` e `useEstoqueConsolidadoData` buscam dados do ano corrente (2026). É necessário também carregar 2025 inteiro uma única vez e armazená-lo no cache compartilhado.

**Abordagem**:
- Na `scheduled-update` edge function e no `useFollowupData.fetchFollowup()`, ao fazer refresh para BIs que não sejam "minutas", incluir chunks mensais de 2025 (jan-dez) **apenas se o cache de 2025 ainda não existir** (ex: `followup_2025_{codCli}`).
- Criar chave de cache separada para 2025 (ex: `followup_2025_{codCli}`) para não misturar com dados do ano corrente.
- No carregamento do cache (`loadCache`), buscar e mesclar ambos os anos para os BIs que precisam (entregas, tracking, faturamento, estoque-consolidado).
- Atualizações agendadas e manuais continuam buscando apenas o ano vigente.
- Na `scheduled-update`, aplicar a mesma lógica: se `pageId !== "minutas"`, buscar 2025 uma vez (verificar se cache existe e é recente), e no refresh periódico, apenas ano vigente.

**Arquivos**:
- `src/hooks/useFollowupData.ts` — loadCache e fetchFollowup
- `src/hooks/useEstoqueConsolidadoData.ts` — loadCache e refreshData
- `supabase/functions/scheduled-update/index.ts` — lógica de chunks

---

## 2. Foto na tela de Produtos & Kits (Admin)

**Problema**: A tabela de Produtos & Kits no Admin não mostra foto do produto.

**Abordagem**:
- Adicionar coluna "Foto" na tabela do `StockProductsManager`.
- Buscar a imagem usando a mesma URL padrão usada no Estoque: `https://icone-api.bfranca.com.br/fotos/icone_{product_code}.jpg`.
- Exibir thumbnail 40x40px com `object-contain` e fundo branco, com fallback para ícone de pacote quando imagem não carrega.

**Arquivo**: `src/components/admin/StockProductsManager.tsx`

---

## 3. Foto do produto no Estoque Consolidado via `foto_produto`

**Problema**: O `EstoqueProductHoverCard` usa URL fixa baseada no código. Deveria usar o campo `foto_produto` retornado pela API MAPALOGISTICO.

**Abordagem**:
- No `useEstoqueConsolidadoData.ts`, adicionar campo `fotoUrl` ao `EstoqueMatrizItem` extraindo `item.foto_produto`.
- No `EstoqueProductHoverCard`, usar `product.fotoUrl` quando disponível, com fallback para a URL por código.

**Arquivos**:
- `src/hooks/useEstoqueConsolidadoData.ts` — adicionar `fotoUrl` ao tipo e mapeamento
- `src/components/stock/EstoqueProductHoverCard.tsx` — usar `fotoUrl` com fallback

---

## 4. Corrigir filtro no mapa do Brasil (Tracking)

**Problema**: O componente `react-brazil-heatmap` declara `onClick` na interface mas **não o desestrutura na implementação** — o prop é ignorado.

**Abordagem**:
- Adicionar event listeners DOM diretamente nos elementos SVG dos estados (`.react-brazil-heatmap__state`) usando `useEffect`.
- Extrair o UF do `className` do elemento clicado (ex: `react-brazil-heatmap__state--sp` → `SP`).
- Chamar `onEstadoClick` com o UF extraído.
- Remover o prop `onClick` do `BrazilHeatmap` já que não funciona.

**Arquivo**: `src/components/tracking/TrackingBrazilMap.tsx`

---

## 5. Favicon dinâmico por empresa do BI

**Problema**: O `DocumentHead` usa `getSystemLogo()` para o favicon, que é sempre o logo do sistema. Deveria usar o logo específico da empresa/BI quando em uma página de BI.

**Abordagem**:
- No `DocumentHead`, quando `pageId` está definido e não é "system", usar `getPageLogo(pageId)` para o favicon.
- Quando não tem `pageId` ou é "system"/"admin"/"settings", continuar usando `getSystemLogo()`.

**Arquivo**: `src/components/shared/DocumentHead.tsx`

---

## 6. Barra de % no rodapé das tabelas do B-Side Entregas + títulos congelados

**Problema**: As tabelas de Entrega e Reposição não mostram percentual na barra de progresso. A tabela de Reposição nem tem barra. Os títulos das colunas rolam junto com o conteúdo (embora já tenha `sticky top-0`, precisa garantir que funcione).

**Abordagem**:
- Adicionar barra de progresso com label de percentual no rodapé de **ambas** as tabelas (Entrega e Reposição).
- Calcular `% Finalizado = (finalizado / total) * 100`.
- Exibir o percentual centralizado sobre a barra.
- Garantir que `TableHeader` com `sticky top-0` funcione dentro do `ScrollArea` — pode precisar ajustar o container para que o scroll seja apenas no `TableBody`.

**Arquivo**: `src/components/entregas/EntregasTables.tsx`

---

## 7. Função de tradução para inglês nos BIs (com permissão)

**Abordagem**:
- Criar um contexto de idioma (`LanguageContext`) com suporte a PT-BR e EN.
- Criar um dicionário de traduções para os termos comuns dos BIs (KPIs, labels de gráficos, títulos de tabelas, filtros).
- Adicionar um botão de toggle de idioma no header compartilhado (`SharedHeader`).
- Adicionar nova permissão `tradutor` na tabela `admin_permissions` para controlar quais perfis veem o botão de tradução.
- No `usePermissions`, adicionar verificação de `canTranslate`.

**Arquivos novos**:
- `src/contexts/LanguageContext.tsx`
- `src/i18n/translations.ts`

**Arquivos editados**:
- `src/components/shared/SharedHeader.tsx` — botão de toggle
- `src/hooks/usePermissions.ts` — nova permissão
- Migração SQL — adicionar `permission_type = 'tradutor'` em `admin_permissions`
- Componentes de BI gradualmente — usar `useTranslation()` nos labels

**Nota**: A tradução será gradual. Na primeira implementação, serão traduzidos os termos mais visíveis (KPIs, títulos de seções, labels de filtros). Os dados brutos (nomes de cidades, regionais, status) permanecem em português.

---

## Resumo de arquivos impactados

| # | Mudança | Arquivos |
|---|---------|----------|
| 1 | Dados 2025 | `useFollowupData.ts`, `useEstoqueConsolidadoData.ts`, `scheduled-update/index.ts` |
| 2 | Foto Produtos Admin | `StockProductsManager.tsx` |
| 3 | Foto Estoque Consolidado | `useEstoqueConsolidadoData.ts`, `EstoqueProductHoverCard.tsx` |
| 4 | Mapa Brasil click | `TrackingBrazilMap.tsx` |
| 5 | Favicon dinâmico | `DocumentHead.tsx` |
| 6 | Barra % Entregas | `EntregasTables.tsx` |
| 7 | Tradutor EN | novos: `LanguageContext.tsx`, `translations.ts`; editados: `SharedHeader.tsx`, migração SQL |

