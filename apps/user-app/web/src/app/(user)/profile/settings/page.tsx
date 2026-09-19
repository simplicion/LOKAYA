'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout } from '@/lib/features/authSlice';
import { clearCart } from '@/lib/features/cartSlice';
import { 
  ArrowLeft, 
  User, 
  Store, 
  ShieldCheck, 
  Bell, 
  Lock, 
  Package, 
  ShoppingBag, 
  LayoutDashboard, 
  CreditCard, 
  MapPin, 
  ChevronRight, 
  Archive,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SellerSettingsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      // Call backend identity logout to clear HTTP-only cookies
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1'}/identity/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch {}

      dispatch(logout());
      dispatch(clearCart());
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      dispatch(logout());
      dispatch(clearCart());
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => router.back()} className="mr-4 p-1 rounded-full hover:bg-gray-100 active:scale-95 transition-all">
          <ArrowLeft className="w-6 h-6 text-[#171717]" />
        </button>
        <h1 className="text-lg font-bold text-[#171717]">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-12">
        {/* Account Section */}
        <div className="px-4 py-4">
          <h2 className="text-sm font-bold text-gray-500 mb-2 px-2 uppercase tracking-wider">Account</h2>
          <div className="flex flex-col">
            <SettingsItem icon={User} label="My Profile" href="/profile" />
            <SettingsItem icon={Store} label="Store Information" href="/seller/store/settings" />
            <SettingsItem 
              icon={ShieldCheck} 
              label="Verification" 
              rightContent={<span className="text-orange-500 font-medium text-sm">Pending</span>}
              href="/seller/store/settings"
            />
            <SettingsItem icon={Bell} label="Notification Settings" href="/notifications" />
            <SettingsItem icon={Lock} label="Privacy & Security" />
          </div>
        </div>

        {/* Business Section */}
        <div className="px-4 py-4 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-500 mb-2 px-2 uppercase tracking-wider">Business</h2>
          <div className="flex flex-col">
            <SettingsItem icon={Package} label="My Orders" href="/seller/orders" />
            <SettingsItem icon={ShoppingBag} label="My Products" href="/seller/products" />
            <SettingsItem icon={LayoutDashboard} label="Store Management" href="/seller/store/settings" />
            <SettingsItem 
              icon={Archive} 
              label="Stories Archive (30-Day)" 
              href="/profile/archive" 
              rightContent={
                <span className="text-[#FF5A36] font-semibold text-xs bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  Archive
                </span>
              } 
            />
            <SettingsItem icon={CreditCard} label="Payments & Payouts" href="/seller/finance" />
            <SettingsItem icon={MapPin} label="Addresses" href="/seller/store/locations" />
          </div>
        </div>

        {/* Logout Section */}
        <div className="px-4 py-4 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-500 mb-2 px-2 uppercase tracking-wider">Account Actions</h2>
          <div className="flex flex-col">
            <div 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center justify-between py-4 px-2 hover:bg-red-50/70 active:bg-red-100/70 rounded-2xl cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-red-600 text-sm">Log Out</span>
                  <span className="text-[11px] text-gray-400 font-medium">Sign out of your Lokaya account</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-600">
              <LogOut className="w-7 h-7 text-red-600" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Log out of Lokaya?</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                Are you sure you want to log out? You can sign back in at any time with your credentials.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleLogout}
                className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-red-600/20"
              >
                Log Out
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-700 font-bold text-sm rounded-2xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsItem({ icon: Icon, label, href, rightContent }: { icon: any, label: string, href?: string, rightContent?: React.ReactNode }) {
  const content = (
    <div className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
      <div className="flex items-center gap-4">
        <Icon className="w-5 h-5 text-gray-700" />
        <span className="font-semibold text-[#171717]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {rightContent}
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
