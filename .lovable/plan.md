

## Diagnóstico

**Situação atual do banco:**
- Tamanho total: **18 MB** (muito pequeno, o limite do plano é 500MB)
- `followup_099_2025` (só Dez): 1.3MB, 22K registros
- `followup_099` (2026): 978KB, 17K registros
- `statement_timeout`: 2 minutos

**O problema NÃO é o tamanho do banco.** É que o sistema armazena todos os meses de um ano em **uma única célula JSONB**. Se você carregar 12 meses de 2025, o `followup_099_2025` teria ~250K registros (~15MB numa única célula), e ler/gravar isso pode ultrapassar o timeout de 2 min.

**Não precisa aumentar o banco.** O que precisa é **fragmentar o cache por mês** em vez de juntar tudo em uma linha só.

## Plano: Fragmentação por mês

### 1. Alterar o HistoricalDataLoader para salvar um registro por mês
Em vez de acumular tudo em `followup_099_2025`, salvar como:
- `followup_099_2025_01`, `followup_099_2025_02`, ..., `followup_099_2025_12`

Cada registro terá no máximo ~22K registros (~1.3MB) — leitura rápida e sem risco de timeout.

Remover a lógica de "merge" que carrega o cache inteiro, filtra e re-salva. Cada mês é independente.

### 2. Alterar o useFollowupData para carregar fragmentos por mês
Já carrega sequencialmente. Basta ajustar o pattern de busca:
- `followup_099_%` já captura `followup_099_2025_01`, etc.
- Carregar cada fragmento e concatenar no state (já funciona assim).

### 3. Migrar dados existentes
O `followup_099_2025` atual (Dez) será lido e re-salvo como `followup_099_2025_12`, depois o registro antigo é removido. Isso pode ser feito no próprio loader na primeira execução ou via um ajuste manual.

### 4. Resultado
- Cada célula JSONB fica com ~1-2MB no máximo
- Leitura paralela ou sequencial de fragmentos pequenos — sem timeout
- Pode carregar todos os 12 meses de 2025 sem problema
- Sem necessidade de aumentar o plano do banco

