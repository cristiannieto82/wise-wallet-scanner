import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Product {
  id: string;
  name: string;
  brand: string;
  last_seen_price_clp: number;
  eco_score: number;
  social_score: number;
  category: string;
}

interface ListItem {
  id: string;
  product_id: string;
  quantity: number;
  locked: boolean;
  product: Product;
}

interface Alternative {
  product_id: string;
  alt_product_id: string;
  similarity: number;
  price_delta_clp: number;
  eco_delta: number;
  social_delta: number;
  product: Product;
}

interface OptimizationWeights {
  price: number;
  environmental: number;
  social: number;
}

interface KnapsackItem {
  itemId: string;
  productId: string;
  product: Product;
  quantity: number;
  totalPrice: number;
  totalEcoScore: number;
  totalSocialScore: number;
  isAlternative: boolean;
  originalItemId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { listId, weights = { price: 0.4, environmental: 0.3, social: 0.3 } } = await req.json();

    console.log('Starting knapsack optimization for list:', listId);

    // Fetch shopping list with budget
    const { data: list, error: listError } = await supabase
      .from('shopping_lists')
      .select('budget_clp')
      .eq('id', listId)
      .single();

    if (listError) throw listError;

    const budget = list.budget_clp;
    console.log('Budget:', budget, 'CLP');

    // Fetch all items in the list with products
    const { data: items, error: itemsError } = await supabase
      .from('shopping_list_items')
      .select(`
        id,
        product_id,
        quantity,
        locked,
        product:products(*)
      `)
      .eq('list_id', listId);

    if (itemsError) throw itemsError;

    // Fetch alternatives for unlocked items
    const unlockedProductIds = items
      .filter((item: any) => !item.locked)
      .map((item: any) => item.product_id);

    let alternatives: any[] = [];
    if (unlockedProductIds.length > 0) {
      const { data: alts, error: altsError } = await supabase
        .from('alternatives')
        .select(`
          product_id,
          alt_product_id,
          similarity,
          price_delta_clp,
          eco_delta,
          social_delta,
          product:products!alternatives_alt_product_id_fkey(*)
        `)
        .in('product_id', unlockedProductIds)
        .gte('similarity', 0.7);

      if (altsError) throw altsError;
      alternatives = alts || [];
    }

    console.log(`Found ${alternatives.length} alternatives for ${unlockedProductIds.length} unlocked products`);

    // Build knapsack items
    const knapsackItems: KnapsackItem[] = [];

    for (const item of items) {
      const product = Array.isArray(item.product) ? item.product[0] : item.product;
      const baseItem: KnapsackItem = {
        itemId: item.id,
        productId: product.id,
        product: product as Product,
        quantity: item.quantity,
        totalPrice: product.last_seen_price_clp * item.quantity,
        totalEcoScore: product.eco_score * item.quantity,
        totalSocialScore: product.social_score * item.quantity,
        isAlternative: false,
      };

      knapsackItems.push(baseItem);

      // Add alternatives if not locked
      if (!item.locked) {
        const itemAlts = alternatives.filter((alt: any) => alt.product_id === product.id);
        for (const alt of itemAlts) {
          const altProduct = Array.isArray(alt.product) ? alt.product[0] : alt.product;
          const altItem: KnapsackItem = {
            itemId: `${item.id}_alt_${altProduct.id}`,
            productId: altProduct.id,
            product: altProduct as Product,
            quantity: item.quantity,
            totalPrice: altProduct.last_seen_price_clp * item.quantity,
            totalEcoScore: altProduct.eco_score * item.quantity,
            totalSocialScore: altProduct.social_score * item.quantity,
            isAlternative: true,
            originalItemId: item.id,
          };
          knapsackItems.push(altItem);
        }
      }
    }

    console.log(`Total knapsack items (including alternatives): ${knapsackItems.length}`);

    // Multi-objective knapsack optimization
    const optimizedSelection = solveMultiObjectiveKnapsack(
      knapsackItems,
      budget,
      weights,
      items
    );

    // Calculate metrics
    const originalTotal = items.reduce((sum: number, item: any) => 
      sum + (item.product.last_seen_price_clp * item.quantity), 0);
    const optimizedTotal = optimizedSelection.reduce((sum, item) => sum + item.totalPrice, 0);
    const savings = originalTotal - optimizedTotal;

    const originalEcoScore = items.reduce((sum: number, item: any) => 
      sum + (item.product.eco_score * item.quantity), 0) / items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const optimizedEcoScore = optimizedSelection.reduce((sum, item) => sum + item.totalEcoScore, 0) / 
      optimizedSelection.reduce((sum, item) => sum + item.quantity, 0);

    const originalSocialScore = items.reduce((sum: number, item: any) => 
      sum + (item.product.social_score * item.quantity), 0) / items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const optimizedSocialScore = optimizedSelection.reduce((sum, item) => sum + item.totalSocialScore, 0) / 
      optimizedSelection.reduce((sum, item) => sum + item.quantity, 0);

    console.log('Optimization complete:', {
      savings,
      ecoImprovement: optimizedEcoScore - originalEcoScore,
      socialImprovement: optimizedSocialScore - originalSocialScore,
    });

    return new Response(
      JSON.stringify({
        success: true,
        optimization: {
          selectedItems: optimizedSelection.map(item => ({
            itemId: item.originalItemId || item.itemId,
            productId: item.productId,
            product: item.product,
            quantity: item.quantity,
            isAlternative: item.isAlternative,
          })),
          totalCost: optimizedTotal,
          savings,
          originalEcoScore,
          optimizedEcoScore,
          ecoImprovement: optimizedEcoScore - originalEcoScore,
          originalSocialScore,
          optimizedSocialScore,
          socialImprovement: optimizedSocialScore - originalSocialScore,
          budget,
          withinBudget: optimizedTotal <= budget,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in optimize-knapsack:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function solveMultiObjectiveKnapsack(
  items: KnapsackItem[],
  budget: number,
  weights: OptimizationWeights,
  originalItems: any[]
): KnapsackItem[] {
  // Group items by original item ID
  const itemGroups = new Map<string, KnapsackItem[]>();
  
  for (const item of items) {
    const key = item.originalItemId || item.itemId;
    if (!itemGroups.has(key)) {
      itemGroups.set(key, []);
    }
    itemGroups.get(key)!.push(item);
  }

  // For each group, select the best option based on multi-objective score
  const selectedItems: KnapsackItem[] = [];
  let currentCost = 0;

  for (const [groupKey, groupItems] of itemGroups) {
    // Calculate multi-objective score for each option
    const scoredItems = groupItems.map(item => {
      const normalizedPrice = 1 - (item.totalPrice / (budget || 1));
      const normalizedEco = item.totalEcoScore / (100 * item.quantity);
      const normalizedSocial = item.totalSocialScore / (100 * item.quantity);

      const score = 
        weights.price * normalizedPrice +
        weights.environmental * normalizedEco +
        weights.social * normalizedSocial;

      return { item, score };
    });

    // Sort by score descending
    scoredItems.sort((a, b) => b.score - a.score);

    // Select best option that fits budget
    let selected = false;
    for (const { item } of scoredItems) {
      if (currentCost + item.totalPrice <= budget) {
        selectedItems.push(item);
        currentCost += item.totalPrice;
        selected = true;
        break;
      }
    }

    // If nothing fits, use cheapest option
    if (!selected) {
      const cheapest = groupItems.reduce((min, item) => 
        item.totalPrice < min.totalPrice ? item : min
      );
      selectedItems.push(cheapest);
      currentCost += cheapest.totalPrice;
    }
  }

  return selectedItems;
}
