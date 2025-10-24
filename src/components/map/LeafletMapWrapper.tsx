import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapWrapperProps {
  center: [number, number];
  zoom: number;
  className?: string;
}

export interface LeafletMapHandle {
  addMarker: (lat: number, lon: number, options?: L.MarkerOptions) => L.Marker;
  addCircle: (lat: number, lon: number, radius: number, options?: L.CircleMarkerOptions) => L.Circle;
  clearLayers: () => void;
  setView: (center: [number, number], zoom: number) => void;
  getMap: () => L.Map | null;
}

export const LeafletMapWrapper = forwardRef<LeafletMapHandle, LeafletMapWrapperProps>(
  ({ center, zoom, className = '' }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const layersRef = useRef<L.Layer[]>([]);

    useEffect(() => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Create map instance
      const map = L.map(mapRef.current, {
        center,
        zoom,
        scrollWheelZoom: true,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Cleanup on unmount
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, []);

    // Update map view when center or zoom changes
    useEffect(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(center, zoom);
      }
    }, [center, zoom]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      addMarker: (lat: number, lon: number, options?: L.MarkerOptions) => {
        const marker = L.marker([lat, lon], options);
        if (mapInstanceRef.current) {
          marker.addTo(mapInstanceRef.current);
          layersRef.current.push(marker);
        }
        return marker;
      },
      addCircle: (lat: number, lon: number, radius: number, options?: L.CircleMarkerOptions) => {
        const circle = L.circle([lat, lon], { radius, ...options });
        if (mapInstanceRef.current) {
          circle.addTo(mapInstanceRef.current);
          layersRef.current.push(circle);
        }
        return circle;
      },
      clearLayers: () => {
        layersRef.current.forEach((layer) => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(layer);
          }
        });
        layersRef.current = [];
      },
      setView: (newCenter: [number, number], newZoom: number) => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(newCenter, newZoom);
        }
      },
      getMap: () => mapInstanceRef.current,
    }));

    return <div ref={mapRef} className={className} style={{ height: '100%', width: '100%' }} />;
  }
);

LeafletMapWrapper.displayName = 'LeafletMapWrapper';
