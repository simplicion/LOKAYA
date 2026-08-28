'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, Search, SlidersHorizontal, MapPin, Heart, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { NearbyBottomSheet } from '@/components/explore/NearbyBottomSheet';

const NearbyMap = dynamic(() => import('@/components/ui/NearbyMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center animate-pulse">Loading map...</div>
});

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'food', label: 'Food' },
];

export default function StoresNearbyPage() {
  const router = useRouter();
  const [locationStatus, setLocationStatus] = useState<'checking' | 'granted' | 'denied' | 'prompt'>('checking');
  
  React.useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
           setLocationStatus('granted');
        } else if (result.state === 'prompt') {
           setLocationStatus('prompt');
        } else {
           setLocationStatus('denied');
        }
      });
    } else {
      setLocationStatus('denied');
    }
  }, []);

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus('granted');
        // We can save position here if needed
      },
      (error) => {
        setLocationStatus('denied');
      }
    );
  };

  return (
    <div className="h-[100dvh] w-full bg-[#FAF9F6] overflow-hidden relative">
      <div className="absolute inset-0 z-10 bg-gray-100">
         <NearbyMap />
         {/* Radius Info Pill */}
         <div className="absolute bottom-[28%] inset-x-0 flex justify-center z-[400] pointer-events-none transition-all duration-300">
           <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-200 flex items-center gap-2 pointer-events-auto shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
             <span className="text-[11px] font-medium text-gray-600">Showing stores within <span className="text-green-600 font-bold">2 km</span></span>
             <div className="w-px h-3 bg-gray-300 mx-1" />
             <button className="text-[11px] font-bold text-[#FF5A36] flex items-center gap-0.5">
               Change radius <ChevronRight className="w-3 h-3" />
             </button>
           </div>
         </div>
      </div>

      {locationStatus === 'denied' && (
        <div className="absolute top-16 inset-x-4 z-[500] bg-white rounded-2xl shadow-lg border border-red-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
               <MapPin className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Location Access Denied</h3>
              <p className="text-xs text-gray-500 mt-1">Please enable location access in your device settings to find nearby stores. Using profile location as fallback.</p>
            </div>
          </div>
        </div>
      )}

      {locationStatus === 'prompt' && (
        <div className="absolute inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-orange-100 text-[#FF5A36] rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8" />
             </div>
             <h2 className="text-xl font-bold text-gray-900 mb-2">Find Nearby Stores</h2>
             <p className="text-sm text-gray-600 mb-6">Allow LOKAYA to access your location to find the best stores and deals near you.</p>
             <button 
               onClick={requestLocation}
               className="w-full bg-[#FF5A36] text-white font-bold py-3.5 rounded-xl hover:bg-[#e04d2d] transition-colors mb-3"
             >
               Allow Location Access
             </button>
             <button 
               onClick={() => setLocationStatus('denied')}
               className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors"
             >
               Use Profile Location Instead
             </button>
          </div>
        </div>
      )}

      <NearbyBottomSheet />
    </div>
  );
}
