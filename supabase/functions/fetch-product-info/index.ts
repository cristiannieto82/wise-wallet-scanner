import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { barcode } = await req.json();

    if (!barcode) {
      throw new Error('Barcode is required');
    }

    console.log('Fetching product info from Open Food Facts for barcode:', barcode);

    // Fetch from Open Food Facts API
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    
    if (!response.ok) {
      throw new Error('Product not found in Open Food Facts');
    }

    const data = await response.json();

    if (data.status === 0) {
      return new Response(
        JSON.stringify({ 
          found: false,
          message: 'Product not found in Open Food Facts database'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const product = data.product;

    // Map Open Food Facts data to our product structure
    const productInfo = {
      name: product.product_name || product.product_name_es || 'Unknown',
      brand: product.brands || 'Unknown',
      category: product.categories_tags?.[0]?.replace('en:', '') || 'Alimentos',
      image_url: product.image_url || product.image_front_url,
      product_info: {
        package_type: product.packaging_materials_tags?.[0] || undefined,
        package_recyclable: product.recycling_instructions_to_recycle_tags?.length > 0,
        biodegradable: product.ingredients_analysis_tags?.includes('en:vegan'),
        vegan: product.ingredients_analysis_tags?.includes('en:vegan'),
        organic: product.labels_tags?.includes('en:organic') || product.labels_tags?.includes('en:eu-organic'),
        certifications: product.labels_tags?.map((tag: string) => tag.replace('en:', '')) || [],
      },
      eco_score: calculateEcoScore(product),
      social_score: calculateSocialScore(product),
      nutriscore: product.nutriscore_grade?.toUpperCase(),
      ecoscore_grade: product.ecoscore_grade?.toUpperCase(),
    };

    // Check if product already exists in our database
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('barcode', barcode)
      .single();

    if (existingProduct) {
      // Update existing product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: productInfo.name,
          brand: productInfo.brand,
          category: productInfo.category,
          image_url: productInfo.image_url,
          product_info: productInfo.product_info,
          eco_score: productInfo.eco_score,
          social_score: productInfo.social_score,
          updated_at: new Date().toISOString(),
        })
        .eq('barcode', barcode);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ 
          found: true,
          updated: true,
          product: productInfo,
          productId: existingProduct.id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Create new product
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          barcode,
          name: productInfo.name,
          brand: productInfo.brand,
          category: productInfo.category,
          image_url: productInfo.image_url,
          product_info: productInfo.product_info,
          eco_score: productInfo.eco_score,
          social_score: productInfo.social_score,
          last_seen_price_clp: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ 
          found: true,
          created: true,
          product: productInfo,
          productId: newProduct.id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error in fetch-product-info:', error);
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

function calculateEcoScore(product: any): number {
  let score = 50; // Base score

  // Packaging
  if (product.packaging_materials_tags?.includes('cardboard')) score += 10;
  if (product.packaging_materials_tags?.includes('glass')) score += 8;
  if (product.packaging_materials_tags?.includes('plastic')) score -= 15;
  
  // Organic/Bio
  if (product.labels_tags?.includes('en:organic')) score += 15;
  if (product.labels_tags?.includes('en:eu-organic')) score += 15;
  
  // Ecoscore from Open Food Facts
  if (product.ecoscore_grade) {
    const ecoscoreMap: Record<string, number> = { a: 20, b: 10, c: 0, d: -10, e: -20 };
    score += ecoscoreMap[product.ecoscore_grade.toLowerCase()] || 0;
  }

  // Carbon footprint
  if (product.ecoscore_data?.adjustments?.production_system?.value) {
    score += product.ecoscore_data.adjustments.production_system.value;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateSocialScore(product: any): number {
  let score = 50; // Base score

  // Fair Trade
  if (product.labels_tags?.includes('en:fair-trade')) score += 20;
  
  // Local production
  if (product.origins_tags?.includes('en:chile')) score += 15;
  
  // Certifications
  if (product.labels_tags?.includes('en:rainforest-alliance')) score += 10;
  if (product.labels_tags?.includes('en:utz-certified')) score += 10;
  if (product.labels_tags?.includes('en:b-corporation')) score += 15;
  
  // Vegan/Cruelty-free
  if (product.labels_tags?.includes('en:vegan')) score += 10;
  if (product.labels_tags?.includes('en:cruelty-free')) score += 10;

  return Math.max(0, Math.min(100, score));
}
