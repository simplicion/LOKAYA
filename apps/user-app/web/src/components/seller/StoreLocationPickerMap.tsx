'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Custom Draggable Store Pin Icon
const createDraggableStoreIcon = () => {
  return L.divIcon({
    className: 'custom-store-pin-icon',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
      ">
        <div style="
          width: 38px;
          height: 38px;
          background: #FF5A36;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 14px rgba(255, 90, 54, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
            <path d="M2 7h20"/>
          </svg>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #FF5A36;
          margin-top: -1px;
        "></div>
        <div style="
          width: 10px;
          height: 4px;
          background: rgba(0,0,0,0.25);
          border-radius: 50%;
          margin-top: 2px;
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

interface StoreLocationPickerMapProps {
  centerLat: number;
  centerLng: number;
  onPinMoved: (lat: number, lng: number) => void;
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], 16, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({ onPinMoved }: { onPinMoved: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (e?.latlng && !isNaN(e.latlng.lat) && !isNaN(e.latlng.lng)) {
        onPinMoved(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function StoreLocationPickerMap({
  centerLat,
  centerLng,
  onPinMoved,
}: StoreLocationPickerMapProps) {
  const safeLat = (typeof centerLat === 'number' && !isNaN(centerLat)) ? centerLat : 27.7172;
  const safeLng = (typeof centerLng === 'number' && !isNaN(centerLng)) ? centerLng : 85.3240;

  const customIcon = useMemo(() => createDraggableStoreIcon(), []);

  const eventHandlers = useMemo(
    () => ({
      dragend(e: any) {
        const marker = e.target;
        if (marker) {
          const { lat, lng } = marker.getLatLng();
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            onPinMoved(lat, lng);
          }
        }
      },
    }),
    [onPinMoved]
  );

  return (
    <MapContainer
      center={[safeLat, safeLng]}
      zoom={16}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
      className="isolate z-0"
    >
      <MapUpdater lat={safeLat} lng={safeLng} />
      <MapClickHandler onPinMoved={onPinMoved} />
      
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={[safeLat, safeLng]}
        icon={customIcon}
      />
    </MapContainer>
  );
}
