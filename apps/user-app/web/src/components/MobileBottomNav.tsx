'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, PlaySquare, ShoppingCart, User, Compass } from 'lucide-react';
import { cn, getMediaUrl } from '@/lib/utils';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { useState, useEffect } from 'react';
import { api, useGetMyStoreQuery } from '@/lib/api';

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const cart = useSelector((state: RootState) => state.cart);
  const cartTotalItems = Object.values(cart.items).reduce((sum, item) => sum + item.quantity, 0);

  const { data: myStore } = useGetMyStoreQuery(undefined, { skip: !user });
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl, myStore?.logoUrl]);

  const avatarSrc = user?.avatarUrl || myStore?.logoUrl;

  const handleTabPrefetch = (href: string) => {
    try {
      if (href === '/explore') {
        dispatch(api.util.prefetch('getPublicProducts', { sort: 'newest' }, { ifOlderThan: 120 }) as any);
        dispatch(api.util.prefetch('getBanners', undefined, { ifOlderThan: 120 }) as any);
      } else if (href === '/home/reels') {
        dispatch(api.util.prefetch('getReels', undefined, { ifOlderThan: 120 }) as any);
      } else if (href === '/home') {
        dispatch(api.util.prefetch('getPosts', undefined, { ifOlderThan: 120 }) as any);
      }
    } catch {}
  };
  const hideOnRoutes = [
    '/checkout',
    '/orders',
    '/seller',
    '/cart',
    '/notifications',
    '/wishlist',
    '/home/reels',
    '/explore/nearby',
    '/product',
    '/store',
    '/profile/',
    '/home/checkout',
    '/home/product',
    '/home/store',
    '/home/orders'
  ];
  const shouldHideCompletely = hideOnRoutes.some(route => pathname === route || pathname?.startsWith(route));

  if (shouldHideCompletely) return null;

  const links = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/home/reels', label: 'Reels', icon: PlaySquare },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/profile', label: 'Account', icon: User },
  ];

  return (
    <>
      {/* Spacer to prevent content from hiding behind the fixed nav */}
      <div className="h-24 w-full md:hidden" />
      <nav 
        aria-label="Bottom Navigation"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around border-t border-[#E5E2DC] bg-[#FFFFFF] pb-safe transition-transform duration-300 md:hidden",
          "translate-y-0"
        )}
      >
        {links.map((link) => {
        const Icon = link.icon;
        const isProfileTab = link.href === '/profile';
        const showProfileAvatar = isProfileTab && Boolean(user);
        const targetHref = isProfileTab && !user ? '/login?redirect=/profile' : link.href;
        let isActive = false;
        if (link.href === '/home') {
          isActive = pathname === '/home' || pathname === '/';
        } else if (link.href === '/search') {
          isActive = pathname === '/search' || pathname?.startsWith('/search');
        } else if (link.href === '/explore') {
          isActive = pathname === '/explore' || pathname?.startsWith('/explore/category');
        } else if (link.href === '/profile') {
          isActive = (pathname === '/profile' || pathname?.startsWith('/profile/')) && Boolean(user);
        } else {
          isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
        }

        const isAuthRedirect = targetHref.includes('?');

        const handleClick = (e: React.MouseEvent) => {
          if (link.href === '/profile' && !user) {
            e.preventDefault();
            router.push(targetHref);
          }
        };
        
        return (
          <Link
            key={link.href}
            href={targetHref}
            prefetch={!isAuthRedirect}
            onClick={handleClick}
            onMouseEnter={() => handleTabPrefetch(targetHref)}
            onTouchStart={() => handleTabPrefetch(targetHref)}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full relative transition-all duration-300",
              isActive ? "text-[#FF5A36]" : "text-[#8E8E93] hover:text-[#171717]"
            )}
          >
            <div className={cn(
              "relative flex items-center justify-center w-[46px] h-8 rounded-2xl transition-all duration-300 ease-out",
              isActive 
                ? (showProfileAvatar ? "scale-105" : "bg-[#FF5A36]/15 scale-110") 
                : "bg-transparent scale-100"
            )}>
              {showProfileAvatar ? (
                <div className={cn(
                  "w-7 h-7 rounded-full overflow-hidden transition-all duration-200 border flex items-center justify-center bg-orange-100/70 shrink-0",
                  isActive 
                    ? "ring-2 ring-[#FF5A36] ring-offset-1.5 border-[#FF5A36] shadow-xs" 
                    : "border-gray-200 hover:border-gray-400"
                )}>
                  {avatarSrc && !avatarError ? (
                    <img
                      src={getMediaUrl(avatarSrc)}
                      alt={user?.name || myStore?.name || "Profile"}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span className="text-xs font-bold text-[#FF5A36] select-none">
                      {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4 text-gray-500" />}
                    </span>
                  )}
                </div>
              ) : (
                <Icon 
                  className={cn("h-[22px] w-[22px] transition-transform duration-300")} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              )}
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
    </nav>
    </>
  );
}

