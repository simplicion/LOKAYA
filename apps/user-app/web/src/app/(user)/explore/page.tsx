'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Search, Camera, TrendingUp, SlidersHorizontal, ChevronDown, MoreVertical, Star, BadgeCheck, LayoutGrid } from 'lucide-react';
import { ExploreProductCard } from '@/components/explore/ExploreProductCard';
import { cn } from '@/lib/utils';

const MOCK_CATEGORIES = [
  { id: 'all', name: 'All', isIcon: true },
  { id: 'men', name: 'Men', image: 'https://images.unsplash.com/photo-1516826957135-700ede19c6ce?q=80&w=150&auto=format&fit=crop' },
  { id: 'women', name: 'Women', image: 'https://images.unsplash.com/photo-1515347619362-790176378e9b?q=80&w=150&auto=format&fit=crop' },
  { id: 'footwear', name: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=150&auto=format&fit=crop' },
  { id: 'bags', name: 'Bags', image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=150&auto=format&fit=crop' },
  { id: 'watches', name: 'Watches', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=150&auto=format&fit=crop' },
  { id: 'home', name: 'Home', image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=150&auto=format&fit=crop' },
  { id: 'beauty', name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=150&auto=format&fit=crop' },
];

const MOCK_TRENDING = [
  { id: 1, text: 'Oversized T-Shirt', isTrending: true },
  { id: 2, text: 'Sneakers' },
  { id: 3, text: 'Linen Shirts' },
  { id: 4, text: 'Smart Watch' },
  { id: 5, text: 'Home Decor' },
  { id: 6, text: 'Sunglasses' },
];

const MOCK_PRODUCTS = [
  {
    id: 'p1',
    title: 'Waffle Knit Shirt',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=600&auto=format&fit=crop',
    price: '1,499',
    originalPrice: '2,499',
    discount: '-40%',
    tag: { text: 'Bestseller', bg: 'bg-[#FF9800]' },
    store: { name: 'Urban Threads', isVerified: true },
    rating: '4.7',
    reviews: '(1.2K)'
  },
  {
    id: 'p2',
    title: 'Urban Runner Sneakers',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop',
    price: '2,999',
    originalPrice: '3,999',
    discount: '-25%',
    tag: { text: 'New', bg: 'bg-[#16845B]' },
    store: { name: 'Sneak Peak', isVerified: true },
    rating: '4.8',
    reviews: '(856)'
  },
  {
    id: 'p3',
    title: 'Classic Chrono Watch',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop',
    price: '3,499',
    originalPrice: '4,999',
    discount: '-30%',
    store: { name: 'Time Craft', isVerified: true },
    rating: '4.6',
    reviews: '(723)'
  },
  {
    id: 'p4',
    title: 'Modern Table Lamp',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop',
    price: '1,899',
    originalPrice: '2,700',
    discount: '-32%',
    store: { name: 'Luxe Living', isVerified: true },
    rating: '4.9',
    reviews: '(312)'
  },
  {
    id: 'p5',
    title: 'Floral Maxi Dress',
    image: 'https://images.unsplash.com/photo-1515347619362-790176378e9b?q=80&w=600&auto=format&fit=crop',
    price: '2,199',
    originalPrice: '3,299',
    discount: '-33%',
    tag: { text: 'Sale', bg: 'bg-[#FF5A36]' },
    store: { name: 'Bloom Style', isVerified: true },
    rating: '4.5',
    reviews: '(512)'
  },
  {
    id: 'p6',
    title: 'Leather Tote Bag',
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=600&auto=format&fit=crop',
    price: '4,599',
    originalPrice: '6,000',
    discount: '-23%',
    store: { name: 'Chic Bags', isVerified: true },
    rating: '4.8',
    reviews: '(420)'
  },
  {
    id: 'p7',
    title: 'Essential Oversized Tee',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=600&auto=format&fit=crop',
    price: '799',
    originalPrice: '1,299',
    discount: '-38%',
    store: { name: 'Basics', isVerified: false },
    rating: '4.4',
    reviews: '(890)'
  },
  {
    id: 'p8',
    title: 'Vitamin C Serum',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop',
    price: '899',
    originalPrice: '1,499',
    discount: '-40%',
    tag: { text: 'New', bg: 'bg-[#16845B]' },
    store: { name: 'Glow Beauty', isVerified: true },
    rating: '4.7',
    reviews: '(654)'
  }
];

export default function ExplorePage() {
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
        setIsNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24">

      {/* 2. Search Bar */}
      <div className="px-4 py-2">
        <Link href="/search" className="relative flex items-center w-full h-11 bg-[#F2EFE9] rounded-xl px-3 overflow-hidden cursor-pointer">
          <Search className="w-5 h-5 text-[#6B6B6B]" />
          <div className="flex-1 px-3 text-[14px] text-[#999999] text-left">Search products, stores and more</div>
          <Camera className="w-5 h-5 text-[#6B6B6B]" />
        </Link>
      </div>

      {/* 3. Categories */}
      <div className="pt-4 pb-2">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-[15px] font-bold text-[#171717]">Categories</h2>
          <button className="text-[13px] font-bold text-[#FF5A36]">View All</button>
        </div>
        <div className="flex overflow-x-auto no-scrollbar px-4 gap-4 pb-2">
          {MOCK_CATEGORIES.map((cat, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 cursor-pointer">
              {cat.isIcon ? (
                <div className="w-[60px] h-[60px] rounded-2xl border-2 border-[#FF5A36] flex items-center justify-center bg-white shadow-sm flex-shrink-0">
                  <LayoutGrid className="w-6 h-6 text-[#FF5A36]" />
                </div>
              ) : (
                <div className="w-[60px] h-[60px] rounded-2xl bg-[#F2EFE9] overflow-hidden flex-shrink-0">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                </div>
              )}
              <span className="text-[11px] font-medium text-[#171717]">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Promotional Banners */}
      <div className="py-2">
        <div className="flex overflow-x-auto no-scrollbar px-4 gap-3 snap-x snap-mandatory">
          {/* Banner 1 */}
          <div className="min-w-[85%] sm:min-w-[320px] h-[160px] rounded-2xl bg-[#2D2321] relative overflow-hidden snap-center flex-shrink-0 flex items-center">
            <div className="absolute right-0 h-full w-[60%]">
              <img src="https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" alt="Banner" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#2D2321] via-[#2D2321]/80 to-transparent" />
            </div>
            <div className="relative z-10 px-5 flex flex-col items-start max-w-[65%]">
              <h3 className="text-white text-[18px] font-bold leading-tight">Summer Sale</h3>
              <p className="text-white/90 text-[12px] font-medium mt-1">Up to 50% OFF</p>
              <p className="text-white/60 text-[10px] mt-0.5 mb-3 leading-snug">Extra 10% off on prepaid orders</p>
              <button className="bg-white text-[#171717] text-[12px] font-bold px-4 py-1.5 rounded-lg shadow-md">
                Shop Now
              </button>
            </div>
          </div>
          
          {/* Banner 2 */}
          <div className="min-w-[85%] sm:min-w-[320px] h-[160px] rounded-2xl bg-[#F2EFE9] relative overflow-hidden snap-center flex-shrink-0 flex items-center">
            <div className="absolute right-0 h-full w-[50%] p-4 flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-contain mix-blend-multiply drop-shadow-xl scale-125 translate-x-4" alt="Banner" />
            </div>
            <div className="relative z-10 px-5 flex flex-col items-start">
              <h3 className="text-[#171717] text-[18px] font-bold leading-tight">New Arrivals</h3>
              <p className="text-[#6B6B6B] text-[12px] font-medium mt-1 mb-4">Fresh styles just in</p>
              <button className="bg-white text-[#171717] text-[12px] font-bold px-4 py-1.5 rounded-lg shadow-sm border border-[#E5E2DC]">
                Shop Now
              </button>
            </div>
          </div>
        </div>
        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <div className="w-4 h-1.5 rounded-full bg-[#FF5A36]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#E5E2DC]" />
        </div>
      </div>

      {/* 5. Trending Searches */}
      <div className="pt-4 pb-2">
        <h2 className="text-[15px] font-bold text-[#171717] px-4 mb-3">Trending Searches</h2>
        <div className="flex overflow-x-auto no-scrollbar px-4 gap-2 pb-2">
          {MOCK_TRENDING.map((term, i) => (
            <button 
              key={i}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border flex-shrink-0 text-[13px] transition-colors ${
                term.isTrending 
                  ? 'border-[#FF5A36] text-[#FF5A36] bg-[#FF5A36]/5' 
                  : 'border-[#E5E2DC] text-[#171717] bg-white'
              }`}
            >
              {term.isTrending && <TrendingUp className="w-4 h-4" />}
              <span className="font-medium whitespace-nowrap">{term.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 6. Filters & Sort */}
      <div className={cn(
        "flex items-center justify-between px-4 py-3 border-y border-[#E5E2DC] sticky bg-white z-40 transition-all duration-300",
        isNavVisible ? "top-[56px]" : "top-0"
      )}>
        <button className="flex items-center gap-2 text-[13px] font-bold text-[#171717]">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </button>
        <button className="flex items-center gap-1 text-[13px] font-bold text-[#171717]">
          Sort by: Most Popular
          <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />
        </button>
      </div>

      {/* 7. Product Grid */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-[#FAF9F6]">
        {MOCK_PRODUCTS.map((product) => (
          <ExploreProductCard key={product.id} product={product} />
        ))}
      </div>

    </div>
  );
}
