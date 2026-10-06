'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Home, 
  Compass, 
  Store as StoreIcon, 
  ArrowLeft, 
  AlertCircle,
  ShoppingBag,
  HelpCircle
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#171717] flex flex-col justify-between">
      {/* Top Bar */}
      <header className="w-full max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF5A36] to-[#FF7A59] flex items-center justify-center text-white font-black text-lg shadow-sm">
            L
          </div>
          <span className="font-extrabold text-lg tracking-tight text-[#171717]">Lokaya</span>
        </Link>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-[#E5E2DC] px-3 py-1.5 rounded-full shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>
      </header>

      {/* Main 404 Content */}
      <main className="w-full max-w-xl mx-auto px-4 py-8 text-center flex flex-col items-center">
        {/* Visual Badge */}
        <div className="w-20 h-20 rounded-3xl bg-orange-50 border border-orange-100 text-[#FF5A36] flex items-center justify-center mb-6 shadow-sm">
          <AlertCircle className="w-10 h-10 stroke-[1.8]" />
        </div>

        <span className="text-xs font-black tracking-widest text-[#FF5A36] uppercase bg-orange-50 px-3 py-1 rounded-full mb-3 border border-orange-200/60">
          HTTP 404 • Resource Not Found
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight mb-3">
          Looking for something?
        </h1>

        <p className="text-sm sm:text-base text-gray-600 max-w-md mb-8 leading-relaxed">
          The product, merchant store, creator profile, or link you followed could not be found or has moved to a new address.
        </p>

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="w-full max-w-md mb-8">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, stores, or categories..."
              className="w-full h-12 pl-11 pr-24 rounded-2xl bg-white border border-[#E5E2DC] text-sm text-gray-900 placeholder:text-gray-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/20 focus:border-[#FF5A36] transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 h-9 px-4 rounded-xl bg-[#FF5A36] text-white text-xs font-bold hover:bg-[#e04b28] active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              Search
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
          <Link
            href="/home"
            className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#171717] text-white font-bold text-xs shadow-sm hover:bg-black active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
          <Link
            href="/explore"
            className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white border border-[#E5E2DC] text-gray-800 font-bold text-xs shadow-2xs hover:bg-gray-50 active:scale-95 transition-all"
          >
            <Compass className="w-4 h-4 text-[#FF5A36]" />
            <span>Explore Trends</span>
          </Link>
        </div>

        {/* Helpful Popular Destinations */}
        <div className="mt-10 pt-8 border-t border-[#E5E2DC] w-full">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Popular Destinations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <Link
              href="/explore"
              className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E2DC] text-gray-700 hover:text-[#FF5A36] hover:border-[#FF5A36]/40 transition-colors"
            >
              Trending Products
            </Link>
            <Link
              href="/business"
              className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E2DC] text-gray-700 hover:text-[#FF5A36] hover:border-[#FF5A36]/40 transition-colors"
            >
              Sell on Lokaya
            </Link>
            <Link
              href="/partner"
              className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E2DC] text-gray-700 hover:text-[#FF5A36] hover:border-[#FF5A36]/40 transition-colors"
            >
              Delivery Partner
            </Link>
            <Link
              href="/support"
              className="px-3 py-1.5 rounded-lg bg-white border border-[#E5E2DC] text-gray-700 hover:text-[#FF5A36] hover:border-[#FF5A36]/40 transition-colors"
            >
              Help Center
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Lokaya Technologies Private Limited. All rights reserved.
      </footer>
    </div>
  );
}
