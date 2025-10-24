import { useEffect } from 'react';
import { TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { MapPin, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import L from 'leaflet';

interface StoreData {
  id?: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  vendor_code: string;
  distance?: number;
}

interface StoreMapViewProps {
  userLocation: [number, number];
  searchRadius: number;
  stores: StoreData[];
  getVendorColor: (code: string) => string;
}

export function StoreMapView({ userLocation, searchRadius, stores, getVendorColor }: StoreMapViewProps) {
  const map = useMap();

  useEffect(() => {
    if (map && userLocation) {
      map.setView(userLocation, 13, { animate: true });
    }
  }, [map, userLocation]);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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

      {stores.map((store, index) => (
        <Marker
          key={`store-${store.lat}-${store.lon}-${index}`}
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
    </>
  );
}
