

## Plano: Corrigir atualização automática + Traduzir elementos restantes

### Problema 1: Atualização automática não funciona

**Causa raiz:** Não existe nenhum cron job configurado no banco de dados. As extensões `pg_cron` e `pg_net` estão habilitadas, mas nunca foi criado o job que chama a edge function `scheduled-update` periodicamente.

**Correção:** Criar um cron job que invoca a edge function `scheduled-update` a cada 30 minutos (para cobrir os intervalos de 60 min configurados). O cron chama via `net.http_post` a URL da edge function com o anon key.

```sql
SELECT cron.schedule(
  'invoke-scheduled-update',
  '*/30 * * * *',
  $$ SELECT net.http_post(
    url := 'https://meqiwdekvksgidwszqrm.supabase.co/functions/v1/scheduled-update',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id; $$
);
```

Após criar, testar com `supabase--curl_edge_functions` para garantir que a function responde corretamente.

### Problema 2: Traduções faltantes

Os seguintes componentes ainda têm textos hardcoded em português:

**A) Faturamento - meses nos gráficos**
- `src/hooks/useFollowupData.ts` (linha 741): `mesesNomes` usa nomes completos em PT ("Janeiro", "Fevereiro"...) que aparecem nos eixos dos gráficos
- Não é possível usar `useLanguage` num hook sem React component, então a solução é: o hook retorna os dados com meses em PT, e no componente Faturamento traduzimos o `mes` label antes de renderizar nos gráficos

**B) B-Side Estoque - tabela `StockLocationTables.tsx`**
- Headers hardcoded: "Estoque Matriz (Barueri)", "Foto", "Código", "Nome", "Fornecedor", "Qtde", "Kits", "Ult. Ent. Data", "Ult. Ent. Qtd", "Buscar...", "itens"
- Adicionar `useLanguage` + `t()` 

**C) Estoque Consolidado - tabelas**
- `EstoqueConsolidado.tsx` linhas 509-610: Headers das tabelas Matriz e Base hardcoded: "Código", "Produto", "Grupo", "Qtde. Entrada", "Qtde. Saída", "Saldo", "Vl. Total", "Base", "Cidade", "UF", "M3", "Região"
- Títulos: "Estoque Matriz", "Estoque Base", "Pesquisar...", "itens", "registros"

**D) Analítico - `AnaliticoCityView.tsx`**
- KPI labels: "Cidades não encontradas", "UFs envolvidas", "Ocorrências sem regional"
- Título tabela: "Regionais não encontradas", "Pesquisar...", "Pedido", "Campanha", "Cidade", "UF"

**E) Page title "Minutas Expedidas x Baixadas"**
- Já existe a chave no dicionário EN. Verificar se o `BiSettingsContext.getPageTitle` realmente traduz (foi corrigido na mensagem anterior com `t(title)`)

### Novas chaves de tradução (~25)

Adicionar ao `src/i18n/translations.ts`:
- Meses completos: "Janeiro"→"January", "Fevereiro"→"February", etc.
- Tabela Estoque: "Foto"→"Photo", "Código"→"Code", "Nome"→"Name", "Fornecedor"→"Supplier", "Qtde"→"Qty", "Kits"→"Kits", "Ult. Ent. Data"→"Last Entry Date", "Ult. Ent. Qtd"→"Last Entry Qty", "Buscar..."→"Search...", "itens"→"items"
- Tabela Estoque Consolidado: "Produto"→"Product", "Qtde. Entrada"→"Qty In", "Qtde. Saída"→"Qty Out", "Região"→"Region"
- Analítico: "Cidades não encontradas"→"Cities not found", "UFs envolvidas"→"States involved", "Ocorrências sem regional"→"Occurrences without region", "Regionais não encontradas"→"Regions not found"

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/i18n/translations.ts` | +25 chaves pt-BR/en |
| `src/components/stock/StockLocationTables.tsx` | +useLanguage, t() em títulos/headers |
| `src/pages/EstoqueConsolidado.tsx` | t() nos headers das tabelas Matriz e Base |
| `src/components/analitico/AnaliticoCityView.tsx` | +useLanguage, t() em KPIs e tabela |
| `src/pages/Faturamento.tsx` | t() nos labels de meses dos gráficos (transformar `mensal` data) |
| Cron job SQL (via insert tool) | Criar job `invoke-scheduled-update` a cada 30 min |

### Ordem de execução

1. Criar cron job para atualização automática + testar edge function
2. Expandir dicionário de traduções
3. Atualizar os 4 componentes com `t()`

