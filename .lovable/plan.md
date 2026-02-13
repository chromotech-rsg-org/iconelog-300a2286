
# Plano de Reestruturação Completa da Plataforma

## Visao Geral

Este plano transforma a plataforma de um sistema com dados mock para um sistema totalmente conectado a APIs reais, com painel administrativo reestruturado com sidebar lateral, gestao de integrações, testes de API, e BIs configuráveis.

Devido à complexidade (estimo ~15-20 arquivos novos/modificados e ~5 migrações de banco), o trabalho será implementado em 4 blocos sequenciais dentro desta mesma entrega.

---

## Bloco 1: Reestruturação do Painel Administrativo

### 1.1 - Layout com Sidebar Lateral
- Remover o item "Configurações" do menu suspenso (NavigationMenu)
- Criar a rota `/admin` com sidebar fixa à esquerda, no estilo da imagem de referência (fundo escuro, menus colapsáveis)
- Menus da sidebar:
  - **Usuarios** (existente)
  - **Perfis** (existente)
  - **Acesso Publico** (existente)
  - **Cadastro de Regionais** (renomear de "Cadastro de Cidades")
  - **Configuracoes** (colapsável, com sub-itens):
    - Configurar BI (atual Settings, renomeado)
    - Empresas / Clientes
    - Integracao (tokens, variáveis, senhas)
    - Testes de API
    - Logs
- Remover a rota `/settings` separada; todo o conteúdo passa para dentro do painel admin

### 1.2 - Permissoes para Novos Menus
- Atualizar a constraint `admin_permissions_permission_type_check` para incluir novos tipos:
  - `configurar_bi` (antigo settings)
  - `empresas_clientes`
  - `integracao`
  - `testes_api`
  - `logs_api`
- Atualizar `useRolesManagement`, `useSupabaseAuth`, `AuthContext` para suportar os novos tipos
- Na edição de perfis (modal), adicionar toggles para cada novo tipo
- Lógica: se o usuário tem permissão em ao menos 1 sub-item de "Configurações", mostra o menu pai; senão, esconde

---

## Bloco 2: Novas Funcionalidades Administrativas

### 2.1 - Configurar BI (renomear atual Settings)
- Mover o conteúdo atual de `Settings.tsx` para um componente dentro do admin
- Adicionar botao "Duplicar" em cada card de BI: ao duplicar, cria uma copia com novo page_id, permitindo editar imagem, titulo, nome da empresa, cod_cli
- Adicionar campo `cod_cli` na tabela `bi_settings` para associar cada BI a um cliente

### 2.2 - Cadastro de Empresas/Clientes
- Nova tabela `clients` no banco: `id`, `cod_cli` (codigo), `nome`, `descricao`, `ativo`
- Seed com os dados fornecidos (PAY/EPAY, 099/99 FOOD, ICO/ICONE LOG GERAL, etc.)
- CRUD completo na sidebar

### 2.3 - Area de Integracao (Tokens/Variaveis)
- Nova tabela `api_integrations`: `id`, `name`, `base_url`, `auth_type`, `auth_token`, `headers_json`, `created_at`
- UI para cadastrar, editar e excluir variáveis de integração (tokens, URLs, senhas)
- Os valores sensiveis são armazenados criptografados no banco

### 2.4 - Testes de API (Postman interno)
- Interface com: seletor de método (GET/POST/PUT/DELETE), campo URL, headers editáveis, body JSON editável
- Botao "Enviar" que chama um edge function para proxiar a requisição (evitar CORS)
- Exibir resposta: status code, headers, body formatado
- Os endpoints da collection já vêm pré-cadastrados como templates

### 2.5 - Logs de Testes
- Nova tabela `api_test_logs`: `id`, `endpoint`, `method`, `request_body`, `response_status`, `response_body`, `created_at`, `user_id`
- Cada teste salvo automaticamente
- Listar logs com busca e filtros
- Exportar em CSV, JSON, Excel e TXT

---

## Bloco 3: Conexao dos BIs com APIs Reais

### 3.1 - Edge Function Proxy de API
- Criar edge function `api-proxy` para fazer chamadas à API `nfe9.websiteseguro.com`
- Recebe: endpoint, body, token (do banco de integrações)
- Retorna: resposta da API
- Isso resolve o problema de CORS

