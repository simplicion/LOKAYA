'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Store, User, BarChart3, PackageSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function StorePartnerBottomNav() {
  const pathname = usePathname();
  
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

  // Only show this navigation bar on /store-partner routes, but NOT on onboarding or verification
  if (!pathname?.startsWith('/store-partner')) return null;
  if (pathname === '/store-partner/onboarding' || pathname === '/store-partner/verification') return null;

  const links = [
    { href: '/store-partner/home', label: 'Home', icon: Home },
    { href: '/store-partner/orders', label: 'Orders', icon: Package },
    { href: '/store-partner/store', label: 'Store', icon: Store },
    { href: '/store-partner/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/store-partner/products', label: 'Products', icon: PackageSearch },
  ];

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around border-t bg-white pb-safe dark:bg-gray-950 transition-transform duration-300 md:hidden",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full text-gray-500 transition-colors hover:text-blue-600",
              isActive && "text-blue-600"
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
