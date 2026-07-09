'use client';

import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import Link from 'next/link';

const storesList = [
  { id: '1', name: 'FreshMart', rating: '4.6', reviews: '230', distance: '0.3 km', time: '10 mins', icon: 'FM', color: 'bg-emerald-600' },
  { id: '2', name: 'Daily Needs', rating: '4.2', reviews: '150', distance: '0.5 km', time: '12 mins', icon: 'DN', color: 'bg-emerald-700' },
  { id: '3', name: 'Green Grocer', rating: '4.8', reviews: '310', distance: '0.7 km', time: '15 mins', icon: 'GG', color: 'bg-emerald-800' },
  { id: '4', name: 'Super Store', rating: '4.4', reviews: '90', distance: '0.9 km', time: '20 mins', icon: 'SS', color: 'bg-red-500' },
  { id: '5', name: 'Quick Basket', rating: '4.5', reviews: '100', distance: '1.1 km', time: '15 mins', icon: 'QB', color: 'bg-emerald-700' },
];

export default function StoresListPage() {
  const [search, setSearch] = useState('');

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
        {storesList.map(store => (
          <Link href={`/home/store?id=${store.id}`} key={store.id} className="flex flex-col border-b border-gray-100 pb-4 last:border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${store.color} rounded-2xl flex items-center justify-center shrink-0`}>
                  <span className="text-white font-bold text-lg">{store.icon}</span>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-gray-900 text-[15px] mb-1">{store.name}</h3>
                  <div className="flex items-center text-xs text-gray-500 font-medium mb-1">
                    <span className="text-yellow-500 mr-1">★</span>
                    <span className="text-gray-700 font-semibold mr-1">{store.rating}</span>
                    <span className="mr-1">({store.reviews})</span>
                    <span className="mx-1">•</span>
                    <span>{store.distance}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium flex items-center">
                    <span className="mr-1">⚡</span> Pick up in {store.time}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500 font-semibold">{store.distance}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
