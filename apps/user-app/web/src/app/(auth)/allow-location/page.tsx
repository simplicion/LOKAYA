'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { setLocation } from '@/lib/features/locationSlice';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/ui/Map'), { 
  ssr: false, 
  loading: () => (
    <div className="h-64 w-full bg-indigo-50 animate-pulse rounded-3xl flex items-center justify-center">
      <MapPin className="h-12 w-12 text-indigo-300" />
    </div>
  )
});

export default function AllowLocationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fetchedLocation, setFetchedLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const { user } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleAllowLocation = () => {
    setIsLoading(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFetchedLocation({ lat: latitude, lng: longitude });
        dispatch(setLocation({ latitude, longitude, address: 'Current Location' }));
        toast.success('Location enabled successfully');
        setIsLoading(false);
        setIsSuccess(true);
        
        // Wait 2.5s for user to see their location on map before redirecting
        setTimeout(() => {
          router.push(user?.role === 'USER' ? '/home' : '/store-partner/home');
        }, 2500);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Failed to get your location. Please check your browser settings.');
        setIsLoading(false);
      }
    );
  };

  const handleSkip = () => {
    router.push(user?.role === 'USER' ? '/home' : '/store-partner/home');
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-50">
      {/* Full-screen map background */}
      <div className="absolute inset-0 z-0">
        <LocationMap userLocation={fetchedLocation} nearbyStores={[]} className="h-full w-full" />
      </div>

      {/* Floating UI at the bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col bg-white/95 backdrop-blur-md rounded-t-3xl p-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] text-center border-t border-gray-100">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Allow Location</h1>
          <p className="text-gray-500 font-medium">We need your location to show nearby stores</p>
        </div>

        <div className="w-full space-y-3">
          <Button 
            onClick={handleAllowLocation}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 text-lg font-medium shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all active:scale-[0.98]" 
            disabled={isLoading || isSuccess}
          >
            {isLoading ? 'Getting Location...' : isSuccess ? 'Continuing...' : 'Allow Location'}
          </Button>
          
          {!isSuccess && (
            <button 
              type="button" 
              onClick={handleSkip}
              className="w-full py-3 text-gray-500 font-medium hover:text-indigo-600 transition-colors"
              disabled={isLoading}
            >
              Not Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
