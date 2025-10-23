import { Product, Store } from '@/types/product';

/**
 * Mock data para productos Liqui.cl (limpieza y autocuidado)
 * En producción vendría de Open Beauty Facts / Open Products Facts + API local de precios
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    barcode: '7802420100028',
    name: 'Detergente Líquido Concentrado 3L',
    brand: 'Popeye',
    category: 'Limpieza',
    product_info: {
      package_type: 'plástico reciclable',
      package_recyclable: true,
      package_size_ml: 3000,
      doses_per_package: 60,
      concentration: 'concentrado',
      biodegradable: true,
      phosphate_free: true,
      chlorine_free: true,
      certifications: ['Ecocert'],
    },
    labels: ['biodegradable', 'sin-fosfatos', 'concentrado'],
    eco_score: 82,
    social_score: 75,
    image_url: '/placeholder.svg',
    last_seen_price_clp: 8990,
    last_vendor: 'Liqui.cl',
    carbon_gco2e: 450,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    barcode: '7802420200019',
    name: 'Pañales Ecológicos Talla M x40',
    brand: 'BabyGreen',
    category: 'Infantil y bebé',
    product_info: {
      package_type: 'cartón reciclable',
      package_recyclable: true,
      biodegradable: true,
      chlorine_free: true,
      fragrance_free: true,
      cruelty_free: true,
      certifications: ['FSC', 'Dermatológicamente testad'],
    },
    labels: ['hipoalergénico', 'sin-cloro', 'biodegradable'],
    eco_score: 88,
    social_score: 85,
    image_url: '/placeholder.svg',
    last_seen_price_clp: 12990,
    last_vendor: 'Liqui.cl',
    carbon_gco2e: 280,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    barcode: '7802420300016',
    name: 'Shampoo Natural Sin Sulfatos 400ml',
    brand: 'NaturalCare',
    category: 'Cuidado personal',
    product_info: {
      package_type: 'plástico reciclado',
      package_recyclable: true,
      package_size_ml: 400,
      vegan: true,
      cruelty_free: true,
      paraben_free: true,
      fragrance_free: false,
      certifications: ['Leaping Bunny', 'Vegan Society'],
    },
    labels: ['vegano', 'cruelty-free', 'sin-parabenos', 'sin-sulfatos'],
    eco_score: 85,
    social_score: 92,
    image_url: '/placeholder.svg',
    last_seen_price_clp: 6990,
    last_vendor: 'Liqui.cl',
    carbon_gco2e: 180,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    barcode: '7802420400013',
    name: 'Papel Higiénico Bambú 4 Rollos',
    brand: 'EcoPapel',
    category: 'Papeles',
    product_info: {
      package_type: 'papel reciclado',
      package_recyclable: true,
      biodegradable: true,
      chlorine_free: true,
      certifications: ['FSC', 'Rainforest Alliance'],
    },
    labels: ['bambú', 'sin-cloro', 'biodegradable', '100% reciclable'],
    eco_score: 90,
    social_score: 80,
    image_url: '/placeholder.svg',
    last_seen_price_clp: 4990,
    last_vendor: 'Liqui.cl',
    carbon_gco2e: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    barcode: '7802420500010',
    name: 'Toallas Húmedas Biodegradables x80',
    brand: 'BabyCare',
    category: 'Infantil y bebé',
    product_info: {
      package_type: 'plástico biodegradable',
      package_recyclable: false,
      biodegradable: true,
      chlorine_free: true,
      fragrance_free: true,
      paraben_free: true,
      certifications: ['Dermatológicamente testado'],
    },
    labels: ['biodegradable', 'hipoalergénico', 'sin-alcohol'],
    eco_score: 78,
    social_score: 82,
    image_url: '/placeholder.svg',
    last_seen_price_clp: 3490,
    last_vendor: 'Liqui.cl',
    carbon_gco2e: 95,
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
