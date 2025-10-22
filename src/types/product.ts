export interface NutrientInfo {
  energy_kcal?: number;
  proteins_g?: number;
  carbohydrates_g?: number;
  sugars_g?: number;
  fat_g?: number;
  saturated_fat_g?: number;
  fiber_g?: number;
  sodium_mg?: number;
  salt_g?: number;
  calcium_mg?: number;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  nutrients: NutrientInfo;
  labels: string[];
  eco_score: number; // 0-100
  social_score: number; // 0-100
  image_url?: string;
  last_seen_price_clp: number;
  last_vendor: string;
  carbon_gco2e?: number;
  created_at: string;
  updated_at: string;
}

export interface Alternative {
  product: Product;
  similarity: number; // 0-1
  price_delta_clp: number;
  eco_delta: number;
  social_delta: number;
  explanation: string;
}

export interface ShoppingListItem {
  id: string;
  product: Product;
  quantity: number;
  locked: boolean;
  chosen_price_clp?: number;
  vendor?: string;
}

export interface ShoppingList {
  id: string;
  title: string;
  budget_clp: number;
  user_location_lat?: number;
  user_location_lon?: number;
  items: ShoppingListItem[];
  created_at: string;
}

export interface OptimizationWeights {
  price: number; // 0-1
  environmental: number; // 0-1
  social: number; // 0-1
}

export interface OptimizationResult {
  selected_items: ShoppingListItem[];
  total_cost_clp: number;
  savings_clp: number;
  total_eco_score: number;
  total_social_score: number;
  explanation: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  vendor_code: string;
}
