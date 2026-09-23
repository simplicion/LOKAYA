'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  Plus, 
  ChevronDown, 
  Check, 
  ChevronRight, 
  Compass, 
  MapPin, 
  ShoppingCart, 
  Menu
} from 'lucide-react';
import { Logo } from "@/components/ui/logo";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { cn, getMediaUrl } from '@/lib/utils';
import { useGetMyStoreQuery } from '@/lib/api';
import { NotificationBell } from './common/NotificationBell';
import { CreateUniversalActionSheet } from './navigation/CreateUniversalActionSheet';

const StoryUploadModal = dynamic(
  () => import('@/components/feed/StoryUploadModal').then((mod) => mod.StoryUploadModal),
  { ssr: false }
);

export function MobileTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const cart = useSelector((state: RootState) => state.cart);
  const cartTotalItems = Object.values(cart.items).reduce((sum, item) => sum + item.quantity, 0);

  // Hide TopNav on routes that have dedicated headers or full screen experiences
  const hideOnRoutes = [
    '/checkout',
    '/orders',
    '/seller',
    '/cart',
    '/notifications',
    '/wishlist',
    '/search',
    '/home/reels',
    '/explore/nearby',
    '/product',
    '/store',
    '/profile/',
    '/home/checkout',
    '/home/order'
  ];
  const shouldHide = hideOnRoutes.some(route => pathname === route || pathname?.startsWith(route));

  const { data: myStore } = useGetMyStoreQuery(undefined, { skip: !user || shouldHide });

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showFeedMenu, setShowFeedMenu] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isStoryUploadOpen, setIsStoryUploadOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide if scrolling down past 50px
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
        setShowFeedMenu(false);
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

  // Close dropdown on route change
  useEffect(() => {
    setShowFeedMenu(false);
  }, [pathname]);

  if (shouldHide) return null;

  const isSeller = Boolean(
    user?.role === 'SELLER' || 
    myStore?.id || 
    (user as any)?.stores?.length > 0 || 
    (user as any)?.isSeller
  );

  // Plus Button (Top Left) - Only displayed for merchants with Seller access
  const leftContent = isSeller ? (
    <button
      onClick={() => setIsCreateSheetOpen(true)}
      className="w-9 h-9 rounded-full bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 flex items-center justify-center text-gray-800 hover:text-[#FF5A36] transition-all shadow-2xs active:scale-95 cursor-pointer group shrink-0"
      title="Create Post, Product or Story"
      aria-label="Create Post, Product or Story"
    >
      <Plus className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[2.5]" />
    </button>
  ) : null;

  // Universal Centered Logo with Maps Nearby Dropdown
  const centerContent = (
    <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
      <div className="relative">
        <button 
          onClick={() => setShowFeedMenu(!showFeedMenu)}
          className="flex items-center gap-1.5 focus:outline-none cursor-pointer group active:scale-98 transition-transform"
          aria-label="Toggle feed and maps nearby menu"
        >
          <Logo className="text-xl sm:text-2xl text-[#171717]" />
          <div className={cn(
            "w-5 h-5 rounded-full bg-gray-100 group-hover:bg-orange-100/70 flex items-center justify-center transition-colors",
            showFeedMenu && "bg-orange-100 text-[#FF5A36]"
          )}>
            <ChevronDown className={cn(
              "w-3.5 h-3.5 text-gray-500 group-hover:text-[#FF5A36] transition-transform duration-200", 
              showFeedMenu && "rotate-180 text-[#FF5A36]"
            )} />
          </div>
        </button>

        {showFeedMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowFeedMenu(false)} 
            />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.14)] border border-gray-100 py-2 w-64 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-1.5 border-b border-gray-100 mb-1 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Navigation</p>
                <span className="text-[10px] font-bold text-[#FF5A36] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A36] animate-pulse" />
                  Hyperlocal
                </span>
              </div>

              <Link
                href="/home"
                onClick={() => setShowFeedMenu(false)}
                className={cn(
                  "w-full text-left px-3.5 py-2.5 text-sm font-semibold flex items-center justify-between transition-colors rounded-xl mx-auto max-w-[calc(100%-8px)]",
                  (pathname === '/home' || pathname === '/')
                    ? "bg-orange-50 text-[#FF5A36] font-bold"
                    : "text-gray-800 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    (pathname === '/home' || pathname === '/') ? "bg-orange-100 text-[#FF5A36]" : "bg-gray-100 text-gray-600"
                  )}>
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">For You Feed</p>
                    <p className="text-[11px] text-gray-400 font-normal">Social feed & reels</p>
                  </div>
                </div>
                {(pathname === '/home' || pathname === '/') && (
                  <Check className="w-4 h-4 text-[#FF5A36] shrink-0" />
                )}
              </Link>

              <Link 
                href="/explore/nearby"
                onClick={() => setShowFeedMenu(false)}
                className={cn(
                  "w-full text-left px-3.5 py-2.5 text-sm font-semibold flex items-center justify-between transition-colors rounded-xl mx-auto max-w-[calc(100%-8px)] mt-1",
                  pathname === '/explore/nearby'
                    ? "bg-orange-50 text-[#FF5A36] font-bold"
                    : "text-gray-800 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold leading-tight">Maps Nearby</p>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded-md">Map</span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-normal">Explore verified stores on map</p>
                  </div>
                </div>
                {pathname === '/explore/nearby' ? (
                  <Check className="w-4 h-4 text-[#FF5A36] shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Right Content: Notifications + Cart (or settings menu on profile)
  const rightContent = (
    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
      <NotificationBell />
      {pathname === '/profile' ? (
        <Link href="/profile/settings" prefetch={false} className="relative text-[#171717] hover:opacity-80 transition-opacity p-0.5" title="Settings">
          <Menu className="w-6 h-6" />
        </Link>
      ) : (
        <Link href="/cart" prefetch={false} className="relative text-[#171717] hover:opacity-80 transition-opacity p-0.5" title="Shopping Cart">
          <ShoppingCart className="w-6 h-6" />
          {cartTotalItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF5A36] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white tabular-nums">
              {cartTotalItems}
            </span>
          )}
        </Link>
      )}
    </div>
  );

  return (
    <>
      <div className={cn(
        "flex items-center justify-between px-4 pt-3.5 pb-2.5 sticky top-0 bg-white/95 backdrop-blur-md z-50 transition-transform duration-300 border-b border-gray-100/80",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}>
        <div className="w-9 h-9 flex items-center justify-start shrink-0">
          {leftContent}
        </div>
        {centerContent}
        <div className="flex items-center shrink-0">
          {rightContent}
        </div>
      </div>

      {/* Universal Create Action Sheet */}
      <CreateUniversalActionSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
        onOpenStoryModal={() => setIsStoryUploadOpen(true)}
      />

      {/* Story Upload Modal */}
      {isStoryUploadOpen && myStore && (
        <StoryUploadModal
          isOpen={isStoryUploadOpen}
          onClose={() => setIsStoryUploadOpen(false)}
          storeId={myStore.id}
          storeName={myStore.storeName || myStore.name || 'My Store'}
          storeLogo={myStore.logoUrl}
        />
      )}
    </>
  );
}
