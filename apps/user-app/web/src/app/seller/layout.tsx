'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Logo } from "@/components/ui/logo";
import { SellerSidebar, SellerBottomNav } from '@/components/seller/SellerNavigation';
import { FloatingCartBar } from '@/components/cart/FloatingCartBar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: any) => state.auth.user);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  // Don't show navigation on onboarding page
  const isOnboarding = pathname === '/seller/onboarding';

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
        <header className="bg-white border-b border-[#E5E2DC] px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Link href="/home" className="text-[#6B6B6B] hover:text-[#171717] transition-colors p-1 -ml-2 rounded-full hover:bg-gray-100">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <Logo className="text-xl text-[#171717]" />
            <span className="text-[#E5E2DC]">|</span>
            <span className="text-sm font-semibold text-[#6B6B6B] tracking-wide uppercase">Seller Workspace</span>
          </div>
        </header>
        <main className="flex-1 w-full mx-auto px-0 py-0">
          {children}
        </main>
      </div>
    );
  }

  // Only show bottom navigation on root tab screens of the seller workspace
  // All internal pages (hours, settings, add/edit products, categories, details, finance, sub-analytics) hide the footer
  const ROOT_SELLER_TABS = new Set([
    '/seller',
    '/seller/dashboard',
    '/seller/products',
    '/seller/orders',
    '/seller/analytics',
    '/seller/store',
  ]);

  const cleanPath = pathname?.replace(/\/$/, '') || '/seller';
  const isRootTab = ROOT_SELLER_TABS.has(cleanPath);

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <SellerSidebar />
      
      <div className={cn("flex-1 flex flex-col min-w-0 md:pb-0", isRootTab && "pb-20")}>
        <main className="flex-1 w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
      
      {isRootTab && <SellerBottomNav />}
    </div>
  );
}
