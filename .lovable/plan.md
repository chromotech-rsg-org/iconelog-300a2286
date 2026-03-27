

## Filtrar Estoque Matriz apenas por base BARUERI

### Problema
A tabela Estoque Matriz está somando produtos de todas as bases do MAPALOGISTICO. Conforme os dados da API, o campo `base`/`ds_base` indica a base do registro. O Estoque Matriz deve considerar apenas os registros da base **BARUERI**.

### Alteração

**Arquivo: `src/hooks/useEstoqueConsolidadoData.ts`** (linhas 201-230)

No `useMemo` que processa `estoqueMatriz`, adicionar um `.filter()` antes do `.map()` para incluir apenas registros onde `item.base` seja "BARUERI" (ou onde o campo esteja vazio, mantendo o default atual):

```ts
const estoqueMatriz = useMemo((): EstoqueMatrizItem[] => {
  return mapaData
    .filter(item => {
      const base = (item.base || item.ds_base || "BARUERI").toUpperCase();
      return base === "BARUERI";
    })
    .map((item, index) => {
      // ... resto do mapeamento igual
    });
}, [mapaData]);
```

Isso garante que os KPIs do Estoque Matriz (cards, gráficos e tabela) reflitam apenas os dados da base BARUERI, consistente com o relatório de referência.

