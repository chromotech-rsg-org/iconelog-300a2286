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
    "Total Expedidas": "Total Expedidas",
    "Total Baixadas": "Total Baixadas",
    "Clique para filtrar": "Clique para filtrar",
    "Entrega Finalizado": "Entrega Finalizado",
    "Entrega em Trânsito": "Entrega em Trânsito",
    "Reposição Finalizado": "Reposição Finalizado",
    "Reposição em Trânsito": "Reposição em Trânsito",
    "pedidos": "pedidos",
    "Finalizados": "Finalizados",
    "Total Geral": "Total Geral",
    "Quantidade de Pedidos": "Quantidade de Pedidos",
    "Qtde no Prazo": "Qtde no Prazo",
    "% no Prazo": "% no Prazo",
    "Qtde fora do Prazo": "Qtde fora do Prazo",
    "% fora do Prazo": "% fora do Prazo",
    "Total SKUs": "Total SKUs",
    "Total Estoque": "Total Estoque",
    "Total Kits": "Total Kits",
    "Estoque Baixo": "Estoque Baixo",
    
    // Section titles
    "ENTREGA": "ENTREGA",
    "REPOSIÇÃO": "REPOSIÇÃO",
    "ENTREGA - PROGRESSO": "ENTREGA - PROGRESSO",
    "REPOSIÇÃO - PROGRESSO": "REPOSIÇÃO - PROGRESSO",
    "TOTAL DE PEDIDOS POR REGIÃO": "TOTAL DE PEDIDOS POR REGIÃO",
    "Regional": "Regional",
    "Período": "Período",
    "Filtros": "Filtros",
    "Todas as Regionais": "Todas as Regionais",
    "Exportar Excel": "Exportar Excel",
    "Limpar Filtros": "Limpar Filtros",
    "Última atualização": "Última atualização",
    "Atualizar dados": "Atualizar dados",
    "Limpar todos": "Limpar todos",
    "Tipo": "Tipo",
    
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
    "Total Expedidas": "Total Dispatched",
    "Total Baixadas": "Total Delivered",
    "Clique para filtrar": "Click to filter",
    "Entrega Finalizado": "Delivery Completed",
    "Entrega em Trânsito": "Delivery In Transit",
    "Reposição Finalizado": "Replacement Completed",
    "Reposição em Trânsito": "Replacement In Transit",
    "pedidos": "orders",
    "Finalizados": "Completed",
    "Total Geral": "Grand Total",
    "Quantidade de Pedidos": "Number of Orders",
    "Qtde no Prazo": "Qty On Time",
    "% no Prazo": "% On Time",
    "Qtde fora do Prazo": "Qty Overdue",
    "% fora do Prazo": "% Overdue",
    "Total SKUs": "Total SKUs",
    "Total Estoque": "Total Stock",
    "Total Kits": "Total Kits",
    "Estoque Baixo": "Low Stock",
    
    // Section titles
    "ENTREGA": "DELIVERY",
    "REPOSIÇÃO": "REPLACEMENT",
    "ENTREGA - PROGRESSO": "DELIVERY - PROGRESS",
    "REPOSIÇÃO - PROGRESSO": "REPLACEMENT - PROGRESS",
    "TOTAL DE PEDIDOS POR REGIÃO": "TOTAL ORDERS BY REGION",
    "Regional": "Region",
    "Período": "Period",
    "Filtros": "Filters",
    "Todas as Regionais": "All Regions",
    "Exportar Excel": "Export Excel",
    "Limpar Filtros": "Clear Filters",
    "Última atualização": "Last update",
    "Atualizar dados": "Refresh data",
    "Limpar todos": "Clear all",
    "Tipo": "Type",
    
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
