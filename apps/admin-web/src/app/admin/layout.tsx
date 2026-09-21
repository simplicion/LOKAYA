'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { logout } from '@/lib/features/authSlice';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Store, PackageCheck, Users, LogOut, Sparkles, Ticket, Headphones, Bike } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'SYSTEM_ADMIN') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'SYSTEM_ADMIN') {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="h-16 flex items-center px-5 border-b justify-between">
          <Logo className="text-xl" />
          <span className="text-[10px] font-bold tracking-wider uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Admin</span>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/stores">
            <Button variant="ghost" className="w-full justify-start">
              <Store className="mr-2 h-4 w-4" />
              Store Verification
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" className="w-full justify-start text-indigo-600 font-semibold hover:text-indigo-700 hover:bg-indigo-50">
              <PackageCheck className="mr-2 h-4 w-4" />
              Product Verification
            </Button>
          </Link>
          <Link href="/admin/riders">
            <Button variant="ghost" className="w-full justify-start text-teal-600 font-semibold hover:text-teal-700 hover:bg-teal-50">
              <Bike className="mr-2 h-4 w-4" />
              Rider Verification
            </Button>
          </Link>
          <Link href="/admin/ecommerce">
            <Button variant="ghost" className="w-full justify-start text-orange-600 font-semibold hover:text-orange-700 hover:bg-orange-50">
              <Sparkles className="mr-2 h-4 w-4" />
              E-Commerce Control
            </Button>
          </Link>
          <Link href="/admin/coupons">
            <Button variant="ghost" className="w-full justify-start text-emerald-600 font-semibold hover:text-emerald-700 hover:bg-emerald-50">
              <Ticket className="mr-2 h-4 w-4" />
              Coupons & Promos
            </Button>
          </Link>
          <Link href="/admin/support">
            <Button variant="ghost" className="w-full justify-start text-blue-600 font-semibold hover:text-blue-700 hover:bg-blue-50">
              <Headphones className="mr-2 h-4 w-4" />
              Support Tickets
            </Button>
          </Link>
          <Link href="/admin/reviews">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Reviews
            </Button>
          </Link>
          <Link href="/admin/content">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Content Moderation
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Users
            </Button>
          </Link>
        </nav>
        
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              dispatch(logout());
              router.push('/login');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
