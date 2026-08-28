'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';

// Fix Leaflet's default icon path issues
const iconDefault = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = iconDefault;

// Custom user location icon
const createLocationIcon = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        width: 16px;
        height: 16px;
        background-color: #2563EB;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

// Custom Store Avatar icon
const createStoreIcon = (imageUrl: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        overflow: hidden;
        background-color: white;
      ">
        <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const STORES = [
  { id: 1, name: 'Urban Threads', lat: 28.6139, lng: 77.2090, image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=100' },
  { id: 2, name: 'Luxe Beauty', lat: 28.6150, lng: 77.2100, image: 'https://images.unsplash.com/photo-1571781537459-07446554b574?q=80&w=100' },
  { id: 3, name: 'Tech Hub', lat: 28.6120, lng: 77.2080, image: 'https://images.unsplash.com/photo-1531297172867-6cd692bc1ff4?q=80&w=100' },
  { id: 4, name: 'Streetwear Co', lat: 28.6160, lng: 77.2120, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=100' },
  { id: 5, name: 'Fresh Bites', lat: 28.6110, lng: 77.2050, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=100' },
];

export default function NearbyMap() {
  const DEFAULT_CENTER: [number, number] = [28.6139, 77.2090]; // Delhi fallback
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const radius = 2000; // 2km in meters

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting geolocation, using fallback:", error);
          // Fallback to profile location (using Delhi as default for now)
        }
      );
    }
  }, []);

  function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
      map.flyTo(center, 14, { animate: true });
    }, [center, map]);
    return null;
  }

  return (
    <MapContainer 
      center={center} 
      zoom={14} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <MapUpdater center={center} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      {/* User Location */}
      <Marker position={center} icon={createLocationIcon()}>
        <Popup>You are here</Popup>
      </Marker>
      
      {/* Radius Circle */}
      <Circle 
        center={center} 
        radius={radius} 
        pathOptions={{ color: '#FF5A36', fillColor: '#FF5A36', fillOpacity: 0.1, weight: 1 }} 
      />

      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        spiderfyOnMaxZoom={true}
        maxClusterRadius={40}
      >
        {STORES.map((store) => (
          <Marker 
            key={store.id} 
            position={[store.lat, store.lng]} 
            icon={createStoreIcon(store.image)}
          >
            <Popup className="store-popup">
               <div className="font-bold text-xs">{store.name}</div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
