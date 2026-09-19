'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useGetExploreStoresQuery } from '@/lib/api';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/utils';
import { Crosshair } from 'lucide-react';

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

// Custom user location blue pulse icon
const createUserLocationIcon = () => {
  return L.divIcon({
    className: 'custom-user-icon',
    html: `
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 22px; height: 22px; background: rgba(37, 99, 235, 0.25); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 14px; height: 14px; background: #2563EB; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 2;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

// Compact dot icon for lower zoom
const createCompactDotIcon = () => {
  return L.divIcon({
    className: 'custom-dot-icon',
    html: `
      <div style="
        width: 14px;
        height: 14px;
        background: #FF5A36;
        border: 2.5px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(255, 90, 54, 0.5);
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

// Rich store logo + name pill icon for zoomed-in view
const createRichStoreIcon = (store: any) => {
  const logoUrl = store.image || store.logoUrl;
  const initial = store.name ? store.name.charAt(0).toUpperCase() : 'S';
  const ratingText = store.rating ? `★ ${Number(store.rating).toFixed(1)}` : '';

  const avatarHtml = logoUrl
    ? `<img src="${getMediaUrl(logoUrl)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.parentElement.innerHTML='<span style=\\'font-weight:bold;color:#FF5A36;font-size:12px;\\'>${initial}</span>'" />`
    : `<span style="font-weight: bold; color: #FF5A36; font-size: 12px;">${initial}</span>`;

  return L.divIcon({
    className: 'custom-rich-store-icon',
    html: `
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        background: white;
        border: 1.5px solid #E5E2DC;
        border-radius: 24px;
        padding: 3px 8px 3px 3px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.18);
        white-space: nowrap;
        transform: translate(-20px, -20px);
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #FF5A36;
          background: #FFF0EB;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        ">
          ${avatarHtml}
        </div>
        <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.15; padding-right: 2px;">
          <span style="font-size: 11px; font-weight: 800; color: #171717; max-width: 110px; overflow: hidden; text-overflow: ellipsis;">
            ${store.name || 'Store'}
          </span>
          ${ratingText ? `<span style="font-size: 9.5px; font-weight: 700; color: #D97706;">${ratingText}</span>` : `<span style="font-size: 9px; color: #888;">${store.category || 'Shop'}</span>`}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [15, -25]
  });
};

// Custom branded cluster icon
const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let size = 36;
  if (count > 9) size = 42;
  if (count > 49) size = 48;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: #FF5A36;
        color: white;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 14px rgba(255, 90, 54, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 12px;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        ${count}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

interface NearbyMapProps {
  center: [number, number];
  radiusKm: number; // 0 = unlimited
  onCenterChange?: (coords: [number, number]) => void;
}

function MapController({
  center,
  onZoomChange
}: {
  center: [number, number];
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number' && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, map.getZoom(), { animate: true, duration: 0.8 });
    }
  }, [center, map]);

  useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    }
  });

  return null;
}

export default function NearbyMap({
  center,
  radiusKm,
  onCenterChange
}: NearbyMapProps) {
  const [currentZoom, setCurrentZoom] = useState(14);
  const { data: stores = [] } = useGetExploreStoresQuery();

  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);

  // Filter valid coordinates
  const validStores = useMemo(() => {
    return stores.filter(
      (s: any) => typeof s.lat === 'number' && typeof s.lng === 'number' && !isNaN(s.lat) && !isNaN(s.lng)
    );
  }, [stores]);

  const isZoomedIn = currentZoom >= 15;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <MapController center={center} onZoomChange={handleZoomChange} />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location Marker */}
        <Marker position={center} icon={createUserLocationIcon()}>
          <Popup>
            <div className="text-xs font-bold text-gray-900">Your Current Location</div>
          </Popup>
        </Marker>

        {/* Radius Circle (Only rendered if radiusKm > 0) */}
        {radiusKm > 0 && (
          <Circle
            center={center}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#FF5A36',
              fillColor: '#FF5A36',
              fillOpacity: 0.06,
              weight: 1.5,
              dashArray: '4, 4'
            }}
          />
        )}

        {/* Smart Cluster Group */}
        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
          maxClusterRadius={40}
          iconCreateFunction={createClusterCustomIcon}
        >
          {validStores.map((store: any) => {
            const icon = isZoomedIn ? createRichStoreIcon(store) : createCompactDotIcon();

            return (
              <Marker
                key={store.id}
                position={[store.lat, store.lng]}
                icon={icon}
              >
                <Popup className="store-preview-popup">
                  <div className="p-1.5 min-w-[160px]">
                    <div className="font-bold text-xs text-gray-900 leading-tight">{store.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {store.category} {store.rating ? `• ★ ${Number(store.rating).toFixed(1)}` : ''}
                    </div>
                    {store.address && (
                      <div className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                        {store.address}
                      </div>
                    )}
                    <Link
                      href={`/store/${store.id}`}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#FF5A36] hover:underline"
                    >
                      Visit Store →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Floating Re-center Action Button */}
      {onCenterChange && (
        <button
          onClick={() => onCenterChange(center)}
          title="Re-center on my location"
          className="absolute top-16 right-4 z-[400] w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:text-[#FF5A36] active:scale-95 transition-all cursor-pointer"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
