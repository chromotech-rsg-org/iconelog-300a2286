

## Resumo das Alteracoes

Sao 4 frentes de trabalho: cor do dia de hoje no calendario, clique do scroll nos menus, confirmacao dos dados da API, e integracao completa do B-Side Estoque com cache e rotina de atualizacao.

---

## 1. Dia de hoje com numero branco no calendario

**Arquivo**: `src/components/ui/calendar.tsx`

- Alterar a classe `day_today` de `"border border-accent text-accent-foreground"` para `"border border-accent text-white"` 
- Isso garante que o numero do dia atual fique branco com apenas uma borda, sem fundo colorido
- O fundo amarelo so aparece quando o dia e clicado/selecionado

---

## 2. Clique do scroll (botao do meio) nos menus para abrir em nova aba

**Arquivos**: `src/components/shared/NavigationMenu.tsx`, `src/components/admin/AdminSidebar.tsx`

- No `NavigationMenu`, trocar o `DropdownMenuItem` com `onClick` + `navigate()` por links `<a>` estilizados, usando `href` para que o clique do botao do meio (scroll) funcione nativamente para abrir em nova aba
- Alternativa mais simples: adicionar handler `onAuxClick` (evento do botao do meio) nos `DropdownMenuItem` que faz `window.open(path, '_blank')`
- No `AdminSidebar`, aplicar a mesma logica nos botoes de navegacao de secao (embora la seja navegacao interna da mesma pagina, nao faz sentido abrir em nova aba)

A abordagem sera adicionar `onAuxClick` nos itens do dropdown para detectar clique do botao do meio e abrir em nova aba via `window.open`.

---

## 3. Confirmacao da API de minutas (dados de 2024 em diante)

**Diagnostico**: Os dados no cache (`bi_data_cache`) mostram que todos os 2544 registros do followup tem `dt_inicio` de `2026/02`. O codigo ja faz o fracionamento mes a mes desde janeiro de 2024, porem a API externa aparentemente so retorna dados do periodo corrente, independente do intervalo solicitado.

**Acao**: Nao ha problema no codigo - o fracionamento esta correto. O comportamento depende da API externa. Sera adicionado um log visual no progresso da atualizacao mostrando quantos registros cada mes retornou, para o usuario poder diagnosticar se a API retorna dados historicos ou nao.

---

## 4. B-Side Estoque - Integracao completa com cache e rotina de atualizacao

Atualmente o `useEstoqueData` chama a API diretamente a cada abertura da pagina, sem cache no banco. A refatoracao seguira o mesmo padrao do `useFollowupData`:

### 4a. Refatorar `useEstoqueData` (arquivo: `src/hooks/useEstoqueData.ts`)

- Adicionar carregamento de cache do banco (`bi_data_cache`) ao montar, usando `cache_key` como `saldobase_estoque_{codCli}` e `recebimentos_estoque_{codCli}`
- Ao abrir a pagina, exibir dados do cache imediatamente (cache-first)
- Adicionar funcao `saveToCache` para persistir dados da API no banco
- Adicionar funcao `saveLastUpdate` para registrar timestamp no `bi_last_update`
- Adicionar controle de `refreshing`, `refreshStage`, `lastUpdateAt` (mesmos estados do useFollowupData)
- Adicionar verificacao de cooldown antes de permitir atualizacao manual (consultando `bi_last_update` e `bi_settings.refresh_interval_minutes`)
- Retornar `lastUpdateAt`, `refreshing`, `refreshStage` para o componente pai

### 4b. Atualizar pagina Estoque (arquivo: `src/pages/Estoque.tsx`)

- Usar `lastUpdateAt` vindo do hook em vez de estado local
- Passar `onRefreshData` com verificacao de cooldown (modal de espera se necessario)
- Mostrar status de conexao: indicador visual se dados vieram do cache ou da API
- Mostrar progresso de atualizacao (RefreshProgress) durante refresh manual
- Nao chamar API automaticamente ao montar - apenas carregar cache do banco

### 4c. Atualizar `scheduled-update` edge function (arquivo: `supabase/functions/scheduled-update/index.ts`)

- Adicionar suporte ao page_id `estoque` na funcao de agendamento
- Quando o schedule for para estoque, chamar SaldoBase e Recebimentos com o `cod_cli` do estoque
- Salvar resultados no `bi_data_cache` com as chaves corretas

### 4d. Registrar integracoes no banco

- Adicionar registros em `bi_api_integrations` vinculando `estoque` as APIs SALDOBASE e RECEBIMENTOS (se ainda nao existirem como `api_integrations`)
- Verificar se SALDOBASE e RECEBIMENTOS ja existem na tabela `api_integrations`; se nao, criar

---

## Arquivos alterados

1. `src/components/ui/calendar.tsx` - Cor branca no dia de hoje
2. `src/components/shared/NavigationMenu.tsx` - Suporte a clique do scroll
3. `src/hooks/useEstoqueData.ts` - Refatoracao completa com cache-first, refresh, cooldown
4. `src/pages/Estoque.tsx` - Integracao com novo hook, status de conexao, progresso
5. `supabase/functions/scheduled-update/index.ts` - Suporte ao estoque no agendamento
6. Migracao SQL para vincular APIs ao estoque no `bi_api_integrations`

