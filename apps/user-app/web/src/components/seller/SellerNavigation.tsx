'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Package, 
  ShoppingBag, 
  Store, 
  BarChart2, 
  Plus, 
  Zap, 
  Bike, 
  Truck, 
  Users 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../ui/logo';
import { SellerQuickActionsSheet } from './SellerQuickActionsSheet';

const SELLER_NAV_ITEMS = [
  { name: 'Dashboard', href: '/seller', icon: Home },
  { name: 'Products', href: '/seller/products', icon: Package },
  { name: 'Orders', href: '/seller/orders', icon: ShoppingBag },
  { name: 'Analytics', href: '/seller/analytics', icon: BarChart2 },
  { name: 'Store', href: '/seller/store', icon: Store },
];

export function SellerSidebar() {
  const pathname = usePathname();
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E5E2DC] flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-[#E5E2DC]">
          <Logo className="text-2xl text-[#171717]" />
          <p className="text-xs text-[#6B6B6B] mt-1 font-medium tracking-wider uppercase">Seller Workspace</p>
        </div>

        {/* Quick Operations Button */}
        <div className="p-4 pb-2">
          <button
            onClick={() => setIsActionsOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-[#FF5A36] to-amber-500 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span>Store Operations</span>
            </div>
            <Plus className="w-4 h-4 text-white/90 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        <nav className="flex-1 p-4 pt-1 space-y-1.5">
          {SELLER_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href === '/seller' && pathname === '/seller/dashboard') || (item.href !== '/seller' && pathname.startsWith(item.href));
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

          <div className="pt-4 border-t border-[#E5E2DC]/60 mt-4 space-y-1">
            <p className="px-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Direct Hubs</p>
            <Link
              href="/seller/delivery-partners"
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-colors',
                pathname === '/seller/delivery-partners' ? 'bg-emerald-50 text-emerald-800' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Bike className="w-4 h-4 text-emerald-600" />
              <span>Delivery Fleet</span>
            </Link>
            <Link
              href="/seller/dispatch"
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-colors',
                pathname === '/seller/dispatch' ? 'bg-orange-50 text-[#FF5A36]' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Truck className="w-4 h-4 text-[#FF5A36]" />
              <span>Bulk Dispatch</span>
            </Link>
            <Link
              href="/seller/analytics/customers"
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-colors',
                pathname === '/seller/analytics/customers' ? 'bg-blue-50 text-blue-800' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Top Customers</span>
            </Link>
          </div>
        </nav>
      </aside>

      <SellerQuickActionsSheet 
        isOpen={isActionsOpen} 
        onClose={() => setIsActionsOpen(false)} 
      />
    </>
  );
}

export function SellerBottomNav() {
  const pathname = usePathname();
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const isHomeActive = pathname === '/seller' || pathname === '/seller/dashboard';
  const isProductsActive = pathname.startsWith('/seller/products');
  const isOrdersActive = pathname.startsWith('/seller/orders');
  const isAnalyticsActive = pathname.startsWith('/seller/analytics');

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E2DC] pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 px-1">
          {/* Item 1: Dashboard */}
          <Link
            href="/seller"
            className="flex flex-col items-center justify-center flex-1 h-full gap-1"
          >
            <Home
              className={cn(
                'w-5 h-5 transition-colors duration-200',
                isHomeActive ? 'text-[#FF5A36]' : 'text-[#999999]'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-bold transition-colors duration-200',
                isHomeActive ? 'text-[#FF5A36]' : 'text-[#6B6B6B]'
              )}
            >
              Dashboard
            </span>
          </Link>

          {/* Item 2: Products */}
          <Link
            href="/seller/products"
            className="flex flex-col items-center justify-center flex-1 h-full gap-1"
          >
            <Package
              className={cn(
                'w-5 h-5 transition-colors duration-200',
                isProductsActive ? 'text-[#FF5A36]' : 'text-[#999999]'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-bold transition-colors duration-200',
                isProductsActive ? 'text-[#FF5A36]' : 'text-[#6B6B6B]'
              )}
            >
              Products
            </span>
          </Link>

          {/* Item 3: Orders */}
          <Link
            href="/seller/orders"
            className="flex flex-col items-center justify-center flex-1 h-full gap-1"
          >
            <ShoppingBag
              className={cn(
                'w-5 h-5 transition-colors duration-200',
                isOrdersActive ? 'text-[#FF5A36]' : 'text-[#999999]'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-bold transition-colors duration-200',
                isOrdersActive ? 'text-[#FF5A36]' : 'text-[#6B6B6B]'
              )}
            >
              Orders
            </span>
          </Link>

          {/* Item 4: Analytics */}
          <Link
            href="/seller/analytics"
            className="flex flex-col items-center justify-center flex-1 h-full gap-1"
          >
            <BarChart2
              className={cn(
                'w-5 h-5 transition-colors duration-200',
                isAnalyticsActive ? 'text-[#FF5A36]' : 'text-[#999999]'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-bold transition-colors duration-200',
                isAnalyticsActive ? 'text-[#FF5A36]' : 'text-[#6B6B6B]'
              )}
            >
              Analytics
            </span>
          </Link>

          {/* Item 5: Plus (+) Action Button (in place of Store) */}
          <button
            type="button"
            onClick={() => setIsActionsOpen(true)}
            aria-label="Store Operations & Quick Actions"
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 group transition-transform active:scale-95"
          >
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
              isActionsOpen 
                ? "bg-gradient-to-tr from-orange-500 to-[#FF5A36] text-white shadow-md shadow-orange-500/30 rotate-45" 
                : "bg-orange-50 text-[#FF5A36] border border-orange-200/70 group-hover:bg-[#FF5A36] group-hover:text-white"
            )}>
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className={cn(
              "text-[10px] font-bold transition-colors duration-200",
              isActionsOpen ? "text-[#FF5A36]" : "text-[#6B6B6B] group-hover:text-[#FF5A36]"
            )}>
              Actions
            </span>
          </button>
        </div>
      </nav>

      <SellerQuickActionsSheet 
        isOpen={isActionsOpen} 
        onClose={() => setIsActionsOpen(false)} 
      />
    </>
  );
}

