

## Plano: Corrigir filtro de anos para mostrar 2025

### Problema
O hook `useDynamicFilters` tenta descobrir os anos disponíveis fazendo `SELECT data FROM bi_data_cache` e iterando todos os registros no client-side. Como cada row tem 17k-22k itens JSON, isso é extremamente pesado e provavelmente falha ou retorna vazio, resultando em anos não aparecendo.

### Solução
Substituir a query pesada por uma query SQL leve via database function que extrai os anos distintos diretamente no servidor.

### Mudanças

**1. Criar database function `get_cache_years`**
```sql
CREATE OR REPLACE FUNCTION public.get_cache_years()
RETURNS SETOF integer
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT DISTINCT (item->>'_fetch_year')::integer
  FROM public.bi_data_cache, jsonb_array_elements(data) item
  WHERE item->>'_fetch_year' IS NOT NULL
    AND (item->>'_fetch_year')::integer > 2000
  ORDER BY 1;
$$;
```

**2. Atualizar `src/hooks/useDynamicFilters.ts`**
- Remover o `useEffect` que faz `SELECT data FROM bi_data_cache` (linhas 49-72)
- Substituir por chamada à function RPC `get_cache_years` que retorna apenas os números dos anos
- Isso reduz de megabytes de transferência para poucos bytes

**3. Fallback**
- Manter o fallback para o ano atual caso a function retorne vazio
- Combinar anos do cache com anos extraídos dos dados em memória (`followupData`)

### Arquivos modificados
| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Criar function `get_cache_years` |
| `src/hooks/useDynamicFilters.ts` | Usar RPC em vez de download completo |

