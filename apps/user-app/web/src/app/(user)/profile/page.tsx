
'use client';

import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { logout } from '@/lib/features/authSlice';
import { ArrowLeft, User, Package, Wallet, MessageCircle, Sun, EyeOff, Book, Heart, FileText, Gift, ChevronRight, LogOut, Store } from 'lucide-react';
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
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Top Banner & Profile Info */}
      <div className="bg-gradient-to-b from-[#fde68a] to-gray-50 pt-4 pb-6 px-3">
        <button 
          onClick={() => router.push('/home')} 
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-6"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800" />
        </button>

        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <User className="w-12 h-12 text-gray-800" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {user?.name || 'Your account'}
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {user?.phone || user?.email || 'No contact info'}
          </p>
        </div>
      </div>

      <div className="px-3 space-y-4 -mt-2">
        {/* Birthday Banner */}
        <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Add your birthday</h3>
            <span className="text-green-600 font-bold text-xs flex items-center gap-1 mt-1">
              Enter details <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div className="text-3xl">🎂</div>
        </div>

        {/* Settings List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-gray-600" />
              <span className="font-bold text-gray-800 text-sm">Appearance</span>
            </div>
            <div className="flex items-center gap-1 text-indigo-600 font-bold text-xs">
              LIGHT <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Information List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm pb-2">
          <div className="flex flex-col">
            <ListItem icon={Package} label="Your orders" onClick={() => router.push('/home/orders')} />
            <ListItem icon={Heart} label="Your wishlist" onClick={() => router.push('/profile/wishlist')} />
            <ListItem icon={Gift} label="E-gift cards" onClick={() => router.push('/profile/egiftcards')} />
            <ListItem icon={MessageCircle} label="Need help?" onClick={() => router.push('/profile/help')} />
            <div className="h-px bg-gray-100 my-1 mx-4"></div>
            <ListItem 
              icon={Store} 
              label={user?.role === 'STORE_PARTNER' ? 'Store Dashboard' : 'Join as a Store Partner'} 
              onClick={() => router.push(user?.role === 'STORE_PARTNER' ? '/store-partner/home' : '/store-partner/onboarding')} 
            />
          </div>
        </div>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl border border-red-100 p-4 shadow-sm flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 transition-colors mt-6"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm">Log Out</span>
        </button>

      </div>
    </div>
  );
}

function ListItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-600" />
        <span className="font-bold text-gray-800 text-sm">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </div>
  );
}

function ChevronDown(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

