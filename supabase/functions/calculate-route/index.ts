import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fromLat, fromLon, toLat, toLon } = await req.json();

    console.log(`Calculating route from [${fromLat}, ${fromLon}] to [${toLat}, ${toLon}]`);

    // Validate input
    if (!fromLat || !fromLon || !toLat || !toLon) {
      throw new Error('Missing required coordinates');
    }

    // Call OSRM API for routing
    const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;
    
    console.log('Calling OSRM API:', osrmUrl);

    const response = await fetch(osrmUrl);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.statusText}`);
    }

    const routeData = await response.json();

    if (routeData.code !== 'Ok' || !routeData.routes || routeData.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = routeData.routes[0];
    
    // Extract route information
    const result = {
      distance: route.distance, // meters
      duration: route.duration, // seconds
      geometry: route.geometry, // GeoJSON LineString
      polyline: route.geometry.coordinates, // Array of [lon, lat] points
    };

    console.log(`Route calculated: ${(result.distance / 1000).toFixed(1)}km, ${(result.duration / 60).toFixed(0)}min`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Failed to calculate route'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
