'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import Link from 'next/link';
import { ShoppingBag, ChevronRight, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';

export function FloatingCartBar() {
  const cart = useSelector((state: RootState) => state.cart);
  const pathname = usePathname();
  const { formatPrice } = useCurrency();
  
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Calculate total items and price
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const prevTotalItems = React.useRef(totalItems);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (totalItems > prevTotalItems.current) {
      // An item was added, show the bar and trigger animation
      setIsDismissed(false);
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      prevTotalItems.current = totalItems;
      return () => clearTimeout(timer);
    }
    prevTotalItems.current = totalItems;
  }, [totalItems]);

  // Hide on cart, checkout, order success, reels, search, and profile pages
  const isExcludedPage = 
    pathname?.startsWith('/cart') || 
    pathname?.startsWith('/checkout') || 
    pathname?.startsWith('/order-success') || 
    pathname?.startsWith('/home/reels') ||
    pathname?.startsWith('/reel') ||
    pathname?.startsWith('/search') ||
    pathname?.startsWith('/profile') ||
    pathname?.startsWith('/user') ||
    pathname?.startsWith('/seller');

  if (totalItems === 0 || isExcludedPage || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-[72px] md:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center">
      <div 
        className={`w-full max-w-md bg-[#FF6B00] text-white rounded-xl shadow-lg p-3 flex items-center justify-between pointer-events-auto transition-all duration-300 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        } ${isAnimating ? "scale-105 shadow-2xl bg-[#ff7a1f]" : "scale-100"}`}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">{totalItems} {totalItems === 1 ? 'item' : 'items'} added</span>
            <span className="text-xs text-white/90 font-medium">{formatPrice(totalPrice)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/cart" className="flex items-center gap-1 bg-white text-[#FF6B00] px-4 py-2 rounded-lg font-bold text-sm active:scale-95 transition-transform">
            View Cart
            <ChevronRight className="w-4 h-4" />
          </Link>
          <button 
            onClick={() => setIsDismissed(true)}
            className="p-2 -mr-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            aria-label="Dismiss cart bar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
