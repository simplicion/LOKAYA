'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const storeIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'store-marker-icon'
});

interface Store {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

interface MapProps {
  userLocation: { lat: number; lng: number } | null;
  nearbyStores: Store[];
  className?: string;
}

export default function LocationMap({ userLocation, nearbyStores, className }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Dynamic import for styles if needed, but imported at top
  }, []);

  if (!mounted) {
    return <div className={`${className || 'h-[250px] w-full rounded-2xl'} bg-gray-100 animate-pulse flex items-center justify-center text-gray-400`}>Loading Map...</div>;
  }

  // Default to a central location if none provided (e.g., India center)
  const defaultCenter = { lat: 20.5937, lng: 78.9629 };
  const center = userLocation || defaultCenter;

  return (
    <div className={`${className || 'h-[250px] w-full rounded-2xl border border-gray-200'} overflow-hidden z-0 relative`}>
      {/* global style override for the store marker if you want a different color, you could use a custom icon image, but this is okay for mock */}
      <style jsx global>{`
        .store-marker-icon { filter: hue-rotate(150deg); } /* Make store markers a different color */
      `}</style>

      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={userLocation ? 14 : 5} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={customIcon}>
              <Popup>You are here</Popup>
            </Marker>
            <Circle 
              center={[userLocation.lat, userLocation.lng]} 
              radius={2000} // 2km radius
              pathOptions={{ fillColor: '#4f46e5', color: '#4f46e5', weight: 1, fillOpacity: 0.1 }}
            />
          </>
        )}

        {nearbyStores.map(store => {
          if (store.latitude && store.longitude) {
            return (
              <Marker 
                key={store.id} 
                position={[store.latitude, store.longitude]} 
                icon={storeIcon}
              >
                <Popup>
                  <strong>{store.name}</strong><br/>
                  {store.address || 'Nearby Store'}
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
}
