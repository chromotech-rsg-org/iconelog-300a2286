

## Plano: Estoque Consolidado com APIs Reais + Correcoes de Roteamento + Refatoracao ConfigurarBI

Este plano cobre 3 grandes blocos de trabalho.

---

### Bloco 1: Conectar Estoque Consolidado com APIs Reais

**Objetivo**: Substituir dados mock por dados reais das APIs MAPALOGISTICO e SALDOBASE.

#### 1.1 Criar hook `useEstoqueConsolidadoData`

Novo hook em `src/hooks/useEstoqueConsolidadoData.ts` que:

- Usa `useApiProxy` para chamar **MAPALOGISTICO** (dados da matriz) e **SALDOBASE** (dados das bases)
- Implementa cache-first com `bi_data_cache` (page_id: `estoque-consolidado`, cache_keys: `mapalogistico_{codCli}` e `saldobase_{codCli}`)
- Controla refresh com stages: `requesting_mapalogistico` -> `receiving_mapalogistico` -> `requesting_saldobase` -> `receiving_saldobase` -> `saving` -> `done`
- **NAO** aplica filtro de whitelist (diferente do B-Side Estoque, aqui mostra todos os produtos)
- Processa dados da MAPALOGISTICO para gerar items da tabela Estoque Matriz com todos os campos necessarios
- Processa dados da SALDOBASE para gerar items da tabela Estoque Base

#### 1.2 Campos da Tabela Estoque Matriz (conforme imagens 2 e 3)

A tabela Estoque Matriz combina dados das duas APIs. Os campos serao:

| Campo | Fonte | Campo API |
|---|---|---|
| Base | MAPALOGISTICO | `base` ou valor fixo (ex: "BARUERI") |
| Codigo | MAPALOGISTICO | `produto` |
| Descricao | MAPALOGISTICO | `Descricao` / `nm_produto` |
| Grupo | MAPALOGISTICO | `Grupo` |
| SubGrupo | MAPALOGISTICO | `SubGrupo` |
| Categoria | MAPALOGISTICO | `Categoria` |
| Qtde. Entrada | MAPALOGISTICO | `nr_qtde_total_entrada` |
| Qtde. Saida | MAPALOGISTICO | `nr_qtde_saida` |
| Estoque | MAPALOGISTICO | `nr_qtde_saldo` |
| Vl. Item | MAPALOGISTICO | calculado (`vl_total / nr_qtde_saldo`) |
| Vl. Total | MAPALOGISTICO | `vl_total` |
| M3 Unitario | MAPALOGISTICO | `m3` |
| M3 Total | MAPALOGISTICO | `m3_total` |
| Data Ultima Entrada | MAPALOGISTICO | `dt_ultima_entrada` |
| Qtde. Ultima Entrada | MAPALOGISTICO | `nr_qtde_Ultima_entrada` |
| Data Ultima Saida | MAPALOGISTICO | `dt_ultima_saida` |
| Qtde. Ultima Saida | MAPALOGISTICO | `nr_qrde_ultima_saida` |
| Dias s/ Movto. | MAPALOGISTICO | `nr_qtde_dias_ultima_mov` |
| Tempo Parado | Calculado | Faixa baseada em dias (Antes que 30 dias, Entre 31 e 60 dias, Entre 61 e 90 dias, Mais que 91 dias) |

#### 1.3 Campos da Tabela Estoque Base (conforme imagem 4)

| Campo | Fonte | Campo API |
|---|---|---|
| Base | SALDOBASE | campo de base da API |
| Cidade | SALDOBASE | campo de cidade |
| UF | SALDOBASE | campo de UF |
| Codigo | SALDOBASE | codigo do produto |
| M3 | SALDOBASE | m3 |
| Produto | SALDOBASE | descricao do produto |
| Qtde. Entrada | SALDOBASE | qtde entrada |
| Qtde. Saida | SALDOBASE | qtde saida |
| Regiao | SALDOBASE | regiao (via city_regional_mapping ou campo direto) |
| Saldo | SALDOBASE | saldo |
| Vl. Total | SALDOBASE | valor total |

#### 1.4 KPI Cards

- **ESTOQUE MATRIZ** (Valor, M3, Qtde SKUs): calculados a partir dos dados processados da MAPALOGISTICO
- **ESTOQUE BASE** (Valor, M3, Qtde SKUs): calculados a partir dos dados processados da SALDOBASE

#### 1.5 Graficos (nova ordem + tipos)

