'use client';

import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { logout } from '@/lib/features/authSlice';
import { 
  Bell, 
  Camera, 
  ChevronRight,
  Wallet,
  CheckCircle,
  Package,
  MapPin,
  CreditCard,
  Star,
  Heart,
  Clock,
  Store,
  LayoutDashboard,
  Headphones,
  ShieldCheck,
  FileText,
  LogOut,
  ShoppingBag,
  XCircle,
  RotateCcw,
  Users
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] pb-24 md:pb-8">
      <div className="px-4 space-y-4 max-w-5xl mx-auto w-full pt-4">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E5E2DC] relative">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                <Image 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80" 
                  alt="Profile Avatar" 
                  width={80} 
                  height={80} 
                  className="object-cover w-full h-full"
                />
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 text-[#171717]">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-[#171717]">
                {user?.name || 'PRINCE'}
              </h2>
              <p className="text-sm font-medium text-[#6B6B6B] mt-0.5">
                @{(user as any)?.username || 'prince123'}
              </p>
            </div>
          </div>
        </div>

        {/* Seller Promo */}
        <div className="bg-[#F2EFE9] rounded-3xl p-5 border border-[#E5E2DC] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="pr-4">
              <h3 className="font-bold text-[#FF5A36] text-lg mb-1">You're a Seller!</h3>
              <p className="text-sm text-[#6B6B6B] font-medium mb-4">
                Manage your store, products, orders and more.
              </p>
            </div>
            {/* 3D Store Illustration Placeholder */}
            <div className="w-24 h-24 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
               <Store className="w-12 h-12 text-[#FF5A36] opacity-50" />
               {/* Decorative elements to mimic 3D */}
               <div className="absolute top-0 w-full h-4 bg-orange-200"></div>
               <div className="absolute bottom-2 w-16 h-8 bg-orange-300 rounded mx-auto left-0 right-0"></div>
            </div>
          </div>

          {/* Nested Store Card */}
          <Link href="/seller" className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#171717] rounded-full flex items-center justify-center text-white font-bold">
                  UT
                </div>
                <div>
                  <h4 className="font-bold text-[#171717] text-sm">Urban Threads</h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-[#171717]">4.8</span>
                    <span className="text-xs text-[#999999]">(1.2k)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center text-[#FF5A36]">
                <span className="text-xs font-bold">Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="bg-[#FAF9F6] rounded-xl p-2 flex flex-col items-center justify-center text-center">
                <ShoppingBag className="w-4 h-4 text-[#6B6B6B] mb-1" strokeWidth={1.5} />
                <span className="text-xs font-bold text-[#171717]">32</span>
                <span className="text-[9px] text-[#6B6B6B] font-medium">Products</span>
              </div>
              <div className="bg-[#FAF9F6] rounded-xl p-2 flex flex-col items-center justify-center text-center">
                <Package className="w-4 h-4 text-[#6B6B6B] mb-1" strokeWidth={1.5} />
                <span className="text-xs font-bold text-[#171717]">18</span>
                <span className="text-[9px] text-[#6B6B6B] font-medium">Orders</span>
              </div>
              <div className="bg-[#FAF9F6] rounded-xl p-2 flex flex-col items-center justify-center text-center">
                <Wallet className="w-4 h-4 text-[#6B6B6B] mb-1" strokeWidth={1.5} />
                <span className="text-[11px] font-bold text-[#171717]">₹45.6k</span>
                <span className="text-[9px] text-[#6B6B6B] font-medium">Revenue</span>
              </div>
              <div className="bg-[#FAF9F6] rounded-xl p-2 flex flex-col items-center justify-center text-center">
                <Users className="w-4 h-4 text-[#6B6B6B] mb-1" strokeWidth={1.5} />
                <span className="text-xs font-bold text-[#171717]">850</span>
                <span className="text-[9px] text-[#6B6B6B] font-medium">Customers</span>
              </div>
            </div>
          </Link>
        </div>

        {/* My Orders Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E5E2DC]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[#171717]">My Orders</h3>
            <button className="text-[#FF5A36] text-sm font-semibold flex items-center gap-1">
              View All Orders <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex justify-between items-center text-center overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex flex-col items-center gap-2 min-w-[70px]">
              <div className="relative">
                <Package className="w-7 h-7 text-[#171717]" strokeWidth={1.5} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5A36] text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                  2
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#171717]">Ordered</span>
            </div>
            <div className="flex flex-col items-center gap-2 min-w-[70px]">
              <CheckCircle className="w-7 h-7 text-[#171717]" strokeWidth={1.5} />
              <span className="text-[11px] font-medium text-[#6B6B6B]">Delivered</span>
            </div>
            <div className="flex flex-col items-center gap-2 min-w-[70px]">
              <XCircle className="w-7 h-7 text-[#171717]" strokeWidth={1.5} />
              <span className="text-[11px] font-medium text-[#6B6B6B]">Cancelled</span>
            </div>
            <div className="flex flex-col items-center gap-2 min-w-[70px]">
              <RotateCcw className="w-7 h-7 text-[#171717]" strokeWidth={1.5} />
              <span className="text-[11px] font-medium text-[#6B6B6B]">Returned</span>
            </div>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E2DC] overflow-hidden mb-4">
          <h3 className="font-bold text-[#171717] p-5 pb-2">Quick Links</h3>
          <div className="flex flex-col">
            <QuickLinkItem icon={MapPin} label="My Addresses" />
            <QuickLinkItem icon={CreditCard} label="Payment Methods" />
            <QuickLinkItem icon={Star} label="My Reviews" />
            <QuickLinkItem icon={Heart} label="Wishlist" />
            <QuickLinkItem icon={Clock} label="Recently Viewed" />
            <QuickLinkItem icon={Store} label="Followed Stores" borderBottom={false} />
          </div>
        </div>

        {/* Footer Links Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E2DC] overflow-hidden mb-6">
          <div className="flex flex-col">
            <QuickLinkItem icon={Bell} label="Notifications" />
            <QuickLinkItem icon={Headphones} label="Help & Support" />
            <QuickLinkItem icon={ShieldCheck} label="Privacy Policy" />
            <QuickLinkItem icon={FileText} label="Terms & Conditions" />
            
            <div 
              onClick={handleLogout}
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <LogOut className="w-5 h-5 text-[#FF5A36]" strokeWidth={1.5} />
                <span className="font-bold text-[#FF5A36] text-sm">Log Out</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function QuickLinkItem({ icon: Icon, label, borderBottom = true }: { icon: any, label: string, borderBottom?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${borderBottom ? 'border-b border-gray-100' : ''}`}>
      <div className="flex items-center gap-4">
        <Icon className="w-5 h-5 text-[#171717]" strokeWidth={1.5} />
        <span className="font-bold text-[#171717] text-sm">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  );
}
