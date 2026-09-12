'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Store, ShieldCheck, Bell, Lock, Package, ShoppingBag, LayoutDashboard, CreditCard, MapPin, ChevronRight, Archive } from 'lucide-react';
import Link from 'next/link';

export default function SellerSettingsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="w-6 h-6 text-[#171717]" />
        </button>
        <h1 className="text-lg font-bold text-[#171717]">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Account Section */}
        <div className="px-4 py-4">
          <h2 className="text-sm font-bold text-gray-500 mb-2 px-2 uppercase tracking-wider">Account</h2>
          <div className="flex flex-col">
            <SettingsItem icon={User} label="My Profile" />
            <SettingsItem icon={Store} label="Store Information" />
            <SettingsItem 
              icon={ShieldCheck} 
              label="Verification" 
              rightContent={<span className="text-orange-500 font-medium text-sm">Pending</span>}
            />
            <SettingsItem icon={Bell} label="Notification Settings" />
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
            <SettingsItem icon={Archive} label="Stories Archive (30-Day)" href="/profile/archive" rightContent={<span className="text-[#FF5A36] font-semibold text-xs bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">Archive</span>} />
            <SettingsItem icon={CreditCard} label="Payments & Payouts" href="/seller/finance" />
            <SettingsItem icon={MapPin} label="Addresses" href="/seller/store/locations" />
          </div>
        </div>
      </div>
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
