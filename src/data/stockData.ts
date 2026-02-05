// Mock data for B-Side Estoque

export interface SKUItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  grupo: 'FOOD D-SIDE' | 'FOOD B-SIDE';
  stockQuantity: number;
  kitsQuantity: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  m3: number;
  tempoParado: number;
  imageUrl: string;
  lastUpdate: Date;
  location: string;
  locationType: 'matriz' | 'base';
  base?: string;
  supplier: string;
}

export const stockCategories = [
  "Eletrônicos",
  "Embalagens",
  "Produtos Alimentícios",
  "Produtos de Limpeza",
  "Bebidas",
  "Cosméticos",
  "Medicamentos"
];

export const generateStockData = (): SKUItem[] => {
  const products: Omit<SKUItem, 'id' | 'stockQuantity' | 'kitsQuantity' | 'lastUpdate' | 'tempoParado'>[] = [
    {
      sku: "SKU-001",
      name: "Smartphone Samsung Galaxy A54",
      description: "Smartphone Android 128GB, 6GB RAM, Tela 6.4 polegadas",
      category: "Eletrônicos",
      grupo: "FOOD D-SIDE",
      minStock: 50,
      maxStock: 500,
      unitPrice: 1899.99,
      m3: 0.002,
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
      location: "Armazém A - Prateleira 1",
      locationType: "matriz",
      supplier: "Samsung Brasil"
    },
    {
      sku: "SKU-002",
      name: "Fone Bluetooth JBL Tune 510",
      description: "Fone de ouvido sem fio, 40h de bateria, Microfone integrado",
      category: "Eletrônicos",
      grupo: "FOOD B-SIDE",
      minStock: 100,
      maxStock: 800,
      unitPrice: 249.99,
      m3: 0.001,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      location: "Armazém A - Prateleira 2",
      locationType: "base",
      base: "São Paulo",
      supplier: "JBL Oficial"
    },
    {
      sku: "SKU-003",
      name: "Caixa de Papelão 40x30x20",
      description: "Caixa de papelão ondulado reforçada para envio",
      category: "Embalagens",
      grupo: "FOOD D-SIDE",
      minStock: 500,
      maxStock: 5000,
      unitPrice: 4.50,
      m3: 0.024,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
      location: "Armazém B - Setor Embalagens",
      locationType: "matriz",
      supplier: "Embalagens Express"
    },
    {
      sku: "SKU-004",
      name: "Arroz Integral Orgânico 1kg",
      description: "Arroz integral orgânico tipo 1, embalagem de 1kg",
      category: "Produtos Alimentícios",
      grupo: "FOOD B-SIDE",
      minStock: 200,
      maxStock: 2000,
      unitPrice: 12.90,
      m3: 0.001,
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop",
      location: "Armazém C - Setor Alimentos",
      locationType: "base",
      base: "Rio de Janeiro",
      supplier: "Orgânicos Brasil"
    },
    {
      sku: "SKU-005",
      name: "Detergente Multiuso 500ml",
      description: "Detergente concentrado multiuso, fragrância limão",
      category: "Produtos de Limpeza",
      grupo: "FOOD D-SIDE",
      minStock: 300,
      maxStock: 3000,
      unitPrice: 8.50,
      m3: 0.0005,
      imageUrl: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&h=400&fit=crop",
      location: "Armazém D - Setor Limpeza",
      locationType: "matriz",
      supplier: "Clean Products"
    },
    {
      sku: "SKU-006",
      name: "Água Mineral 500ml Pack 12un",
      description: "Água mineral natural sem gás, pack com 12 garrafas",
      category: "Bebidas",
      grupo: "FOOD B-SIDE",
      minStock: 400,
      maxStock: 4000,
      unitPrice: 18.90,
      m3: 0.006,
      imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop",
      location: "Armazém E - Setor Bebidas",
      locationType: "base",
      base: "Belo Horizonte",
      supplier: "Água Pura LTDA"
    },
    {
      sku: "SKU-007",
      name: "Creme Hidratante Facial 50ml",
      description: "Creme hidratante facial com vitamina E e ácido hialurônico",
      category: "Cosméticos",
      grupo: "FOOD D-SIDE",
      minStock: 80,
      maxStock: 600,
      unitPrice: 89.90,
      m3: 0.0001,
      imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
      location: "Armazém F - Setor Cosméticos",
      locationType: "matriz",
      supplier: "Beauty Corp"
    },
    {
      sku: "SKU-008",
      name: "Vitamina C 1000mg 60 Cápsulas",
      description: "Suplemento vitamínico com 60 cápsulas de vitamina C",
      category: "Medicamentos",
      grupo: "FOOD B-SIDE",
      minStock: 150,
      maxStock: 1500,
      unitPrice: 45.00,
      m3: 0.0002,
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop",
      location: "Armazém G - Setor Farmacêutico",
      locationType: "base",
      base: "Curitiba",
      supplier: "Pharma Health"
    },
    {
      sku: "SKU-009",
      name: "Notebook Dell Inspiron 15",
      description: "Notebook Intel Core i5, 8GB RAM, 256GB SSD, Tela 15.6 polegadas",
      category: "Eletrônicos",
      grupo: "FOOD D-SIDE",
      minStock: 20,
      maxStock: 150,
      unitPrice: 3499.00,
      m3: 0.01,
      imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
      location: "Armazém A - Prateleira 3",
      locationType: "matriz",
      supplier: "Dell Brasil"
    },
    {
      sku: "SKU-010",
      name: "Café Premium Torrado 500g",
      description: "Café 100% arábica, torrado e moído, embalagem a vácuo",
      category: "Produtos Alimentícios",
      grupo: "FOOD B-SIDE",
      minStock: 250,
      maxStock: 2500,
      unitPrice: 28.90,
      m3: 0.001,
      imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop",
      location: "Armazém C - Setor Alimentos",
      locationType: "base",
      base: "Porto Alegre",
      supplier: "Café Premium LTDA"
    },
    {
      sku: "SKU-011",
      name: "Plástico Bolha 100m",
      description: "Rolo de plástico bolha para proteção, 100 metros",
      category: "Embalagens",
      grupo: "FOOD D-SIDE",
      minStock: 100,
      maxStock: 1000,
      unitPrice: 75.00,
      m3: 0.15,
      imageUrl: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400&h=400&fit=crop",
      location: "Armazém B - Setor Embalagens",
      locationType: "matriz",
      supplier: "Embalagens Express"
    },
    {
      sku: "SKU-012",
      name: "Refrigerante Cola 2L Pack 6un",
      description: "Refrigerante sabor cola, pack com 6 garrafas de 2 litros",
      category: "Bebidas",
      grupo: "FOOD B-SIDE",
      minStock: 350,
      maxStock: 3500,
      unitPrice: 42.00,
      m3: 0.012,
      imageUrl: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop",
      location: "Armazém E - Setor Bebidas",
      locationType: "base",
      base: "Salvador",
      supplier: "Bebidas Brasil"
    }
  ];

  return products.map((product, index) => ({
    ...product,
    id: `item-${index + 1}`,
    stockQuantity: Math.floor(Math.random() * (product.maxStock - product.minStock)) + product.minStock,
    kitsQuantity: Math.floor(Math.random() * 50) + 5,
    tempoParado: Math.floor(Math.random() * 120),
    lastUpdate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
  }));
};

