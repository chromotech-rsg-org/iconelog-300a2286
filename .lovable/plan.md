

## Diagnóstico: Dados de Dezembro 2025 no Tracking

### Problemas Identificados

**1. Dados de Dezembro 2025 não foram baixados**
A consulta no banco mostra apenas Novembro 2025 (`_fetch_month: 11`):
```
followup_099_2025       → 9999 itens  (Nov/2025)
produtosdistribuidos_099_2025 → 9788 itens (Nov/2025)
```
Não existe Dezembro 2025 no banco. O Power BI mostra 22.261 pedidos em Dez/2025, mas o sistema não tem esses dados.

**2. Cache de 2025 não é carregado na memória**
Quando os dados históricos excedem 4MB, o `HistoricalDataLoader` salva em cache separado com sufixo `_2025`:
- `followup_099_2025` (separado)
- `produtosdistribuidos_099_2025` (separado)

Porém, o `loadCache` só carrega `followup_099` e `produtosdistribuidos_099` (sem sufixo), ignorando os dados de 2025.

### Plano de Correção

**1. Atualizar `useFollowupData.ts` - função `loadCache`**
Modificar para também buscar e mesclar caches com sufixo de ano:
- Buscar `followup_${codCli}` (atual)
- Buscar `followup_${codCli}_2025` e mesclar
- Mesmo para `produtosdistribuidos_*`

**2. Orientação ao usuário**
Após a correção do código, o usuário deve acessar **Admin > Carga Histórica** e baixar **Dezembro 2025** para que os dados apareçam.

### Mudanças Técnicas

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useFollowupData.ts` | Atualizar `loadCache` para buscar e mesclar caches `_2025` |

```text
┌─────────────────────────────────────────────────────────────┐
│  Cache atual (loadCache)                                    │
│  ────────────────────────                                   │
│  followup_099          → carrega ✓                          │
│  followup_099_2025     → NÃO carrega ✗                      │
│  produtosdistribuidos_099     → carrega ✓                   │
│  produtosdistribuidos_099_2025 → NÃO carrega ✗              │
├─────────────────────────────────────────────────────────────┤
│  Cache corrigido                                            │
│  ────────────────────────                                   │
│  followup_099          → carrega ✓                          │
│  followup_099_2025     → carrega + mescla ✓                 │
│  produtosdistribuidos_099     → carrega ✓                   │
│  produtosdistribuidos_099_2025 → carrega + mescla ✓         │
└─────────────────────────────────────────────────────────────┘
```

