'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingCart, Bell, Settings, ChevronDown, Check, ArrowLeft, Bookmark, PlusSquare, Menu } from 'lucide-react';
import { Logo } from "@/components/ui/logo";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useGetMyStoreQuery } from '@/lib/api';

export function MobileTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const cart = useSelector((state: RootState) => state.cart);
  const cartTotalItems = Object.values(cart.items).reduce((sum, item) => sum + item.quantity, 0);
  const { data: myStore } = useGetMyStoreQuery();

  // Hide TopNav on these routes (they have their own headers or are full screen)
  const hideOnRoutes = ['/search', '/home/reels', '/home/checkout', '/home/order', '/explore/nearby', '/wishlist', '/product', '/store', '/profile/create'];
  const shouldHide = hideOnRoutes.some(route => pathname === route || pathname?.startsWith(`${route}/`));

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showFeedMenu, setShowFeedMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide if scrolling down past 50px
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } 
      // Show if scrolling up or at the very top
      else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (shouldHide) return null;

  let leftContent = null;
  let centerContent = null;
  let rightContent = null;

  if (pathname === '/home') {
    leftContent = <h1><Logo className="text-2xl text-[#171717]" /></h1>;
    centerContent = (
      <div className="absolute left-1/2 -translate-x-1/2">
        <button 
          onClick={() => setShowFeedMenu(!showFeedMenu)}
          className="flex items-center gap-1 text-[16px] font-bold text-[#171717]"
        >
          <span>For You</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {showFeedMenu && (
          <div className="absolute top-full mt-2 -ml-8 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 py-2 w-48 z-50">
            <button className="w-full text-left px-4 py-2.5 text-sm font-bold text-[#171717] hover:bg-gray-50 flex items-center justify-between">
              For You
              <Check className="w-4 h-4 text-[#171717]" />
            </button>
            <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50">
              Following
            </button>
          </div>
        )}
      </div>
    );
    rightContent = (
      <Link href="/cart" className="relative text-[#171717]">
        <ShoppingCart className="w-6 h-6" />
        {cartTotalItems > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF5A36] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white tabular-nums">
            {cartTotalItems}
          </span>
        )}
      </Link>
    );
  } else if (pathname === '/explore') {
    leftContent = <h1 className="text-2xl font-black text-[#171717]">Explore</h1>;
    rightContent = (
      <div className="flex items-center gap-4">
        <Link href="/wishlist" className="text-[#171717]">
          <Bookmark className="w-6 h-6" />
        </Link>
        <Link href="/cart" className="relative text-[#171717]">
          <ShoppingCart className="w-6 h-6" />
          {cartTotalItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF5A36] text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
              {cartTotalItems}
            </span>
          )}
        </Link>
      </div>
    );
  } else if (pathname === '/cart') {
    leftContent = (
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="text-[#171717] hover:bg-gray-50 rounded-full p-1 transition-colors -ml-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-[#171717]">
          My Cart <span className="text-[#6B6B6B] font-medium text-lg tabular-nums">({cartTotalItems})</span>
        </h1>
      </div>
    );
    rightContent = (
      <div className="flex items-center gap-4">
        <Link href="/wishlist" className="text-[#171717]">
          <Bookmark className="w-6 h-6" />
        </Link>
        <button className="relative text-[#171717]">
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5A36] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#FAF9F6] tabular-nums">
            2
          </span>
        </button>
      </div>
    );
  } else if (pathname === '/profile') {
    if (myStore) {
      leftContent = <h1 className="text-xl font-bold text-[#171717]">{user?.name || myStore.name}</h1>;
      rightContent = (
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/profile/create/post')} 
            className="relative text-[#171717]"
          >
            <PlusSquare className="w-6 h-6" />
          </button>
          <Link href="/profile/settings" className="relative text-[#171717]">
            <Menu className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5A36] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#FAF9F6] tabular-nums">
              1
            </span>
          </Link>
        </div>
      );
    } else {
      leftContent = <h1 className="text-xl font-bold text-[#171717]">My Account</h1>;
      rightContent = (
        <div className="flex items-center gap-4">
          <button className="relative text-[#171717]">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5A36] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#FAF9F6] tabular-nums">
              3
            </span>
          </button>
        </div>
      );
    }
  } else {
    // Default fallback
    leftContent = <h1><Logo className="text-xl text-[#171717]" /></h1>;
  }

  return (
    <div className={cn(
      "flex items-center justify-between px-4 pt-4 pb-2 sticky top-0 bg-white z-50 transition-transform duration-300",
      isVisible ? "translate-y-0" : "-translate-y-full"
    )}>
      {leftContent}
      {centerContent}
      <div className="flex items-center">
        {rightContent}
      </div>
    </div>
  );
}
