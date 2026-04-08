

## Diagnóstico: Atualização Automática com Dados Incorretos

### Causa Raiz (2 problemas graves)

**1. Formato de cache_key diferente entre automático e manual**

O cache salvo pela atualização automática e pela manual usam chaves DIFERENTES:

```text
Automático: followup_099_2026_04  (490 registros)
Manual:     followup_2026_04_099  (4046 registros)
```

- Automático: `{api}_{codCli}_{year}_{month}` (linha 574 do edge function)
- Manual: `{api}_{year}_{month}_{codCli}` (saveToCache no hook: `followup_${monthKey}` + `_${codCli}`)

Quando o usuário abre o BI, o frontend carrega `followup_${codCli}_${year}_${month}` (formato automático com 490 registros), ignorando os 4046 registros salvos pelo manual.

**2. Atualização automática busca mês a mês, manual busca o ano inteiro**

- Manual: Uma única requisição `Jan 1 → hoje` → captura TUDO
- Automático: Requisições separadas por mês exato (ex: `2026-04-01 → 2026-04-30`) → perde registros que a API filtra por outros campos de data

Exemplo real no banco:
| Cache Key | Registros | Fonte |
|---|---|---|
| `followup_099_2026_04` | 490 | Automático |
| `followup_2026_04_099` | 4046 | Manual |

**3. Frontend só carrega o mês atual no mount**

Ao abrir o BI, o hook carrega apenas `followup_{codCli}_{currentYear}_{currentMonth}`, mostrando dados parciais mesmo que todos os meses estejam corretos no banco.

### Solução

**Parte 1: Edge Function `scheduled-update/index.ts`**
- Para APIs pesadas (FOLLOWUP, PRODUTOSDISTRIBUIDOS), trocar a estratégia de busca mensal para busca do ano inteiro (igual ao manual)
- Unificar o formato do cache_key para `{api}_{year}_{month}_{codCli}` (mesmo formato que o manual)
- Após buscar o ano inteiro, dividir os resultados por mês e salvar cada fragmento separadamente
- Isso garante que automático e manual produzam os mesmos dados

**Parte 2: Hook `useFollowupData.ts`**  
- No mount, carregar TODOS os fragmentos disponíveis para o codCli (não apenas o mês atual)
- Usar uma query com `.like("cache_key", "followup_%_${codCli}")` para buscar todos os fragmentos de uma vez
- Limpar os fragmentos antigos no formato errado (`followup_${codCli}_*`)

**Parte 3: Migração SQL**
- Deletar os fragmentos duplicados no formato antigo (`followup_099_*`) para evitar confusão
- Manter apenas os do formato correto (`followup_*_099`)

### Resumo de Mudanças

| Arquivo | Mudança |
|---|---|
| `supabase/functions/scheduled-update/index.ts` | Buscar ano inteiro para FOLLOWUP/PRODUTOSDISTRIBUIDOS, salvar com cache_key unificada |
| `src/hooks/useFollowupData.ts` | Carregar todos os fragmentos no mount (não só mês atual) |
| Migração SQL | Limpar cache_keys duplicadas no formato antigo |

