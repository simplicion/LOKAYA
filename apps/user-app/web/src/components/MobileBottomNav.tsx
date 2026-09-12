'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlaySquare, ShoppingCart, User, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useState, useEffect } from 'react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useSelector((state: RootState) => state.cart);
  const cartTotalItems = Object.values(cart.items).reduce((sum, item) => sum + item.quantity, 0);
  const hideOnRoutes = ['/home/checkout', '/home/product', '/home/store', '/home/orders', '/seller', '/home/reels', '/search', '/cart', '/wishlist', '/product', '/store', '/profile/create'];
  const shouldHideCompletely = hideOnRoutes.some(route => pathname === route || pathname?.startsWith(`${route}/`));

  if (shouldHideCompletely) return null;

  const links = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Search },
    { href: '/home/reels', label: 'Reels', icon: PlaySquare },
    { href: '/explore/nearby', label: 'Stores', icon: MapPin },
    { href: '/profile', label: 'Account', icon: User },
  ];

  return (
    <>
      {/* Spacer to prevent content from hiding behind the fixed nav */}
      <div className="h-24 w-full md:hidden" />
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around border-t border-[#E5E2DC] bg-[#FFFFFF] pb-safe transition-transform duration-300 md:hidden",
        "translate-y-0"
      )}>
        {links.map((link) => {
        const Icon = link.icon;
        let isActive = false;
        if (link.href === '/home') {
          isActive = pathname === '/home' || pathname === '/';
        } else if (link.href === '/explore') {
          isActive = pathname === '/explore';
        } else {
          isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
        }
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full relative transition-all duration-300",
              isActive ? "text-[#FF5A36]" : "text-[#8E8E93] hover:text-[#171717]"
            )}
          >
            <div className={cn(
              "relative flex items-center justify-center w-[46px] h-8 rounded-2xl transition-all duration-300 ease-out",
              isActive ? "bg-[#FF5A36]/15 scale-110" : "bg-transparent scale-100"
            )}>
              <Icon 
                className={cn("h-[22px] w-[22px] transition-transform duration-300")} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              {/* Cart Badge */}
              {link.label === 'Cart' && cartTotalItems > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5A36] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-sm">
                  {cartTotalItems > 9 ? '9+' : cartTotalItems}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
    </>
  );
}

