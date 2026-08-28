'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, ShoppingCart, User, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useState, useEffect } from 'react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  // Hide completely on pages where we don't need it
  const hideOnRoutes = ['/home/checkout', '/home/product', '/home/store', '/home/search', '/home/orders', '/store-partner'];
  const shouldHideCompletely = hideOnRoutes.some(route => pathname === route || pathname?.startsWith(`${route}/`));

  if (shouldHideCompletely) return null;

  const links = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/home/stores', label: 'Stores', icon: Store },
    { href: '/home/search', label: 'Search', icon: Search },
    { href: '/home/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around border-t bg-white pb-safe dark:bg-gray-950 transition-transform duration-300 md:hidden",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = link.href === '/home' 
          ? pathname === '/home' 
          : pathname === link.href || pathname?.startsWith(`${link.href}/`);
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
              isActive && "text-blue-600 dark:text-blue-500"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
