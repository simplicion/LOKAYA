'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Store as StoreIcon } from 'lucide-react';
import Link from 'next/link';
import { useGetAllStoresQuery } from '@/lib/api';
import Image from 'next/image';

export default function StoresListPage() {
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {}
      );
    }
  }, []);

  const { data: stores = [], isLoading } = useGetAllStoresQuery(userLocation || undefined);

  const filteredStores = stores.filter(store => 
    (store.title || store.name).toLowerCase().includes(search.toLowerCase()) ||
    (store.description && store.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="flex items-center justify-center px-4 pt-4 pb-2 sticky top-0 bg-white z-10">
        <h1 className="font-bold text-gray-900 text-lg">Search Stores</h1>
      </div>

      {/* Search & Filter */}
      <div className="px-4 py-2 flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-11 rounded-xl bg-gray-50 border border-gray-100 focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-600/10 transition-all text-sm font-medium"
          />
        </div>
        <button className="h-11 w-11 flex items-center justify-center border border-gray-100 rounded-xl bg-gray-50 text-gray-600 shrink-0">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Store List */}
      <div className="px-4 mt-6 flex flex-col gap-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl">
            <p className="text-gray-500 text-sm font-medium">No stores found.</p>
          </div>
        ) : (
          filteredStores.map(store => (
            <Link href={`/home/store?id=${store.id}`} key={store.id} className="flex flex-col border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`relative w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 overflow-hidden`}>
                    {store.logoUrl ? (
                      <Image src={store.logoUrl} alt={store.title || store.name} fill className="object-cover" />
                    ) : (
                      <StoreIcon className="w-6 h-6 text-indigo-300" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-gray-900 text-[15px] mb-1">{store.title || store.name}</h3>
                    <div className="flex items-center text-xs text-gray-500 font-medium mb-1">
                      <span className="text-yellow-500 mr-1">★</span>
                      <span className="text-gray-700 font-semibold mr-1">4.5</span>
                      <span className="mr-1">(100+)</span>
                      <span className="mx-1">•</span>
                      <span>
                        {store.distance !== undefined && store.distance !== null 
                          ? `${store.distance.toFixed(1)} km` 
                          : 'Distance unknown'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium flex items-center">
                      <span className="mr-1">⚡</span> Pick up in 15 mins
                    </div>
                  </div>
                </div>
                {store.distance !== undefined && store.distance !== null && (
                  <span className="text-xs text-gray-500 font-semibold">{store.distance.toFixed(1)} km</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
