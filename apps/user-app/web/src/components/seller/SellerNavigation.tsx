'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ShoppingBag, Store, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../ui/logo';

const SELLER_NAV_ITEMS = [
  { name: 'Dashboard', href: '/seller', icon: Home },
  { name: 'Products', href: '/seller/products', icon: Package },
  { name: 'Orders', href: '/seller/orders', icon: ShoppingBag },
  { name: 'Analytics', href: '/seller/analytics', icon: BarChart2 },
  { name: 'Store', href: '/seller/store', icon: Store },
];

export function SellerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E5E2DC] flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
      <div className="p-6 border-b border-[#E5E2DC]">
        <Logo className="text-2xl text-[#171717]" />
        <p className="text-xs text-[#6B6B6B] mt-1 font-medium tracking-wider uppercase">Seller Workspace</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {SELLER_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/seller' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-navy text-white shadow-md'
                  : 'text-[#6B6B6B] hover:bg-[#FAF9F6] hover:text-brand-navy'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-[#999999]')} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function SellerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E2DC] pb-safe z-50">
      <div className="flex items-center justify-around h-16">
        {SELLER_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/seller' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full gap-1"
            >
              <item.icon
                className={cn(
                  'w-6 h-6 transition-colors duration-200',
                  isActive ? 'text-brand-navy' : 'text-[#999999]'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors duration-200',
                  isActive ? 'text-brand-navy' : 'text-[#6B6B6B]'
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
