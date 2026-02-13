

## Problemas Identificados

### 1. Hoje mostra zero (bug de mutacao de data)
A funcao `filterByDateRange` no arquivo `src/hooks/useFollowupData.ts` usa `from.setHours(0,0,0,0)` e `to.setHours(23,59,59,999)` que **mutam o objeto Date original**. Como o `today` e criado uma unica vez via `useMemo`, apos a primeira chamada de filtro ele e alterado permanentemente, quebrando comparacoes futuras.

**Correcao**: Criar copias dos objetos Date antes de chamar `setHours`.

### 2. Clicar no dia 12 inclui o dia 13 (modo range do calendario)
O calendario esta em `mode="range"`, que faz com que o primeiro clique defina `from` e o segundo clique defina `to`, criando automaticamente um intervalo. Nao e possivel selecionar apenas um dia de forma confiavel nesse modo.

**Correcao**: Melhorar a logica de `onSelect` para detectar quando o usuario quer filtrar um unico dia (clicou no mesmo dia ou clicou pela primeira vez) e passar `to` como o mesmo dia que `from` para garantir filtragem correta de um dia so.

---

## Alteracoes Tecnicas

### Arquivo: `src/hooks/useFollowupData.ts`
- Na funcao `filterByDateRange` (linhas 44-53), criar copias dos objetos Date antes de mutar:
```typescript
const filterByDateRange = (items, from, to) => {
  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);
  // ... filtrar usando fromDate e toDate
};
```

### Arquivo: `src/components/shared/SharedHeader.tsx`
- Ajustar a logica `onSelect` do calendario para tratar corretamente selecao de um unico dia vs periodo
- Quando o usuario clica em um dia e `to` nao existe, enviar `from` e `to` como o mesmo dia
- Quando o usuario clica no mesmo dia que ja esta selecionado, limpar a selecao

