

## Diagnóstico: Por que o FOLLOWUP sempre dá timeout na atualização agendada

### Causa Raiz Identificada

A Edge Function `scheduled-update` tem **dois limites de tempo**:
- `API_TIMEOUT_MS = 20000` (20 segundos por chamada à API externa)
- `MAX_EXECUTION_MS = 50000` (50 segundos de orçamento total)

Para o FOLLOWUP, a função usa `getMonthChunks()` que gera 3 chunks (Jan, Fev, Mar de 2026). Cada chunk chama a API externa do FOLLOWUP, que é pesada e lenta. **O primeiro chunk já estoura os 20 segundos**, causando o `AbortError → "timeout"` que aparece no log.

Nos logs recentes, o FOLLOWUP falhou em **todas** as execuções:
- 19/03 23:00 → timeout (52s total)
- 19/03 23:30 → timeout (23s)
- 20/03 00:00 → timeout (49s)
- 20/03 00:30 → timeout (40s)
- 20/03 01:00 → skipped (cache fresh, pois o refresh manual das 00:58 salvou os dados)

Outro problema: a função salva **todos os meses como uma única chave** (`followup_099`, 18MB!), enquanto o sistema de cache fragmentado usa chaves por mês (`followup_099_2026_01`). Isso significa que mesmo quando a função conseguisse completar, ela estaria usando a estratégia errada de cache.

### Plano de Ajuste

#### 1. Salvar cada mês individualmente (fragmentação no scheduled-update)
**Arquivo**: `supabase/functions/scheduled-update/index.ts`

Modificar `fetchIntegrationData` para que, em vez de acumular tudo e retornar um array gigante, ele **salve cada chunk mensal diretamente no banco** com a chave fragmentada (ex: `followup_099_2026_01`). Isso:
- Evita acumular 18MB em memória
- Permite que chunks parciais sejam salvos mesmo se o orçamento de tempo acabar
- Fica consistente com o que o `HistoricalDataLoader` já faz

#### 2. Aumentar o timeout da API para FOLLOWUP
**Arquivo**: `supabase/functions/scheduled-update/index.ts`

Aumentar `API_TIMEOUT_MS` de 20s para 45s para APIs do tipo `DATE_RANGE_APIS` (FOLLOWUP e PRODUTOSDISTRIBUIDOS), pois são as que retornam mais dados.

#### 3. Processar um mês por batch (não todos de uma vez)
**Arquivo**: `supabase/functions/scheduled-update/index.ts`

Em vez de processar todos os meses do FOLLOWUP em uma única batch, criar **um job na fila por mês** para APIs de date-range. Assim, se o mês de janeiro completar mas fevereiro estourar o tempo, janeiro já está salvo e fevereiro será retentado na próxima etapa (chaining).

#### 4. Atualizar a verificação de cache freshness para chaves fragmentadas
**Arquivo**: `supabase/functions/scheduled-update/index.ts`

A verificação de freshness hoje olha para `followup_099` (chave monolítica). Precisa verificar os fragmentos mensais individuais, checando se o mês atual já está fresco.

#### 5. Manter compatibilidade no carregamento do cliente
**Arquivo**: `src/hooks/useFollowupData.ts`

O cliente já lê tanto a chave monolítica (`followup_099`) quanto os fragmentos (`followup_099_2026_01`). Após a migração, a chave monolítica pode ser removida ou simplesmente ignorada, pois os fragmentos terão os dados atualizados.

### Detalhes Técnicos

**Mudança principal em `fetchIntegrationData`**:

```text
ANTES:
  getMonthChunks() → fetch chunk 1 → fetch chunk 2 → fetch chunk 3 → return [todos os dados]
  → salva tudo em followup_099 (18MB, frequentemente timeout)

DEPOIS:
  getMonthChunks() → fetch chunk 1 → salva em followup_099_2026_01
                   → fetch chunk 2 → salva em followup_099_2026_02
                   → fetch chunk 3 → salva em followup_099_2026_03
  → cada chunk salvo independentemente, parcial = OK
```

**Timeout diferenciado**:
```text
APIs rápidas (SALDOBASE, MAPALOGISTICO): 20s timeout
APIs pesadas (FOLLOWUP, PRODUTOSDISTRIBUIDOS): 45s timeout
```

**Arquivos a modificar**:
- `supabase/functions/scheduled-update/index.ts` — Fragmentação, timeout, freshness check por mês

