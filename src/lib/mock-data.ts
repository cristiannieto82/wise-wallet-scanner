import { Product, Store } from '@/types/product';

/**
 * Mock data for Chilean products
 * In production, this would come from Open Food Facts + local pricing API
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    barcode: '7804650001234',
    name: 'Leche Descremada 1L',
    brand: 'Colun',
    category: 'Lácteos',
    nutrients: {
      energy_kcal: 35,
      proteins_g: 3.4,
      carbohydrates_g: 5,
      sugars_g: 5,
      fat_g: 0.1,
      calcium_mg: 120,
    },
    labels: ['sin-lactosa', 'local', 'descremada'],
    eco_score: 78,
    social_score: 85,
    image_url: '/placeholder.svg',
    last_seen_price_clp: 1290,
    last_vendor: 'Jumbo',
    carbon_gco2e: 320,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    barcode: '7804650005678',
    name: 'Arroz Grado 1 1kg',
    brand: 'Tucapel',
    category: 'Abarrotes',
    nutrients: {
      energy_kcal: 358,
      proteins_g: 7.5,
      carbohydrates_g: 78,
      fat_g: 0.6,
      fiber_g: 1.4,
    },
    labels: ['grano-entero', 'nacional'],
    eco_score: 72,
    social_score: 68,
    image_url: '/placeholder.svg',
    last_seen_price_clp: 1490,
    last_vendor: 'Lider',
    carbon_gco2e: 280,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    barcode: '7804650009012',
    name: 'Aceite de Oliva Extra Virgen 500ml',
    brand: 'Borges',
    category: 'Aceites',
    nutrients: {
      energy_kcal: 884,
      fat_g: 100,
      saturated_fat_g: 14,
    },
    labels: ['organico', 'extra-virgen', 'importado'],
    eco_score: 85,
    social_score: 75,
    image_url: '/placeholder.svg',
    last_seen_price_clp: 5990,
    last_vendor: 'Unimarc',
    carbon_gco2e: 450,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    barcode: '7804650003456',
    name: 'Pan Integral 500g',
    brand: 'Ideal',
    category: 'Panadería',
    nutrients: {
      energy_kcal: 247,
      proteins_g: 9,
      carbohydrates_g: 49,
      fiber_g: 7,
      fat_g: 3.5,
    },
    labels: ['integral', 'alto-fibra', 'sin-conservantes'],
    eco_score: 68,
    social_score: 72,
    image_url: '/placeholder.svg',
    last_seen_price_clp: 1890,
    last_vendor: 'Santa Isabel',
    carbon_gco2e: 180,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    barcode: '7804650007890',
    name: 'Tomate Triturado 400g',
    brand: 'Malloa',
    category: 'Conservas',
    nutrients: {
      energy_kcal: 32,
      proteins_g: 1.5,
      carbohydrates_g: 6.5,
      fiber_g: 2,
      sodium_mg: 240,
    },
    labels: ['sin-azucar-agregado', 'local', 'lata-reciclable'],
    eco_score: 75,
    social_score: 80,
    image_url: '/placeholder.svg',
    last_seen_price_clp: 890,
    last_vendor: 'Jumbo',
    carbon_gco2e: 150,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_STORES: Store[] = [
  {
    id: '1',
    name: 'Jumbo Kennedy',
    address: 'Av. Kennedy 9001, Las Condes',
    lat: -33.4042,
    lon: -70.5735,
    vendor_code: 'JUMBO',
  },
  {
    id: '2',
    name: 'Lider Express Providencia',
    address: 'Av. Providencia 2331, Providencia',
    lat: -33.4264,
    lon: -70.6106,
    vendor_code: 'LIDER',
  },
  {
    id: '3',
    name: 'Unimarc Bellavista',
    address: 'Pío Nono 355, Recoleta',
    lat: -33.4342,
    lon: -70.6356,
    vendor_code: 'UNIMARC',
  },
  {
    id: '4',
    name: 'Santa Isabel Ñuñoa',
    address: 'Av. Irarrázaval 3850, Ñuñoa',
    lat: -33.4568,
    lon: -70.5986,
    vendor_code: 'SANTA_ISABEL',
  },
];

/**
 * Search products by query and category
 */
export const searchProducts = (query: string, category?: string): Product[] => {
  let results = MOCK_PRODUCTS;
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.brand.toLowerCase().includes(lowerQuery) ||
        p.barcode.includes(lowerQuery)
    );
  }
  
  if (category) {
    results = results.filter((p) => p.category === category);
  }
  
  return results;
};

/**
 * Get product by barcode
 */
export const getProductByBarcode = (barcode: string): Product | undefined => {
  return MOCK_PRODUCTS.find((p) => p.barcode === barcode);
};

/**
 * Get categories
 */
export const getCategories = (): string[] => {
  return Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category)));
};
