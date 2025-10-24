import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Store, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface StoreData {
  id?: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  vendor_code: string;
  distance?: number;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export const StoreMap = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchRadius, setSearchRadius] = useState(5000); // 5km default
  const [isLocating, setIsLocating] = useState(false);

  // Get user's current location
  const getUserLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setUserLocation(location);
          setIsLocating(false);
          toast.success('Ubicación detectada');
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Santiago, Chile
          setUserLocation([-33.4489, -70.6693]);
          setIsLocating(false);
          toast.error('No se pudo detectar tu ubicación. Mostrando Santiago, Chile.');
        }
      );
    } else {
      setUserLocation([-33.4489, -70.6693]);
      setIsLocating(false);
      toast.error('Geolocalización no disponible');
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  // Fetch nearby stores from API
  const { data: nearbyStores, isLoading: isLoadingStores, refetch } = useQuery({
    queryKey: ['nearby-stores', userLocation, searchRadius],
    queryFn: async () => {
      if (!userLocation) return [];

      const { data, error } = await supabase.functions.invoke('geocode-stores', {
        body: {
          lat: userLocation[0],
          lon: userLocation[1],
          radius: searchRadius,
          saveToDb: false,
        },
      });

      if (error) throw error;
      return data.stores || [];
    },
    enabled: !!userLocation,
  });

  // Also fetch stores from database
  const { data: dbStores } = useQuery({
    queryKey: ['db-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  // Combine stores from both sources
  const allStores = [...(nearbyStores || []), ...(dbStores || [])];
  const uniqueStores = allStores.filter((store, index, self) =>
    index === self.findIndex((s) => s.lat === store.lat && s.lon === store.lon)
  );

  const getVendorColor = (vendorCode: string) => {
    const colors: Record<string, string> = {
      JUMBO: '#00a650',
      LIDER: '#e30613',
      UNIMARC: '#0066cc',
      SANTAISABEL: '#ff6600',
      TOTTUS: '#ed1c24',
      OTHER: '#6b7280',
    };
    return colors[vendorCode] || colors.OTHER;
  };

  if (!userLocation) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Detectando ubicación...</h2>
          <p className="text-muted-foreground">
            Por favor permite el acceso a tu ubicación para ver tiendas cercanas
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-foreground mb-2">Mapa de Tiendas</h1>
        <p className="text-muted-foreground">
          Encuentra supermercados y tiendas cercanas para comprar tus productos sostenibles
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden h-[600px]">
            <MapContainer
              center={userLocation}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapUpdater center={userLocation} />

              <Marker position={userLocation}>
                <Popup>
                  <div className="text-center">
                    <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="font-semibold">Tu ubicación</p>
                  </div>
                </Popup>
              </Marker>

              <Circle
                center={userLocation}
                radius={searchRadius}
                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
              />

              {uniqueStores.map((store, index) => (
                <Marker
                  key={`${store.lat}-${store.lon}-${index}`}
                  position={[store.lat, store.lon]}
                  icon={L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background-color: ${getVendorColor(store.vendor_code)}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                  })}
                >
                  <Popup>
                    <div className="text-center min-w-[200px]">
                      <Store className="h-6 w-6 mx-auto mb-2" style={{ color: getVendorColor(store.vendor_code) }} />
                      <p className="font-semibold text-base mb-1">{store.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{store.address}</p>
                      <Badge style={{ backgroundColor: getVendorColor(store.vendor_code) }}>
                        {store.vendor_code}
                      </Badge>
                      {store.distance && (
                        <p className="text-xs mt-2">
                          {(store.distance / 1000).toFixed(1)} km de distancia
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </Card>
        </div>

        {/* Sidebar with controls and store list */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Controles de Búsqueda</h3>
            
            <Button
              onClick={getUserLocation}
              disabled={isLocating}
              className="w-full mb-4 gap-2"
            >
              {isLocating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Detectando...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  Mi Ubicación
                </>
              )}
            </Button>

            <div className="space-y-2">
              <label className="text-sm font-medium">Radio de Búsqueda (km)</label>
              <Input
                type="number"
                value={searchRadius / 1000}
                onChange={(e) => setSearchRadius(Number(e.target.value) * 1000)}
                min={1}
                max={50}
              />
            </div>

            <Button
              onClick={() => refetch()}
              disabled={isLoadingStores}
              variant="outline"
              className="w-full mt-4 gap-2"
            >
              {isLoadingStores ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Store className="h-4 w-4" />
                  Buscar Tiendas
                </>
              )}
            </Button>
          </Card>

          <Card className="p-4 max-h-[450px] overflow-y-auto">
            <h3 className="font-semibold mb-4">
              Tiendas Encontradas ({uniqueStores.length})
            </h3>
            
            {uniqueStores.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No se encontraron tiendas en esta área
              </p>
            ) : (
              <div className="space-y-3">
                {uniqueStores
                  .sort((a, b) => (a.distance || 0) - (b.distance || 0))
                  .map((store, index) => (
                    <div
                      key={`${store.lat}-${store.lon}-${index}`}
                      className="p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-sm">{store.name}</p>
                        <Badge
                          style={{
                            backgroundColor: getVendorColor(store.vendor_code),
                            fontSize: '10px',
                          }}
                        >
                          {store.vendor_code}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {store.address}
                      </p>
                      {store.distance && (
                        <p className="text-xs font-medium text-primary">
                          📍 {(store.distance / 1000).toFixed(1)} km
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
