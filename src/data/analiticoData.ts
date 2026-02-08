// Mock data for Analítico page
import { regions } from "./mockData";

export interface AnaliticoMetrica {
  nome: string;
  valor: number;
  variacao: number;
  tendencia: "up" | "down" | "stable";
}

export interface AnaliticoComparativo {
  periodo: string;
  atual: number;
  anterior: number;
  meta: number;
}

export interface AnaliticoRegional {
  regional: string;
  entregas: number;
  devolucoes: number;
  noPrazo: number;
  faturamento: number;
  satisfacao: number;
}

export const subAbas = [
  { id: "visao-geral", nome: "Visão Geral" },
  { id: "mapeamento-cidades", nome: "Mapeamento Cidades" },
  { id: "entregas", nome: "Entregas" },
  { id: "devolucoes", nome: "Devoluções" },
  { id: "prazos", nome: "Prazos" },
  { id: "custos", nome: "Custos" },
  { id: "satisfacao", nome: "Satisfação" },
];

export const generateMetricas = (): AnaliticoMetrica[] => {
  return [
    { nome: "Total de Entregas", valor: 45678, variacao: 12.5, tendencia: "up" },
    { nome: "Taxa de Sucesso", valor: 94.2, variacao: 2.3, tendencia: "up" },
    { nome: "Tempo Médio (dias)", valor: 3.4, variacao: -0.5, tendencia: "down" },
    { nome: "Custo por Entrega", valor: 45.80, variacao: -3.2, tendencia: "down" },
    { nome: "Devoluções", valor: 2.8, variacao: -0.8, tendencia: "down" },
    { nome: "Satisfação Cliente", valor: 4.6, variacao: 0.2, tendencia: "up" },
  ];
};

export const generateComparativo = (): AnaliticoComparativo[] => {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  
  return meses.map(periodo => {
    const meta = Math.random() * 2000 + 3000;
    const atual = meta * (Math.random() * 0.4 + 0.8);
    const anterior = meta * (Math.random() * 0.3 + 0.7);
    
    return { periodo, atual, anterior, meta };
  });
};

export const generateAnaliticoRegional = (): AnaliticoRegional[] => {
  return regions.map(regional => ({
    regional,
    entregas: Math.floor(Math.random() * 5000) + 1000,
    devolucoes: Math.floor(Math.random() * 200) + 20,
    noPrazo: Math.random() * 15 + 80,
    faturamento: Math.random() * 500000 + 100000,
    satisfacao: Math.random() * 1.5 + 3.5,
  }));
};
