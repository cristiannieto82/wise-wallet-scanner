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

    const body = await req.json();
    const { lat, lon, radius = 5000, saveToDb = false } = body;

    if (!lat || !lon) {
      throw new Error('Latitude and longitude are required');
    }

    console.log('Searching for stores near:', lat, lon, 'radius:', radius);

    // Search for supermarkets using OpenStreetMap Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
      `format=json&` +
      `q=supermarket&` +
      `lat=${lat}&` +
      `lon=${lon}&` +
      `addressdetails=1&` +
      `limit=20`;

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'LiquiVerde-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Nominatim');
    }

    const places = await response.json();

    // Filter by radius and map to our store structure
    const stores = places
      .filter((place: any) => {
        const distance = calculateDistance(
          lat,
          lon,
          parseFloat(place.lat),
          parseFloat(place.lon)
        );
        return distance <= radius;
      })
      .map((place: any) => {
        // Determine vendor code based on place name
        const name = place.name || place.display_name;
        let vendorCode = 'OTHER';
        
        if (name.toLowerCase().includes('jumbo')) vendorCode = 'JUMBO';
        else if (name.toLowerCase().includes('lider')) vendorCode = 'LIDER';
        else if (name.toLowerCase().includes('unimarc')) vendorCode = 'UNIMARC';
        else if (name.toLowerCase().includes('santa isabel')) vendorCode = 'SANTAISABEL';
        else if (name.toLowerCase().includes('tottus')) vendorCode = 'TOTTUS';

        return {
          name: place.name || place.display_name.split(',')[0],
          address: place.display_name,
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon),
          vendor_code: vendorCode,
          osm_id: place.osm_id,
          distance: calculateDistance(lat, lon, parseFloat(place.lat), parseFloat(place.lon)),
        };
      })
      .sort((a: any, b: any) => a.distance - b.distance);

    // Optionally save to database
    if (saveToDb) {
      for (const store of stores) {
        // Check if store already exists
        const { data: existing } = await supabase
          .from('stores')
          .select('id')
          .eq('vendor_code', store.vendor_code)
          .eq('lat', store.lat)
          .eq('lon', store.lon)
          .single();

        if (!existing) {
          await supabase
            .from('stores')
            .insert({
              name: store.name,
              address: store.address,
              lat: store.lat,
              lon: store.lon,
              vendor_code: store.vendor_code,
            });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        stores,
        count: stores.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in geocode-stores:', error);
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

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}
