// Mock data for Faturamento page
import { regions } from "./mockData";
import { tiposServico, modalidades } from "./trackingData";

export interface FaturamentoMensal {
  mes: string;
  mesNum: number;
  ano: number;
  faturamento: number;
  armazenagem: number;
  transporte: number;
}

export interface FaturamentoRegional {
  regional: string;
  valor: number;
}

export interface FaturamentoData {
  tipoServico: { name: string; value: number }[];
  modalidade: { name: string; value: number }[];
  campanha: { name: string; value: number }[];
  regional: { name: string; value: number }[];
}

export const campanhas = [
  "Black Friday",
  "Natal",
  "Dia das Mães",
  "Dia dos Pais",
  "Páscoa",
  "Carnaval",
  "Regular",
];

export const generateFaturamentoMensal = (year: number = 2025): FaturamentoMensal[] => {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  
  return meses.map((mes, index) => {
    const faturamento = Math.random() * 500000 + 200000;
    const armazenagemPercent = Math.random() * 0.3 + 0.2;
    
    return {
      mes,
      mesNum: index + 1,
      ano: year,
      faturamento,
      armazenagem: faturamento * armazenagemPercent,
      transporte: faturamento * (1 - armazenagemPercent),
    };
  });
};

export const generateFaturamentoByTipoServico = (): { name: string; value: number }[] => {
  return tiposServico.map(tipo => ({
    name: tipo,
    value: Math.random() * 200000 + 50000,
  }));
};

export const generateFaturamentoByModalidade = (): { name: string; value: number }[] => {
  return modalidades.map(mod => ({
    name: mod,
    value: Math.random() * 150000 + 30000,
  }));
};

export const generateFaturamentoByCampanha = (): { name: string; value: number }[] => {
  return campanhas.map(camp => ({
    name: camp,
    value: Math.random() * 100000 + 20000,
  }));
};

export const generateFaturamentoByRegional = (): FaturamentoRegional[] => {
  return regions.map(regional => ({
    regional,
    valor: Math.random() * 80000 + 10000,
  }));
};

export const calculateFaturamentoTotals = (data: FaturamentoMensal[]) => {
  const totals = data.reduce((acc, item) => ({
    faturamento: acc.faturamento + item.faturamento,
    armazenagem: acc.armazenagem + item.armazenagem,
    transporte: acc.transporte + item.transporte,
  }), { faturamento: 0, armazenagem: 0, transporte: 0 });

  return {
    ...totals,
    percentArmazenagem: (totals.armazenagem / totals.faturamento) * 100,
    percentTransporte: (totals.transporte / totals.faturamento) * 100,
  };
};
