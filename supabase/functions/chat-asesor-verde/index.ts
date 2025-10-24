import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

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
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    // Crear cliente de Supabase para acceder a productos
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener información del último mensaje del usuario para contexto
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    
    // Buscar productos relevantes según el mensaje del usuario
    let productContext = "";
    
    // Palabras clave para búsqueda
    const searchTerms = lastUserMessage.toLowerCase();
    
    if (searchTerms.includes("producto") || searchTerms.includes("recomendar") || 
        searchTerms.includes("busco") || searchTerms.includes("alternativa") ||
        searchTerms.includes("shampoo") || searchTerms.includes("detergente") ||
        searchTerms.includes("limpieza") || searchTerms.includes("jabón") ||
        searchTerms.includes("cloro") || searchTerms.includes("baño")) {
      
      // Buscar productos en la base de datos
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, brand, category, eco_score, social_score, product_info, labels, last_seen_price_clp, last_vendor')
        .order('eco_score', { ascending: false })
        .limit(10);

      if (products && products.length > 0) {
        productContext = `\n\nPRODUCTOS DISPONIBLES EN EL CATÁLOGO:\n${products.map(p => 
          `- ${p.name} (${p.brand}) - Categoría: ${p.category}, Puntuación Eco: ${p.eco_score}/100, Precio: $${p.last_seen_price_clp} CLP, Etiquetas: ${Array.isArray(p.labels) ? p.labels.join(', ') : 'N/A'}`
        ).join('\n')}`;
      }
    }

    const systemPrompt = `Eres el "Asesor Verde" de LiquiVerde 🌿, un asistente de compras sostenible, amigable y educativo.

TU MISIÓN:
- Ayudar a los usuarios a tomar decisiones de compra más sostenibles, económicas y saludables
- Recomendar productos del catálogo basándote en criterios ecológicos y sociales
- Explicar el significado de etiquetas y certificaciones (biodegradable, cruelty-free, vegano, etc.)
- Comparar alternativas y sugerir mejores opciones
- Educar sobre impacto ambiental, reciclaje y consumo responsable

TU TONO:
- Cercano, optimista y educativo
- Usa emojis verdes ocasionalmente: 🌿💚🌱♻️💧🌍
- Sé conciso pero informativo
- Celebra las decisiones sostenibles del usuario

FORMATO DE RESPUESTAS:
- Cuando recomiendes productos específicos, menciona: nombre, marca, puntuación ecológica y precio
- Si sugieres un producto, al final pregunta: "¿Quieres que lo agregue a tu lista?"
- Si no encuentras un producto exacto, sugiere alternativas del catálogo
- Para preguntas generales sobre sostenibilidad, responde con información útil y práctica

IMPORTANTE:
- SIEMPRE basa tus recomendaciones en los productos del catálogo disponible
- Prioriza productos con mayor puntuación ecológica (eco_score) y social (social_score)
- Menciona etiquetas relevantes como "biodegradable", "reciclable", "vegano", "cruelty-free"
- Si el usuario menciona "sin cloro", "sin parabenos", "sin sulfatos", busca en product_info${productContext}`;

    console.log('Enviando request a Lovable AI...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Límite de solicitudes excedido. Por favor, intenta de nuevo en un momento." 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Se requiere pago. Por favor, añade créditos a tu cuenta de Lovable AI." 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('Error de Lovable AI:', response.status, errorText);
      return new Response(JSON.stringify({ error: "Error en el servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Streaming respuesta...');
    
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error en chat-asesor-verde:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Error desconocido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