1. **Representacao do Estoque | Grupo** - tipo **Pizza** (ja esta como pizza, manter)
2. **Valor Estoque | Grupo** - tipo **Barra horizontal** (manter, dados do Grupo da MAPALOGISTICO)
3. **Tempo Parado | SKU** - mudar para tipo **Pizza** (faixas: Antes que 30 dias, Entre 31 e 60 dias, Entre 61 e 90 dias, Mais que 91 dias)
4. **Tempo Parado Medio | Grupo** - tipo **Barra horizontal** (manter)

Todos os graficos sao clicaveis e filtram o BI inteiro.

#### 1.6 Filtragem Interativa

Ao clicar em qualquer elemento (grafico, linha de tabela, badge), filtra todos os componentes:
- Filtro por Grupo (graficos + tabelas)
- Filtro por SKU/Codigo (tabelas)
- Filtro por Base (tabela base)
- Filtro por Faixa de Tempo Parado (grafico pizza tempo parado)

#### 1.7 Exportacao Excel

Botao de exportar gera um arquivo .xlsx com 3 abas:
1. **Estoque Matriz** - dados filtrados da tabela matriz
2. **Estoque Base** - dados filtrados da tabela base
3. **BI Consolidado** - resumo com KPIs + dados dos graficos

---

### Bloco 2: Corrigir Roteamento ao Recarregar Pagina

**Problema**: Ao recarregar a pagina (F5) em /admin ou em qualquer BI, o usuario e redirecionado para /auth e depois para /minutas.

**Causa**: O `SmartRedirect` so atua em `/`, mas o problema pode estar no componente `ProtectedRoute` ou no carregamento do `AuthContext` que durante o `loading=true` pode causar flash de redirecionamento.

**Solucao**:

- No `ProtectedRoute`, durante `loading === true`, renderizar um loading spinner em vez de redirecionar
- Garantir que rotas individuais (`/admin`, `/estoque-consolidado`, etc.) nao redirecionem enquanto o auth esta carregando
- O `SmartRedirect` ja funciona corretamente para `/` - nao precisa ser alterado
- Verificar se as paginas individuais (como Admin, EstoqueConsolidado) nao fazem redirecionamento proprio durante loading

**Arquivos a modificar:**
- `src/components/auth/ProtectedRoute.tsx` - Adicionar estado de loading
- Verificar cada pagina que faz redirect proprio

---

### Bloco 3: Refatorar ConfigurarBI para DataTable com Modal

**Objetivo**: Substituir o layout de cards por uma DataTable e editar em modal.

#### 3.1 DataTable

Tabela com colunas:
- Ordem | Logo (miniatura) | Nome | Slug | Empresa | Cod. Cliente | Intervalo | Acoes (Editar/Deletar/Ocultar)

Funcionalidades:
- Paginacao
- Busca textual
- Ordenacao por qualquer coluna

#### 3.2 Modal de Edicao

Ao clicar em "Editar", abre um Dialog/Modal com TODOS os campos existentes hoje no card:
- Logo (upload)
- Nome de exibicao
- Ordem no menu
- Slug
- Empresa (select)
- Cod. Cliente / Nome Empresa / Intervalo
- APIs Utilizadas (checkboxes)
- Atualizacoes Agendadas
- Configurar Graficos

#### 3.3 Botao Deletar/Ocultar

- Deletar: remove o registro de `bi_settings` (com confirmacao)
- Ocultar: futura feature - pode ser implementado com um campo `hidden` na tabela (requer migracao)

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---|---|
| `src/hooks/useEstoqueConsolidadoData.ts` | **Criar** - Hook para dados reais com MAPALOGISTICO + SALDOBASE |
| `src/pages/EstoqueConsolidado.tsx` | **Reescrever** - Usar hook real, tabelas com colunas corretas, graficos reordenados, exportacao multi-aba |
| `src/data/estoqueConsolidadoData.ts` | **Remover uso** - Dados mock nao serao mais usados |
| `src/components/auth/ProtectedRoute.tsx` | **Modificar** - Adicionar loading state para evitar redirect prematuro |
| `src/components/admin/ConfigurarBI.tsx` | **Reescrever** - De cards para DataTable + Modal de edicao |

### Observacao sobre SALDOBASE

A API SALDOBASE precisa estar cadastrada na tabela `api_integrations` com o `base_url` correto. O hook usara `callMainApi("SALDOBASE", codCli)` que busca automaticamente a URL da integracao cadastrada.