export const calculateStockTotals = (items: SKUItem[]) => {
  const totalSKUs = items.length;
  const totalStock = items.reduce((sum, item) => sum + item.stockQuantity, 0);
  const totalKits = items.reduce((sum, item) => sum + item.kitsQuantity, 0);
  const totalValue = items.reduce((sum, item) => sum + (item.stockQuantity * item.unitPrice), 0);
  const lowStockItems = items.filter(item => item.stockQuantity <= item.minStock * 1.2).length;
  
  return { totalSKUs, totalStock, totalKits, totalValue, lowStockItems };
};

export const getStockByCategory = (items: SKUItem[]) => {
  const categoryMap = new Map<string, number>();
  
  items.forEach(item => {
    const current = categoryMap.get(item.category) || 0;
    categoryMap.set(item.category, current + item.stockQuantity);
  });
  
  return Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value
  }));
};

// New functions for expanded stock analytics

export const getTempoParadoCategory = (dias: number): string => {
  if (dias <= 30) return 'Antes que 30 dias';
  if (dias <= 60) return 'Entre 31 e 60 dias';
  if (dias <= 90) return 'Entre 61 e 90 dias';
  return 'Mais que 91 dias';
};

export const calculateMatrizTotals = (items: SKUItem[]) => {
  const matrizItems = items.filter(item => item.locationType === 'matriz');
  return {
    valor: matrizItems.reduce((sum, item) => sum + (item.stockQuantity * item.unitPrice), 0),
    m3: matrizItems.reduce((sum, item) => sum + (item.stockQuantity * item.m3), 0),
    qtdeSKUs: matrizItems.length,
     kits: matrizItems.reduce((sum, item) => sum + item.kitsQuantity, 0),
  };
};

export const calculateBaseTotals = (items: SKUItem[]) => {
  const baseItems = items.filter(item => item.locationType === 'base');
  return {
    valor: baseItems.reduce((sum, item) => sum + (item.stockQuantity * item.unitPrice), 0),
    m3: baseItems.reduce((sum, item) => sum + (item.stockQuantity * item.m3), 0),
    qtdeSKUs: baseItems.length,
     kits: baseItems.reduce((sum, item) => sum + item.kitsQuantity, 0),
  };
};

export const getStockByGrupo = (items: SKUItem[]) => {
  const grupoMap = new Map<string, number>();
  
  items.forEach(item => {
    const current = grupoMap.get(item.grupo) || 0;
    grupoMap.set(item.grupo, current + (item.stockQuantity * item.unitPrice));
  });
  
  return Array.from(grupoMap.entries()).map(([name, value]) => ({
    name,
    value
  }));
};

export const getTempoParadoDistribution = (items: SKUItem[]) => {
  const distribution = new Map<string, number>();
  
  items.forEach(item => {
    const category = getTempoParadoCategory(item.tempoParado);
    const current = distribution.get(category) || 0;
    distribution.set(category, current + 1);
  });
  
  const order = ['Antes que 30 dias', 'Entre 31 e 60 dias', 'Entre 61 e 90 dias', 'Mais que 91 dias'];
  return order.map(name => ({
    name,
    value: distribution.get(name) || 0
  }));
};

export const getTempoParadoMedioByGrupo = (items: SKUItem[]) => {
  const grupoData = new Map<string, { total: number; count: number }>();
  
  items.forEach(item => {
    const current = grupoData.get(item.grupo) || { total: 0, count: 0 };
    grupoData.set(item.grupo, {
      total: current.total + item.tempoParado,
      count: current.count + 1
    });
  });
  
  return Array.from(grupoData.entries()).map(([name, data]) => ({
    name,
    value: Math.round(data.total / data.count)
  }));
};

export const getMatrizItems = (items: SKUItem[]) => {
  return items.filter(item => item.locationType === 'matriz');
};

export const getBaseItems = (items: SKUItem[]) => {
  return items.filter(item => item.locationType === 'base');
};
