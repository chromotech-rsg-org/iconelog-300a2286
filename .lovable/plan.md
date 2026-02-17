
# Corrigir B-Side Entregas - Dados Zerados

## Problema Identificado

Ao investigar os dados no banco, encontrei **14.545 registros** ja cacheados para entregas. O problema esta na logica de filtragem do `getEntregasData`:

1. **Campo errado**: O codigo busca `item.ds_campanha` mas o campo real nos dados da API e `nm_campanha`
2. **Filtros de campanha incorretos**: Os valores reais sao diferentes do esperado:

```text
Valores reais no banco:
+-------------------------------------+--------+
| nm_campanha                         | qtd    |
+-------------------------------------+--------+
| 99FOOD_POSITIVACAO KIT              | 8.410  |  --> Entrega
| 99FOOD_REPOSICAO_KIT                | 4.511  |  --> Reposicao
| 99FOOD_KIT RESTAURANTE              | 1.302  |  --> Entrega
| 99FOOD_PLACA POSITIVADA             | 92     |  --> Ignorar
| 99FOOD_ESTOQUE_MOVEL                | 66     |  --> Ignorar
| ...demais campanhas                 |        |
+-------------------------------------+--------+
```

O codigo atual procura por `"kit restaurante"`, `"positivacao kit"` e `"reposicao kit"` usando `includes()`, mas os valores reais contem prefixo `99FOOD_` e underscores. A funcao `includes` deve funcionar para a maioria, porem `ds_campanha` nao existe - o campo correto e `nm_campanha`.

## Plano de Correcao

### 1. Corrigir `getEntregasData` em `useFollowupData.ts`

Alterar a linha que le o campo campanha:
- **De**: `item.ds_campanha || item.campanha || ""`
- **Para**: `item.nm_campanha || item.ds_campanha || item.campanha || ""`

Ajustar os filtros de campanha para refletir os valores reais:
- **Entrega**: campanhas que contenham `"KIT RESTAURANTE"` ou `"POSITIVACAO KIT"` ou `"POSITIVACAO_KIT"` (cobrir variantes com e sem underscore)
- **Reposicao**: campanhas que contenham `"REPOSICAO_KIT"` ou `"REPOSICAO KIT"` ou `"REPOSITIVACAO"` (conforme mencionado pelo usuario: "Repositivacao-Kit")

Manter a exclusao de `ds_tipo_servico` contendo "REENTREGA" (1.404 registros serao excluidos).

### 2. Garantir cache compartilhado (ja funciona)

Os dados ja estao cacheados corretamente com `page_id = 'entregas'` e `cache_key = 'followup_099'` (14.545 registros). Nenhuma alteracao necessaria no cache.

### Resumo Tecnico

Apenas o arquivo `src/hooks/useFollowupData.ts` precisa ser alterado, na funcao `getEntregasData` (~5 linhas de mudanca):
- Adicionar `nm_campanha` como campo prioritario
- Ajustar os patterns de matching para cobrir `POSITIVACAO KIT`, `KIT RESTAURANTE` (Entrega) e `REPOSICAO_KIT` / `REPOSITIVACAO` (Reposicao)
