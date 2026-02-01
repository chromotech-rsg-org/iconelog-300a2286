// Mock data for Tracking Consolidado page
import { regions } from "./mockData";

export interface TrackingOrder {
  id: string;
  pedido: string;
  cliente: string;
  regional: string;
  cidade: string;
  estado: string;
  tipoServico: string;
  modalidade: string;
  status: "Finalizado" | "Em Trânsito" | "Pendente";
  noPrazo: boolean;
  dataPedido: Date;
  dataEntrega?: Date;
  prazoEntrega: Date;
  itens: number;
  valor: number;
}

export interface TrackingTotals {
  quantidadePedidos: number;
  qtdeNoPrazo: number;
  percentualNoPrazo: number;
  qtdeFora: number;
  percentualFora: number;
  statusFinalizado: number;
  statusTransito: number;
}

export const tiposServico = [
  "Entrega Expressa",
  "Entrega Normal",
  "Entrega Agendada",
  "Reposição",
  "Devolução",
];

export const modalidades = [
  "Rodoviário",
  "Aéreo",
  "Misto",
  "Motoboy",
];

export const estados = [
  "SP", "RJ", "MG", "PR", "SC", "RS", "BA", "PE", "CE", "GO", "DF", "AM", "PA"
];

export const cidades = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre",
  "Salvador", "Recife", "Fortaleza", "Brasília", "Goiânia", "Manaus", "Belém",
  "Campinas", "Guarulhos", "São Bernardo", "Santo André", "Osasco", "Niterói"
];

export const generateTrackingOrders = (count: number = 200): TrackingOrder[] => {
  const orders: TrackingOrder[] = [];
  
  for (let i = 0; i < count; i++) {
    const dataPedido = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
    const prazoEntrega = new Date(dataPedido.getTime() + (Math.random() * 10 + 2) * 24 * 60 * 60 * 1000);
    const status = Math.random() > 0.3 ? "Finalizado" : Math.random() > 0.5 ? "Em Trânsito" : "Pendente";
    const dataEntrega = status === "Finalizado" 
      ? new Date(dataPedido.getTime() + Math.random() * 8 * 24 * 60 * 60 * 1000)
      : undefined;
    const noPrazo = dataEntrega ? dataEntrega <= prazoEntrega : Math.random() > 0.2;
    
    orders.push({
      id: `order-${i}`,
      pedido: `ORD-${String(20000 + i).padStart(6, '0')}`,
      cliente: `Cliente ${i + 1}`,
      regional: regions[Math.floor(Math.random() * regions.length)],
      cidade: cidades[Math.floor(Math.random() * cidades.length)],
      estado: estados[Math.floor(Math.random() * estados.length)],
      tipoServico: tiposServico[Math.floor(Math.random() * tiposServico.length)],
      modalidade: modalidades[Math.floor(Math.random() * modalidades.length)],
      status,
      noPrazo,
      dataPedido,
      dataEntrega,
      prazoEntrega,
      itens: Math.floor(Math.random() * 20) + 1,
      valor: Math.random() * 5000 + 100,
    });
  }
  
  return orders;
};

export const calculateTrackingTotals = (orders: TrackingOrder[]): TrackingTotals => {
  const finalizados = orders.filter(o => o.status === "Finalizado");
  const emTransito = orders.filter(o => o.status === "Em Trânsito");
  const noPrazo = orders.filter(o => o.noPrazo);
  const foraPrazo = orders.filter(o => !o.noPrazo);
  
  return {
    quantidadePedidos: orders.length,
    qtdeNoPrazo: noPrazo.length,
    percentualNoPrazo: (noPrazo.length / orders.length) * 100,
    qtdeFora: foraPrazo.length,
    percentualFora: (foraPrazo.length / orders.length) * 100,
    statusFinalizado: finalizados.length,
    statusTransito: emTransito.length,
  };
};

export const getOrdersByTipoServico = (orders: TrackingOrder[]) => {
  const grouped = new Map<string, number>();
  orders.forEach(order => {
    grouped.set(order.tipoServico, (grouped.get(order.tipoServico) || 0) + 1);
  });
  return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
};

export const getOrdersByModalidade = (orders: TrackingOrder[]) => {
  const grouped = new Map<string, number>();
  orders.forEach(order => {
    grouped.set(order.modalidade, (grouped.get(order.modalidade) || 0) + 1);
  });
  return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
};

export const getOrdersByCidade = (orders: TrackingOrder[]) => {
  const grouped = new Map<string, number>();
  orders.forEach(order => {
    grouped.set(order.cidade, (grouped.get(order.cidade) || 0) + 1);
  });
  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
};

export const getOrdersByRegional = (orders: TrackingOrder[]) => {
  const grouped = new Map<string, number>();
  orders.forEach(order => {
    grouped.set(order.regional, (grouped.get(order.regional) || 0) + 1);
  });
  return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
};

export const getOrdersByEstado = (orders: TrackingOrder[]) => {
  const grouped = new Map<string, number>();
  orders.forEach(order => {
    grouped.set(order.estado, (grouped.get(order.estado) || 0) + 1);
  });
  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};
