'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, X, Clock, MapPin, Store, ShoppingBag } from 'lucide-react';

const SEARCH_FILTERS = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'stores', label: 'Stores Nearby', icon: MapPin },
  { id: 'brands', label: 'Brands', icon: Store },
];

const RECENT_SEARCHES = [
  'Oversized T-Shirt',
  'Sneakers',
  'Linen Shirts',
  'Home Decor'
];

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the search input when the page loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header with Search Input */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 sticky top-0 bg-white z-50 border-b border-[#E5E2DC]">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center -ml-2 text-[#171717]"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex-1 relative flex items-center h-11 bg-[#F2EFE9] rounded-xl px-3 overflow-hidden">
          <Search className="w-5 h-5 text-[#6B6B6B]" />
          <input 
            ref={inputRef}
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, stores and more" 
            className="flex-1 h-full bg-transparent border-none outline-none px-3 text-[14px] text-[#171717] placeholder:text-[#999999]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#E5E2DC] text-[#171717]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chips Filter */}
      <div className="pt-3 pb-3 border-b border-[#E5E2DC]">
        <div className="flex overflow-x-auto no-scrollbar px-4 gap-2">
          {SEARCH_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border flex-shrink-0 text-[13px] transition-colors ${
                  isActive
                    ? 'border-[#171717] bg-[#171717] text-white'
                    : 'border-[#E5E2DC] bg-white text-[#171717]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#6B6B6B]'}`} />
                <span className="font-medium whitespace-nowrap">{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4">
        {!searchQuery ? (
          /* Recent Searches */
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[#171717]">Recent Searches</h3>
              <button className="text-[13px] font-medium text-[#FF5A36]">Clear All</button>
            </div>
            <div className="flex flex-col gap-3">
              {RECENT_SEARCHES.map((search, i) => (
                <button 
                  key={i} 
                  className="flex items-center justify-between py-2 group"
                  onClick={() => setSearchQuery(search)}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#999999]" />
                    <span className="text-[14px] text-[#171717] font-medium group-hover:text-[#FF5A36] transition-colors">{search}</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-[#E5E2DC] rotate-180" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Search Results Placeholder */
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-16 h-16 bg-[#F2EFE9] rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-[#999999]" />
            </div>
            <h3 className="text-[16px] font-bold text-[#171717] mb-1">Searching for "{searchQuery}"</h3>
            <p className="text-[13px] text-[#6B6B6B] max-w-[250px]">
              We are looking across {SEARCH_FILTERS.find(f => f.id === activeFilter)?.label.toLowerCase()} for the best matches.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
