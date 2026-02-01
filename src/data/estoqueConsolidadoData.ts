// Mock data for Estoque Consolidado page

export interface EstoqueMatriz {
  id: string;
  sku: string;
  nome: string;
  grupo: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  m3: number;
  tempoParado: number; // dias
}

export interface EstoqueBase {
  id: string;
  base: string;
  sku: string;
  nome: string;
  grupo: string;
  quantidade: number;
  valorTotal: number;
  m3: number;
}

export const grupos = [
  "Eletrônicos",
  "Móveis",
  "Utensílios",
  "Equipamentos",
  "Materiais",
  "Embalagens",
];

export const bases = [
  "São Paulo",
  "Rio de Janeiro",
  "Curitiba",
  "Belo Horizonte",
  "Porto Alegre",
];

export const generateEstoqueMatriz = (count: number = 50): EstoqueMatriz[] => {
  const items: EstoqueMatriz[] = [];
  
  for (let i = 0; i < count; i++) {
    const quantidade = Math.floor(Math.random() * 1000) + 50;
    const valorUnitario = Math.random() * 500 + 10;
    
    items.push({
      id: `matriz-${i}`,
      sku: `SKU-M${String(1000 + i).padStart(4, '0')}`,
      nome: `Produto Matriz ${i + 1}`,
      grupo: grupos[Math.floor(Math.random() * grupos.length)],
      quantidade,
      valorUnitario,
      valorTotal: quantidade * valorUnitario,
      m3: Math.random() * 50 + 1,
      tempoParado: Math.floor(Math.random() * 180),
    });
  }
  
  return items;
};

export const generateEstoqueBase = (count: number = 80): EstoqueBase[] => {
  const items: EstoqueBase[] = [];
  
  for (let i = 0; i < count; i++) {
    const quantidade = Math.floor(Math.random() * 500) + 20;
    const valorUnitario = Math.random() * 300 + 10;
    
    items.push({
      id: `base-${i}`,
      base: bases[Math.floor(Math.random() * bases.length)],
      sku: `SKU-B${String(2000 + i).padStart(4, '0')}`,
      nome: `Produto Base ${i + 1}`,
      grupo: grupos[Math.floor(Math.random() * grupos.length)],
      quantidade,
      valorTotal: quantidade * valorUnitario,
      m3: Math.random() * 30 + 0.5,
    });
  }
  
  return items;
};

export const calculateMatrizTotals = (data: EstoqueMatriz[]) => {
  return {
    valor: data.reduce((sum, item) => sum + item.valorTotal, 0),
    m3: data.reduce((sum, item) => sum + item.m3, 0),
    qtdeSKUs: data.length,
  };
};

export const calculateBaseTotals = (data: EstoqueBase[]) => {
  return {
    valor: data.reduce((sum, item) => sum + item.valorTotal, 0),
    m3: data.reduce((sum, item) => sum + item.m3, 0),
    qtdeSKUs: new Set(data.map(d => d.sku)).size,
  };
};

export const getEstoqueByGrupo = (data: EstoqueMatriz[]) => {
  const grouped = new Map<string, number>();
  data.forEach(item => {
    grouped.set(item.grupo, (grouped.get(item.grupo) || 0) + item.valorTotal);
  });
  return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
};

export const getTempoParadoByGrupo = (data: EstoqueMatriz[]) => {
  const grouped = new Map<string, { total: number; count: number }>();
  data.forEach(item => {
    const current = grouped.get(item.grupo) || { total: 0, count: 0 };
    grouped.set(item.grupo, { 
      total: current.total + item.tempoParado, 
      count: current.count + 1 
    });
  });
  return Array.from(grouped.entries()).map(([name, { total, count }]) => ({ 
    name, 
    value: Math.round(total / count) 
  }));
};

export const getTopTempoParado = (data: EstoqueMatriz[], limit: number = 10) => {
  return [...data]
    .sort((a, b) => b.tempoParado - a.tempoParado)
    .slice(0, limit)
    .map(item => ({ name: item.sku, value: item.tempoParado }));
};