### 3.2 - Minutas (Followup + ProdutosDistribuidos)
- Substituir dados mock por chamadas reais à API FOLLOWUP
- Campos usados: `dt_expedicao`, `dt_baixa_minuta` para contabilizar expedidas x baixadas
- Cruzar campo cidade da API com tabela `city_regional_mapping` para agrupar por regional
- Gráfico esquerdo: totais por regional
- Gráficos direita: evolução diária
- Para valores em reais: chamar API PRODUTOSDISTRIBUIDOS, relacionar por numero do pedido, usar campo `vl_total`

### 3.3 - B-Side Entregas (Followup)
- Conectar à API FOLLOWUP
- Usar campo `fl_status_real` para classificar Finalizado vs Em Trânsito
- Filtrar campanhas:
  - Entrega: "Kit restaurante" e "Positivação Kit"
  - Reposição: "reposição Kit"
  - Excluir `ds_tipo_servico = "Reentrega"` de tudo
- Cruzar com `city_regional_mapping` para regionais
- Manter layout atual

### 3.4 - B-Side Estoque (Saldo Base)
- Conectar à API SALDOBASE
- Apenas 1 tabela: Matriz (BARUERI), sem gráficos
- Foto maior na tabela; ao passar mouse, abre preview grande
- Novas colunas: QTD última entrada, Data última entrada
- Nova tabela admin `stock_kit_config`: configurar quantidade por kit por SKU
- Nova tabela admin `stock_product_whitelist`: quais produtos aparecem no dash (cadastrar por código)
- Produtos com estoque zerado ficam ocultos
- Conectar à API RECEBIMENTOS para dados de última entrada

---

## Bloco 4: Configuracao Dinamica dos BIs

### 4.1 - Tabela de Configuracao de BI
- Nova tabela `bi_chart_config`: `id`, `bi_page_id`, `chart_position`, `chart_type`, `api_endpoint`, `field_mappings_json`, `filters_json`, `aggregation_type`
- Permitir que cada BI tenha seus gráficos configuráveis: qual API alimenta, quais campos usar, como agregar
- UI na area "Configurar BI" para editar essas configurações

---

## Mudancas no Banco de Dados (Migracoes)

1. Atualizar constraint de `admin_permissions` com novos tipos
2. Adicionar campo `cod_cli` em `bi_settings`
3. Criar tabela `clients`
4. Criar tabela `api_integrations`
5. Criar tabela `api_test_logs`
6. Criar tabela `stock_kit_config`
7. Criar tabela `stock_product_whitelist`
8. Criar tabela `bi_chart_config`
9. Renomear referências de "Cadastro de Cidades" para "Cadastro de Regionais"

## Edge Functions

1. `api-proxy`: proxy para chamadas à API externa (resolve CORS, centraliza autenticação)

## Arquivos Principais Modificados/Criados

- `src/pages/Admin.tsx` - reestruturar com sidebar
- `src/pages/Settings.tsx` - remover (conteúdo migra para Admin)
- `src/components/admin/AdminSidebar.tsx` - novo
- `src/components/admin/ConfigurarBI.tsx` - novo (antigo Settings)
- `src/components/admin/ClientsCRUD.tsx` - novo
- `src/components/admin/IntegrationManager.tsx` - novo
- `src/components/admin/ApiTester.tsx` - novo
- `src/components/admin/ApiTestLogs.tsx` - novo
- `src/components/admin/StockKitConfig.tsx` - novo
- `src/components/admin/StockProductWhitelist.tsx` - novo
- `src/components/shared/NavigationMenu.tsx` - remover link Settings
- `src/App.tsx` - remover rota /settings
- `src/hooks/useRolesManagement.ts` - novos tipos de permissão
- `src/hooks/useSupabaseAuth.ts` - novos tipos de permissão
- `src/contexts/AuthContext.tsx` - novos tipos de permissão
- `src/pages/Index.tsx` - conectar à API real (Followup)
- `src/pages/Estoque.tsx` - conectar à API real (Saldo Base)
- `src/pages/Entregas.tsx` - conectar à API real (Followup)
- `supabase/functions/api-proxy/index.ts` - novo

## Observacoes Importantes

- O token da API (`eyJ0eXA...`) será armazenado de forma segura na tabela `api_integrations`, acessível apenas via edge function
- O `cod_cli` será configurável por empresa/BI
- Todas as chamadas externas passam pelo edge function proxy para evitar expor tokens no frontend
- O cadastro de cidades será renomeado para "Cadastro de Regionais" mantendo a mesma funcionalidade
