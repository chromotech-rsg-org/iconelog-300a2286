// Mock data for the logistics dashboard

export const regions = [
  "São Paulo",
  "Piracicaba",
  "Niterói",
  "Campinas",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Curitiba",
  "Porto Alegre",
  "Salvador",
  "Fortaleza",
  "Recife",
  "Brasília",
  "Goiânia",
  "Manaus",
  "Belém"
];

export const months = [
  { short: "Jan", full: "Janeiro", value: 1 },
  { short: "Fev", full: "Fevereiro", value: 2 },
  { short: "Mar", full: "Março", value: 3 },
  { short: "Abr", full: "Abril", value: 4 },
  { short: "Mai", full: "Maio", value: 5 },
  { short: "Jun", full: "Junho", value: 6 },
  { short: "Jul", full: "Julho", value: 7 },
  { short: "Ago", full: "Agosto", value: 8 },
  { short: "Set", full: "Setembro", value: 9 },
  { short: "Out", full: "Outubro", value: 10 },
  { short: "Nov", full: "Novembro", value: 11 },
  { short: "Dez", full: "Dezembro", value: 12 }
];

export const years = [2024, 2025, 2026];

// Generate random data for regional comparison
export const generateRegionalData = () => {
  return regions.map(region => ({
    name: region,
    expedidas: Math.floor(Math.random() * 50000) + 20000,
    baixadas: Math.floor(Math.random() * 45000) + 18000
  }));
};

// Generate daily data for a month (30 days)
export const generateDailyData = (region: string) => {
  const days = [];
  for (let i = 1; i <= 30; i++) {
    days.push({
      day: i,
      expedidas: Math.floor(Math.random() * 2000) + 500,
      baixadas: Math.floor(Math.random() * 1800) + 450
    });
  }
  return {
    region,
    data: days
  };
};

// Generate all regional daily data
export const generateAllRegionalDailyData = () => {
  return regions.map(region => generateDailyData(region));
};

// Calculate totals
export const calculateTotals = (regionalData: ReturnType<typeof generateRegionalData>) => {
  const totalExpedidas = regionalData.reduce((sum, item) => sum + item.expedidas, 0);
  const totalBaixadas = regionalData.reduce((sum, item) => sum + item.baixadas, 0);
  return { totalExpedidas, totalBaixadas };
};

// Format currency
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Format number with thousands separator
export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};
