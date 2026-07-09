'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { MapPin, Search, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

const mockStores = [
  { id: '1', name: 'FreshMart', rating: 4.5, reviews: 230, distance: '0.3 km', pickupTime: 'Pick up in 10 mins', icon: 'FM', color: 'bg-emerald-600' },
  { id: '2', name: 'Daily Needs', rating: 4.2, reviews: 100, distance: '0.5 km', pickupTime: 'Pick up in 12 mins', icon: 'DN', color: 'bg-green-600' },
  { id: '3', name: 'Green Grocer', rating: 4.6, reviews: 310, distance: '0.7 km', pickupTime: 'Pick up in 15 mins', icon: 'GG', color: 'bg-lime-600' },
  { id: '4', name: 'Super Store', rating: 4.0, reviews: 89, distance: '0.9 km', pickupTime: 'Pick up in 20 mins', icon: 'SS', color: 'bg-red-500' },
  { id: '5', name: 'Quick Basket', rating: 4.1, reviews: 110, distance: '1.1 km', pickupTime: 'Pick up in 18 mins', icon: 'QB', color: 'bg-teal-600' },
];

export default function SearchStoresPage() {
  const router = useRouter();
  const [locationName, setLocationName] = useState('Fetching Location...');
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationName('Geolocation not supported');
      setHasLocationPermission(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setHasLocationPermission(true);
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const area = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || '';
          const city = data.address?.city || data.address?.town || data.address?.county || 'Unknown';
          const displayLocation = area ? `${area}, ${city}` : city;
          setLocationName(displayLocation);
        } catch (error) {
          setLocationName('Location found');
        }
      },
      () => {
        setLocationName('Location Required');
        setHasLocationPermission(false);
      }
    );
  }, []);

  return (
    <div className="flex flex-col space-y-4 pb-20 p-4 bg-white min-h-screen">
      {/* Top Header */}
      <div className="flex items-center gap-3 mt-2">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search stores..."
            className="w-full pl-9 pr-4 h-10 rounded-xl bg-gray-50 border-transparent focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 transition-all text-sm font-medium"
            autoFocus
          />
        </div>
      </div>

      {/* Location Sub-header */}
      <div className="flex items-center justify-between py-1 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
          <MapPin className="w-4 h-4" />
          <span>Near <span className="text-gray-900 font-bold">{locationName}</span></span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Store List */}
      <div className="flex flex-col gap-4 mt-2">
        {hasLocationPermission === false ? (
          <div className="text-center py-10 bg-indigo-50/50 rounded-2xl">
            <p className="text-gray-600 text-sm font-medium px-6">We need your location to show nearby stores.</p>
          </div>
        ) : hasLocationPermission === null ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          mockStores.map((store) => (
            <Link href={`/home/store?id=${store.id}`} key={store.id}>
              <Card className="flex flex-row items-center p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-2xl gap-4 bg-white w-full">
                <div className={`w-16 h-16 ${store.color} rounded-2xl flex items-center justify-center shrink-0 shadow-inner`}>
                  <span className="text-white font-bold text-xl">{store.icon}</span>
                </div>
                <div className="flex flex-col flex-1 w-full overflow-hidden">
                  <div className="flex justify-between items-start mb-1 w-full">
                    <h4 className="font-bold text-gray-900 text-[16px] truncate pr-2">{store.name}</h4>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg shrink-0 border border-indigo-100">{store.distance}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 font-medium mb-2.5">
                    <span className="text-yellow-500 text-sm mr-1">★</span>
                    <span className="text-gray-800 font-bold mr-1">{store.rating}</span>
                    <span className="text-gray-400">({store.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 w-fit px-2.5 py-1 rounded-lg">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    {store.pickupTime}
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
