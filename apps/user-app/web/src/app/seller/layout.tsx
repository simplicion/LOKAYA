'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Logo } from "@/components/ui/logo";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: any) => state.auth.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      {/* Seller Top Navigation Bar */}
      <header className="bg-white border-b border-[#E5E2DC] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Logo className="text-xl text-[#171717]" />
          <span className="text-[#E5E2DC]">|</span>
          <span className="text-sm font-semibold text-[#6B6B6B] tracking-wide uppercase">Seller Workspace</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-0 md:px-6 py-4 md:py-6">
        {children}
      </main>
    </div>
  );
}
