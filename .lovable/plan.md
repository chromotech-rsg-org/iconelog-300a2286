
# Dashboard de Relatórios Icone Log

Um Dashboard de BI de logística de alto impacto visual com tema Dark Mode inspirado no estilo 99/Loggi, focado em monitoramento de expedição e baixas.

---

## 1. Header Completo
- **Logo Icone Log** no canto superior esquerdo
- **Data/hora da última atualização** centralizada no topo
- **Botões de navegação** (Estoque, Tracking Entrega, Faturamento) no canto direito
- **Barra de filtros** com:
  - Botões para todos os meses (Jan a Dez) com estado ativo em amarelo
  - Dropdown seletor de ano (2024-2026)
  - Dropdown seletor de Regional

---

## 2. Cards KPI (Indicadores Principais)
- Dois cards principais ocupando largura total:
  - **"Total Expedidas"** - valor em destaque amarelo (Ex: R$ 427.965)
  - **"Total Baixadas"** - valor em destaque amarelo
- Cards com bordas finas amarelas e fundo escuro
- Tipografia grande e negrito para os valores

---

## 3. Layout Split-Screen (Coluna Esquerda - 30%)
- **Gráfico de barras horizontais** elegante e fino
- 15 linhas representando cada Regional (São Paulo, Piracicaba, Niterói, etc.)
- Cada linha mostrando comparação:
  - Barra azul (#3b82f6) para "Expedidas"
  - Barra laranja (#f97316) para "Baixadas"
- Posição fixa na tela (não rola)

---

## 4. Layout Split-Screen (Coluna Direita - 70%)
- **Container scrollável** com altura fixa
- **15 mini-gráficos de linha** (um por regional) em layout vertical
- Cada gráfico mostrando:
  - Eixo X: dias do mês
  - Linha azul: evolução diária de Expedições
  - Linha laranja: evolução diária de Baixas
  - Título da regional no topo
- Rolagem independente do resto da página
- **Animações suaves** ao carregar e filtrar dados

---

## 5. Identidade Visual
- **Fundo escuro** (#0a0a0a)
- **Acentos amarelos** (#ffcc00) em bordas, títulos e filtros ativos
- **Gráficos**: Azul para Expedidas, Laranja para Baixadas
- Cards com bordas finas e cantos arredondados
- Tipografia moderna sans-serif
- Transições animadas em todos os gráficos

---

## 6. Estrutura Técnica
- Componentes preparados para futura integração com API
- Dados mockados para demonstração
- Estados de filtro funcionais
- Recharts para todos os gráficos com animações

