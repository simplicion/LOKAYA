import React from 'react';
import { MapPin, Heart, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface Store {
  id: string | number;
  name: string;
  image: string;
  isOpen: boolean;
  rating: number;
  reviews: number;
  category: string;
  distance: string;
  productCount: number;
}

interface StoreCardProps {
  store: Store;
}

export function StoreCard({ store }: StoreCardProps) {
  const router = useRouter();

  return (
    <div 
      className="bg-white rounded-2xl p-3 flex gap-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative group" 
      onClick={() => router.push(`/store/${store.id}`)}
    >
      <div className="w-[84px] h-[92px] bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-black/5">
        <img src={store.image} className="w-full h-full object-cover" alt={store.name} />
      </div>
      <div className="flex flex-col justify-center flex-1 py-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-[14px] text-gray-900">{store.name}</h3>
          {store.isOpen && (
            <span className="text-[8px] font-bold text-green-700 bg-green-100/80 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">
              Open
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 font-medium">
          <span className="text-amber-500 font-bold tracking-tight">★ {store.rating}</span> ({store.reviews}) <span className="text-gray-300 text-[8px]">●</span> {store.category}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1 font-medium">
          <MapPin className="w-[11px] h-[11px]" /> {store.distance}
        </p>
        <div className="mt-2.5">
          <span className="text-[9px] font-bold text-[#FF5A36] bg-[#FF5A36]/10 px-2 py-1 rounded tracking-wide">
            {store.productCount} Products
          </span>
        </div>
      </div>
      <button 
        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors" 
        onClick={(e) => {
          e.stopPropagation();
          // TODO: Toggle favorite
        }}
      >
        <Heart className="w-4 h-4" strokeWidth={2.5} />
      </button>
      <button className="absolute bottom-3 right-3 text-gray-300">
        <ChevronRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
      </button>
    </div>
  );
}
