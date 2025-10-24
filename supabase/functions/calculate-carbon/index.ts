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

    const { productId, category, weight_kg = 1 } = await req.json();

    if (!productId) {
      throw new Error('Product ID is required');
    }

    console.log('Calculating carbon footprint for product:', productId);

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) throw productError;

    // Carbon emission factors by category (kg CO2e per kg of product)
    // Based on industry averages and research data
    const emissionFactors: Record<string, number> = {
      'Alimentos': 2.5,
      'Cuidado Personal': 3.2,
      'Limpieza': 2.8,
      'Papeles': 1.8,
      'Infantil y bebé': 3.5,
      'Cuidado adulto': 3.0,
      'Hogar': 4.2,
      'default': 2.5,
    };

    // Get base emission factor
    let carbonFootprint = emissionFactors[product.category] || emissionFactors['default'];
    carbonFootprint *= weight_kg;

    // Apply modifiers based on sustainability attributes
    const productInfo = product.product_info || {};
    
    // Organic products have 15% lower footprint
    if (productInfo.organic) {
      carbonFootprint *= 0.85;
      console.log('Applied organic reduction: -15%');
    }

    // Recyclable packaging reduces footprint by 10%
    if (productInfo.package_recyclable) {
      carbonFootprint *= 0.90;
      console.log('Applied recyclable packaging reduction: -10%');
    }

    // Biodegradable reduces by 20%
    if (productInfo.biodegradable) {
      carbonFootprint *= 0.80;
      console.log('Applied biodegradable reduction: -20%');
    }

    // Local production (Chilean origin) reduces by 25% (less transport)
    if (productInfo.certifications?.includes('origen-chile') || 
        productInfo.certifications?.includes('made-in-chile')) {
      carbonFootprint *= 0.75;
      console.log('Applied local production reduction: -25%');
    }

    // Plastic packaging increases by 15%
    if (productInfo.package_type?.includes('plastic') || 
        productInfo.package_type?.includes('plastico')) {
      carbonFootprint *= 1.15;
      console.log('Applied plastic packaging increase: +15%');
    }

    // Round to 2 decimal places
    carbonFootprint = Math.round(carbonFootprint * 100) / 100;

    console.log('Final carbon footprint:', carbonFootprint, 'kg CO2e');

    // Update product with calculated carbon footprint
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        carbon_gco2e: carbonFootprint * 1000, // Convert to grams
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (updateError) {
      console.error('Error updating product:', updateError);
    } else {
      console.log('Product updated with carbon footprint');
    }

    return new Response(
      JSON.stringify({
        success: true,
        productId,
        carbonFootprint_kgCO2e: carbonFootprint,
        carbonFootprint_gCO2e: carbonFootprint * 1000,
        category: product.category,
        modifiers: {
          organic: productInfo.organic || false,
          recyclable: productInfo.package_recyclable || false,
          biodegradable: productInfo.biodegradable || false,
          local: productInfo.certifications?.some((c: string) => 
            c.includes('chile') || c.includes('Chile')
          ) || false,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in calculate-carbon:', error);
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
