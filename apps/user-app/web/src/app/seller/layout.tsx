'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Seller Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <span className="text-xl font-black text-indigo-600 tracking-tight">snapick</span>
          <span className="text-gray-400">|</span>
          <span className="text-sm font-semibold text-gray-700 tracking-wide uppercase">Seller Workspace</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
