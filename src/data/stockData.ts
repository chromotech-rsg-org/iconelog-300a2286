// Mock data for B-Side Estoque

export interface SKUItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  stockQuantity: number;
  kitsQuantity: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  imageUrl: string;
  lastUpdate: Date;
  location: string;
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
  const products: Omit<SKUItem, 'id' | 'stockQuantity' | 'kitsQuantity' | 'lastUpdate'>[] = [
    {
      sku: "SKU-001",
      name: "Smartphone Samsung Galaxy A54",
      description: "Smartphone Android 128GB, 6GB RAM, Tela 6.4 polegadas",
      category: "Eletrônicos",
      minStock: 50,
      maxStock: 500,
      unitPrice: 1899.99,
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
      location: "Armazém A - Prateleira 1",
      supplier: "Samsung Brasil"
    },
    {
      sku: "SKU-002",
      name: "Fone Bluetooth JBL Tune 510",
      description: "Fone de ouvido sem fio, 40h de bateria, Microfone integrado",
      category: "Eletrônicos",
      minStock: 100,
      maxStock: 800,
      unitPrice: 249.99,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      location: "Armazém A - Prateleira 2",
      supplier: "JBL Oficial"
    },
    {
      sku: "SKU-003",
      name: "Caixa de Papelão 40x30x20",
      description: "Caixa de papelão ondulado reforçada para envio",
      category: "Embalagens",
      minStock: 500,
      maxStock: 5000,
      unitPrice: 4.50,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
      location: "Armazém B - Setor Embalagens",
      supplier: "Embalagens Express"
    },
    {
      sku: "SKU-004",
      name: "Arroz Integral Orgânico 1kg",
      description: "Arroz integral orgânico tipo 1, embalagem de 1kg",
      category: "Produtos Alimentícios",
      minStock: 200,
      maxStock: 2000,
      unitPrice: 12.90,
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop",
      location: "Armazém C - Setor Alimentos",
      supplier: "Orgânicos Brasil"
    },
    {
      sku: "SKU-005",
      name: "Detergente Multiuso 500ml",
      description: "Detergente concentrado multiuso, fragrância limão",
      category: "Produtos de Limpeza",
      minStock: 300,
      maxStock: 3000,
      unitPrice: 8.50,
      imageUrl: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&h=400&fit=crop",
      location: "Armazém D - Setor Limpeza",
      supplier: "Clean Products"
    },
    {
      sku: "SKU-006",
      name: "Água Mineral 500ml Pack 12un",
      description: "Água mineral natural sem gás, pack com 12 garrafas",
      category: "Bebidas",
      minStock: 400,
      maxStock: 4000,
      unitPrice: 18.90,
      imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop",
      location: "Armazém E - Setor Bebidas",
      supplier: "Água Pura LTDA"
    },
    {
      sku: "SKU-007",
      name: "Creme Hidratante Facial 50ml",
      description: "Creme hidratante facial com vitamina E e ácido hialurônico",
      category: "Cosméticos",
      minStock: 80,
      maxStock: 600,
      unitPrice: 89.90,
      imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
      location: "Armazém F - Setor Cosméticos",
      supplier: "Beauty Corp"
    },
    {
      sku: "SKU-008",
      name: "Vitamina C 1000mg 60 Cápsulas",
      description: "Suplemento vitamínico com 60 cápsulas de vitamina C",
      category: "Medicamentos",
      minStock: 150,
      maxStock: 1500,
      unitPrice: 45.00,
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop",
      location: "Armazém G - Setor Farmacêutico",
      supplier: "Pharma Health"
    },
    {
      sku: "SKU-009",
      name: "Notebook Dell Inspiron 15",
      description: "Notebook Intel Core i5, 8GB RAM, 256GB SSD, Tela 15.6 polegadas",
      category: "Eletrônicos",
      minStock: 20,
      maxStock: 150,
      unitPrice: 3499.00,
      imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
      location: "Armazém A - Prateleira 3",
      supplier: "Dell Brasil"
    },
    {
      sku: "SKU-010",
      name: "Café Premium Torrado 500g",
      description: "Café 100% arábica, torrado e moído, embalagem a vácuo",
      category: "Produtos Alimentícios",
      minStock: 250,
      maxStock: 2500,
      unitPrice: 28.90,
      imageUrl: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop",
      location: "Armazém C - Setor Alimentos",
      supplier: "Café Premium LTDA"
    },
    {
      sku: "SKU-011",
      name: "Plástico Bolha 100m",
      description: "Rolo de plástico bolha para proteção, 100 metros",
      category: "Embalagens",
      minStock: 100,
      maxStock: 1000,
      unitPrice: 75.00,
      imageUrl: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400&h=400&fit=crop",
      location: "Armazém B - Setor Embalagens",
      supplier: "Embalagens Express"
    },
    {
      sku: "SKU-012",
      name: "Refrigerante Cola 2L Pack 6un",
      description: "Refrigerante sabor cola, pack com 6 garrafas de 2 litros",
      category: "Bebidas",
      minStock: 350,
      maxStock: 3500,
      unitPrice: 42.00,
      imageUrl: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop",
      location: "Armazém E - Setor Bebidas",
      supplier: "Bebidas Brasil"
    }
  ];

  return products.map((product, index) => ({
    ...product,
    id: `item-${index + 1}`,
    stockQuantity: Math.floor(Math.random() * (product.maxStock - product.minStock)) + product.minStock,
    kitsQuantity: Math.floor(Math.random() * 50) + 5,
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
