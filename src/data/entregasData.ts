// Mock data for B-Side Entregas page
import { regions } from "./mockData";

export interface DeliveryData {
  id: string;
  regional: string;
  entregaFinalizado: number;
  entregaEmTransito: number;
  entregaTotal: number;
  reposicaoFinalizado: number;
  reposicaoEmTransito: number;
  reposicaoTotal: number;
}

export interface DeliveryItem {
  id: string;
  pedido: string;
  cliente: string;
  regional: string;
  tipo: "Entrega" | "Reposição";
  status: "Finalizado" | "Em Trânsito" | "Pendente";
  dataEnvio: Date;
  dataEntrega?: Date;
  kits: number;
  itens: number;
}

export const generateDeliveryData = (): DeliveryData[] => {
  return regions.map((regional, index) => {
    const entregaFinalizado = Math.floor(Math.random() * 500) + 100;
    const entregaEmTransito = Math.floor(Math.random() * 200) + 50;
    const reposicaoFinalizado = Math.floor(Math.random() * 300) + 50;
    const reposicaoEmTransito = Math.floor(Math.random() * 150) + 20;
    
    return {
      id: `delivery-${index}`,
      regional,
      entregaFinalizado,
      entregaEmTransito,
      entregaTotal: entregaFinalizado + entregaEmTransito,
      reposicaoFinalizado,
      reposicaoEmTransito,
      reposicaoTotal: reposicaoFinalizado + reposicaoEmTransito,
    };
  });
};

export const generateDeliveryItems = (count: number = 100): DeliveryItem[] => {
  const items: DeliveryItem[] = [];
  const tipos: ("Entrega" | "Reposição")[] = ["Entrega", "Reposição"];
  const statuses: ("Finalizado" | "Em Trânsito" | "Pendente")[] = ["Finalizado", "Em Trânsito", "Pendente"];
  
  for (let i = 0; i < count; i++) {
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const dataEnvio = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    items.push({
      id: `item-${i}`,
      pedido: `PED-${String(10000 + i).padStart(6, '0')}`,
      cliente: `Cliente ${i + 1}`,
      regional: regions[Math.floor(Math.random() * regions.length)],
      tipo,
      status,
      dataEnvio,
      dataEntrega: status === "Finalizado" ? new Date(dataEnvio.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000) : undefined,
      kits: Math.floor(Math.random() * 10) + 1,
      itens: Math.floor(Math.random() * 50) + 5,
    });
  }
  
  return items;
};

export const calculateDeliveryTotals = (data: DeliveryData[]) => {
  return data.reduce((acc, item) => ({
    entregaFinalizado: acc.entregaFinalizado + item.entregaFinalizado,
    entregaEmTransito: acc.entregaEmTransito + item.entregaEmTransito,
    entregaTotal: acc.entregaTotal + item.entregaTotal,
    reposicaoFinalizado: acc.reposicaoFinalizado + item.reposicaoFinalizado,
    reposicaoEmTransito: acc.reposicaoEmTransito + item.reposicaoEmTransito,
    reposicaoTotal: acc.reposicaoTotal + item.reposicaoTotal,
  }), {
    entregaFinalizado: 0,
    entregaEmTransito: 0,
    entregaTotal: 0,
    reposicaoFinalizado: 0,
    reposicaoEmTransito: 0,
    reposicaoTotal: 0,
  });
};
