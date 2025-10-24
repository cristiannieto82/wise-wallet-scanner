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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Inicializar cliente Supabase para acceder a productos
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener productos del catálogo (limitado a 50 para contexto)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('name, brand, category, eco_score, social_score, product_info, labels, last_seen_price_clp')
      .limit(50);

    if (productsError) {
      console.error('Error fetching products:', productsError);
    }

    // Crear contexto con información de productos
    const productContext = products ? `
Catálogo de productos disponibles (muestra):
${products.map(p => `
- ${p.name} (${p.brand})
  Categoría: ${p.category}
  Puntuación Ecológica: ${p.eco_score}/100
  Puntuación Social: ${p.social_score}/100
  Precio: $${p.last_seen_price_clp} CLP
  Características: ${p.product_info ? JSON.stringify(p.product_info) : 'N/A'}
  Etiquetas: ${p.labels?.join(', ') || 'N/A'}
`).join('\n')}
` : '';

    const systemPrompt = `Eres el "Asesor Verde" de LiquiVerde 🌿, una plataforma chilena de compras sostenibles.

Tu misión es ayudar a usuarios a tomar decisiones de compra más conscientes, económicas y ecológicas.

PERSONALIDAD Y TONO:
- Amigable, empático y optimista
- Educativo pero nunca condescendiente
- Usa emojis verdes con moderación (🌿💚🌱♻️💧)
- Celebra las decisiones sostenibles del usuario
- Habla en español chileno natural

CAPACIDADES:
1. Recomendar productos del catálogo según criterios de sostenibilidad
2. Comparar alternativas considerando precio, impacto ambiental y ético
3. Explicar etiquetas y certificaciones (biodegradable, cruelty-free, vegano, etc.)
4. Sugerir sustitutos más sostenibles
5. Educar sobre impacto ambiental de productos

INFORMACIÓN DEL CATÁLOGO:
${productContext}

CRITERIOS DE RECOMENDACIÓN:
- Eco Score > 70: Excelente opción ambiental
- Eco Score 50-70: Opción moderada
- Social Score > 70: Ética y certificaciones sólidas
- Etiquetas importantes: biodegradable, chlorine_free, paraben_free, vegan, cruelty_free, phosphate_free

FORMATO DE RESPUESTA:
- Sé conciso pero informativo
- Menciona 2-3 productos específicos cuando sea relevante
- Incluye precios en CLP cuando compares
- Explica POR QUÉ recomiendas algo (eco_score, ingredientes, certificaciones)
- Si no hay productos exactos, sugiere alternativas cercanas

MENSAJE DE BIENVENIDA (solo al inicio):
"¡Hola! Soy tu Asesor Verde 🌿. Puedo ayudarte a comparar productos, optimizar tu lista o explicarte el impacto ecológico de tus compras. ¿Qué te gustaría saber hoy?"

REGLAS:
- NO inventes productos que no están en el catálogo
- Si no encuentras algo exacto, dilo honestamente y sugiere alternativas
- Prioriza siempre sostenibilidad + precio justo
- Educa sobre el "por qué" detrás de cada recomendación`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de uso excedido. Intenta nuevamente en un momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Por favor contacta al administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Error en el servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
