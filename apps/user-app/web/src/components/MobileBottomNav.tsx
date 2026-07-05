'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, QrCode, ShoppingCart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

export function MobileBottomNav() {
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  
  if (!user) return null;

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/buyer/scan', label: 'Scan', icon: QrCode },
    { href: '/buyer/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around border-t bg-white pb-safe dark:bg-gray-950 md:hidden">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        
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
