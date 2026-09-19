'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, Search, Loader2, Check, Crosshair } from 'lucide-react';
import { toast } from 'sonner';
import { LocationService } from '@/lib/services/location.service';

interface StoreLocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  initialAddress?: string;
  onLocationSelect: (loc: {
    lat: number;
    lng: number;
    address: string;
    city?: string;
    state?: string;
  }) => void;
  className?: string;
}

// Leaflet inner map client-only component
const LeafletMapInner = dynamic(
  () => import('./StoreLocationPickerMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-2 border border-gray-200">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
        <span className="text-xs font-medium">Loading interactive location picker...</span>
      </div>
    ),
  }
);

export function StoreLocationPicker({
  initialLat,
  initialLng,
  initialAddress,
  onLocationSelect,
  className = '',
}: StoreLocationPickerProps) {
  // Fallback coordinates (Kathmandu: 27.7172, 85.3240 or Delhi: 28.6139, 77.2090)
  const [currentLat, setCurrentLat] = useState<number>(initialLat ?? 27.7172);
  const [currentLng, setCurrentLng] = useState<number>(initialLng ?? 85.3240);
  const [resolvedAddress, setResolvedAddress] = useState<string>(initialAddress || '');
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Sync when initialLat/Lng change
  useEffect(() => {
    if (typeof initialLat === 'number' && typeof initialLng === 'number' && !isNaN(initialLat) && !isNaN(initialLng)) {
      setCurrentLat(initialLat);
      setCurrentLng(initialLng);
    }
  }, [initialLat, initialLng]);

  useEffect(() => {
    if (initialAddress) {
      setResolvedAddress(initialAddress);
    }
  }, [initialAddress]);

  // Reverse geocode when pin moves
  const handlePinMoved = useCallback(async (lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    try {
      const osm = await LocationService.reverseGeocodeOSM(lat, lng);
      const addr = osm.formattedAddress || [osm.city, osm.state, osm.country].filter(Boolean).join(', ');
      setResolvedAddress(addr);
      onLocationSelect({
        lat,
        lng,
        address: addr,
        city: osm.city,
        state: osm.state,
      });
    } catch (err) {
      onLocationSelect({
        lat,
        lng,
        address: resolvedAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      });
    }
  }, [onLocationSelect, resolvedAddress]);

  // 1-Click "Use My Current GPS" action
  const handleUseCurrentLocation = async () => {
    setIsDetectingGps(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCurrentLat(lat);
      setCurrentLng(lng);
      await handlePinMoved(lat, lng);
      toast.success('Store pin centered on your device location!');
    } catch (err: any) {
      console.warn('GPS detection failed:', err);
      toast.error('Could not detect live GPS. You can search your area or drag the pin.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Search area / market via Nominatim
  const handleSearchLocality = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&limit=5&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'LokayaStorePicker/1.0' },
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data || []);
      setShowResults(true);
      if (!data || data.length === 0) {
        toast.info('No locations found. Try searching for a nearby market, district, or road.');
      }
    } catch (err) {
      console.warn('Locality search error:', err);
      toast.error('Unable to search locality. Please drag the pin on the map.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      setCurrentLat(lat);
      setCurrentLng(lng);
      setShowResults(false);
      setSearchQuery(result.display_name?.split(',')[0] || searchQuery);
      handlePinMoved(lat, lng);
      toast.success(`Centered on ${result.display_name?.split(',')[0]}`);
    }
  };

  return (
    <div className={`flex flex-col space-y-3 bg-white border border-[#E5E2DC] rounded-2xl p-4 shadow-sm ${className}`}>
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <label className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#FF5A36]" />
            Pinpoint Storefront on Map
          </label>
          <p className="text-[11px] text-[#6B6B6B]">
            Drag the pin directly onto your shop entrance so nearby customers can discover you accurately.
          </p>
        </div>

        {/* 1-Click GPS Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isDetectingGps}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-[#FF5A36] hover:bg-orange-100 border border-orange-200 text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {isDetectingGps ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Crosshair className="w-3.5 h-3.5" />
          )}
          <span>{isDetectingGps ? 'Locating...' : 'Use My Current Location'}</span>
        </button>
      </div>

      {/* Locality Search Input */}
      <div className="relative">
        <form onSubmit={handleSearchLocality} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search market, road, or area (e.g. Albando, Main Market)..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#171717] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/30 focus:border-[#FF5A36]"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-3 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors disabled:opacity-40 cursor-pointer"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-56 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full px-3 py-2.5 text-left text-xs text-gray-700 hover:bg-orange-50/70 border-b border-gray-100 last:border-0 flex items-start gap-2 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#FF5A36] shrink-0 mt-0.5" />
                <span className="line-clamp-2">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
        <LeafletMapInner
          centerLat={currentLat}
          centerLng={currentLng}
          onPinMoved={handlePinMoved}
        />
        
        {/* Helper Badge overlay */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm text-[10px] font-mono text-gray-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{currentLat.toFixed(5)}°, {currentLng.toFixed(5)}°</span>
        </div>
      </div>

      {/* Selected Address Preview */}
      {resolvedAddress && (
        <div className="flex items-start gap-2 bg-[#FAF9F6] border border-[#E5E2DC] rounded-xl p-2.5 text-xs text-gray-700">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-gray-900">Pinpoint Location: </span>
            <span className="text-gray-600">{resolvedAddress}</span>
          </div>
        </div>
      )}
    </div>
  );
}
