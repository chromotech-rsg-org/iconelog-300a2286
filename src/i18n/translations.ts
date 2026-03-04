export type Language = "pt-BR" | "en";

export const translations: Record<Language, Record<string, string>> = {
  "pt-BR": {
    // KPI labels
    "Expedidas": "Expedidas",
    "Baixadas": "Baixadas",
    "Total": "Total",
    "Finalizado": "Finalizado",
    "Em Trânsito": "Em Trânsito",
    "No Prazo": "No Prazo",
    "Fora do Prazo": "Fora do Prazo",
    "Sem Ocorrência": "Sem Ocorrência",
    "Com Ocorrência": "Com Ocorrência",
    
    // Section titles
    "ENTREGA": "ENTREGA",
    "REPOSIÇÃO": "REPOSIÇÃO",
    "Regional": "Regional",
    "Período": "Período",
    "Filtros": "Filtros",
    "Todas as Regionais": "Todas as Regionais",
    "Exportar Excel": "Exportar Excel",
    "Limpar Filtros": "Limpar Filtros",
    "Última atualização": "Última atualização",
    "Atualizar dados": "Atualizar dados",
    
    // Estoque
    "Estoque": "Estoque",
    "Entrada": "Entrada",
    "Saída": "Saída",
    "Saldo": "Saldo",
    "Valor Total": "Valor Total",
    
    // Tracking
    "Pedidos": "Pedidos",
    "Tipo Serviço": "Tipo Serviço",
    "Modalidade": "Modalidade",
    "Cidade": "Cidade",
    "Estado": "Estado",
    "Status": "Status",
    
    // Faturamento
    "Faturamento": "Faturamento",
    "Armazenagem": "Armazenagem",
    "Transporte": "Transporte",
    
    // Filters
    "Meses": "Meses",
    "Ano": "Ano",
    "Selecionar todos": "Selecionar todos",
    "Desmarcar todos": "Desmarcar todos",
    
    // General
    "Carregando...": "Carregando...",
    "Nenhum dado": "Nenhum dado",
    "UF": "UF",
  },
  "en": {
    // KPI labels
    "Expedidas": "Dispatched",
    "Baixadas": "Delivered",
    "Total": "Total",
    "Finalizado": "Completed",
    "Em Trânsito": "In Transit",
    "No Prazo": "On Time",
    "Fora do Prazo": "Overdue",
    "Sem Ocorrência": "No Issues",
    "Com Ocorrência": "With Issues",
    
    // Section titles
    "ENTREGA": "DELIVERY",
    "REPOSIÇÃO": "REPLACEMENT",
    "Regional": "Region",
    "Período": "Period",
    "Filtros": "Filters",
    "Todas as Regionais": "All Regions",
    "Exportar Excel": "Export Excel",
    "Limpar Filtros": "Clear Filters",
    "Última atualização": "Last update",
    "Atualizar dados": "Refresh data",
    
    // Estoque
    "Estoque": "Stock",
    "Entrada": "Inbound",
    "Saída": "Outbound",
    "Saldo": "Balance",
    "Valor Total": "Total Value",
    
    // Tracking
    "Pedidos": "Orders",
    "Tipo Serviço": "Service Type",
    "Modalidade": "Mode",
    "Cidade": "City",
    "Estado": "State",
    "Status": "Status",
    
    // Faturamento
    "Faturamento": "Billing",
    "Armazenagem": "Warehousing",
    "Transporte": "Transport",
    
    // Filters
    "Meses": "Months",
    "Ano": "Year",
    "Selecionar todos": "Select all",
    "Desmarcar todos": "Deselect all",
    
    // General
    "Carregando...": "Loading...",
    "Nenhum dado": "No data",
    "UF": "State",
  },
};
