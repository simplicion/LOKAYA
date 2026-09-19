'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, MapPin, ChevronRight, Check, Sparkles, Navigation, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useGetAddressesQuery } from '@/lib/api';
import { NearbyBottomSheet } from '@/components/explore/NearbyBottomSheet';

const NearbyMap = dynamic(() => import('@/components/ui/NearbyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center animate-pulse text-gray-400 gap-2">
      <span className="w-8 h-8 rounded-full border-2 border-[#FF5A36] border-t-transparent animate-spin" />
      <span className="text-xs font-medium text-gray-500">Loading nearby map...</span>
    </div>
  ),
});

const RADIUS_OPTIONS = [
  { value: 2, label: '2 km', desc: 'Local neighborhood' },
  { value: 5, label: '5 km', desc: 'Central market area' },
  { value: 10, label: '10 km', desc: 'Wider district' },
  { value: 25, label: '25 km', desc: 'Extended region' },
  { value: 0, label: 'All Stores', desc: 'No distance limit' },
];

export default function StoresNearbyPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: addresses = [] } = useGetAddressesQuery(undefined, { skip: !user });

  // Default regional center (Kathmandu or Delhi)
  const DEFAULT_COORDS: [number, number] = [27.7172, 85.3240];

  const [userCoords, setUserCoords] = useState<[number, number]>(DEFAULT_COORDS);
  const [locationSource, setLocationSource] = useState<'gps' | 'profile' | 'default'>('default');
  const [locationStatus, setLocationStatus] = useState<'checking' | 'granted' | 'denied' | 'prompt'>('checking');
  const [radiusKm, setRadiusKm] = useState<number>(2);
  const [isRadiusModalOpen, setIsRadiusModalOpen] = useState<boolean>(false);

  // Fallback to user profile coordinates or saved primary address
  const applyProfileFallback = useCallback(() => {
    const anyUser = user as any;
    if (anyUser?.latitude && anyUser?.longitude && !isNaN(anyUser.latitude) && !isNaN(anyUser.longitude)) {
      setUserCoords([anyUser.latitude, anyUser.longitude]);
      setLocationSource('profile');
      return true;
    }

    const primaryAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
    if (primaryAddr?.latitude && primaryAddr?.longitude) {
      setUserCoords([primaryAddr.latitude, primaryAddr.longitude]);
      setLocationSource('profile');
      return true;
    }

    setLocationSource('default');
    return false;
  }, [user, addresses]);

  // Request browser GPS location
  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('denied');
      applyProfileFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords([position.coords.latitude, position.coords.longitude]);
        setLocationStatus('granted');
        setLocationSource('gps');
      },
      (error) => {
        console.warn('Live GPS denied or failed, falling back to profile location:', error);
        setLocationStatus('denied');
        applyProfileFallback();
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      }
    );
  }, [applyProfileFallback]);

  // Initialize permission check on mount
  useEffect(() => {
    if ('geolocation' in navigator && navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            setLocationStatus('granted');
            requestLocation();
          } else if (result.state === 'prompt') {
            setLocationStatus('prompt');
          } else {
            setLocationStatus('denied');
            applyProfileFallback();
          }
        })
        .catch(() => {
          requestLocation();
        });
    } else {
      requestLocation();
    }
  }, [requestLocation, applyProfileFallback]);

  return (
    <div className="h-[100dvh] w-full bg-[#FAF9F6] overflow-hidden relative">
      <div className="absolute inset-0 z-10 bg-gray-100">
        
        {/* Map Header */}
        <div className="absolute top-4 inset-x-4 z-[500] flex items-center justify-between pointer-events-none">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-md flex items-center justify-center text-gray-800 pointer-events-auto hover:bg-white active:scale-95 transition-all cursor-pointer border border-gray-100"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Title & Source Indicator */}
          <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-md pointer-events-auto flex items-center gap-2 border border-gray-100">
            <h1 className="font-bold text-gray-900 text-xs sm:text-sm">Nearby Stores</h1>
            <div className="w-px h-3.5 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  locationSource === 'gps'
                    ? 'bg-emerald-500 animate-pulse'
                    : locationSource === 'profile'
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
              />
              <span className="text-gray-600">
                {locationSource === 'gps' ? 'Live GPS' : locationSource === 'profile' ? 'Profile' : 'Regional'}
              </span>
            </div>
          </div>

          <div className="w-10 h-10 pointer-events-none" />
        </div>

        {/* The Live Interactive Map with Clustering & Adaptive Markers */}
        <NearbyMap
          center={userCoords}
          radiusKm={radiusKm}
          onCenterChange={(coords) => setUserCoords(coords)}
        />

        {/* Dynamic Radius Info & Change Pill */}
        <div className="absolute bottom-[27%] inset-x-0 flex justify-center z-[400] pointer-events-none transition-all duration-300">
          <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-gray-200 flex items-center gap-2 pointer-events-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            <span className="text-xs font-medium text-gray-700">
              Showing within{' '}
              <span className="text-[#FF5A36] font-bold">
                {radiusKm > 0 ? `${radiusKm} km` : 'All Regions'}
              </span>
            </span>
            <div className="w-px h-3 bg-gray-300 mx-1" />
            <button
              onClick={() => setIsRadiusModalOpen(true)}
              className="text-xs font-bold text-[#FF5A36] hover:text-[#e04d2d] flex items-center gap-0.5 cursor-pointer active:scale-95 transition-all"
            >
              Change radius <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Permission Denied Mini Notice Banner */}
      {locationStatus === 'denied' && locationSource !== 'gps' && (
        <div className="absolute top-16 inset-x-4 z-[500] bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-amber-200 p-3 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-gray-900 block">
                {locationSource === 'profile' ? 'Using Your Profile Location' : 'Using Regional Center'}
              </span>
              <span className="text-gray-500 text-[11px]">Enable device GPS anytime for live accuracy</span>
            </div>
          </div>
          <button
            onClick={requestLocation}
            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
          >
            Enable GPS
          </button>
        </div>
      )}

      {/* Initial GPS Permission Dialog */}
      {locationStatus === 'prompt' && (
        <div className="absolute inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-orange-100 text-[#FF5A36] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Navigation className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Find Nearby Stores</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Enable your location to discover local artisans, storefronts, and products right in your area.
            </p>
            <button
              onClick={requestLocation}
              className="w-full bg-[#FF5A36] text-white font-bold py-3.5 rounded-2xl hover:bg-[#e04d2d] transition-all mb-2.5 shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
            >
              Use My Current Location
            </button>
            <button
              onClick={() => {
                setLocationStatus('denied');
                applyProfileFallback();
              }}
              className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl hover:bg-gray-200 transition-colors cursor-pointer text-xs"
            >
              Use Profile Location Instead
            </button>
          </div>
        </div>
      )}

      {/* Radius Selector Bottom Modal */}
      {isRadiusModalOpen && (
        <div
          className="fixed inset-0 z-[700] bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center"
          onClick={() => setIsRadiusModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-white rounded-t-[32px] sm:rounded-3xl p-5 shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Select Search Radius</h3>
                <p className="text-xs text-gray-500">Filter stores by distance from your location</p>
              </div>
              <button
                onClick={() => setIsRadiusModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {RADIUS_OPTIONS.map((opt) => {
                const isSelected = radiusKm === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setRadiusKm(opt.value);
                      setIsRadiusModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FF5A36] bg-orange-50/70 text-[#FF5A36]'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-sm">{opt.label}</span>
                      <span className="text-[11px] text-gray-500">{opt.desc}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-[#FF5A36]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Synchronized Bottom Sheet List */}
      <NearbyBottomSheet
        userCoords={userCoords}
        radiusKm={radiusKm}
        onExpandRadius={(newRadius) => setRadiusKm(newRadius)}
      />
    </div>
  );
}
