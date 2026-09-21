'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Package, 
  Store, 
  Wallet, 
  User, 
  ShieldAlert,
  Loader2,
  Navigation,
  ArrowLeft,
  Bike
} from 'lucide-react';
import { useGetDeliveryProfileQuery, useUpdateDeliveryLocationMutation } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const { data: profile, isLoading } = useGetDeliveryProfileQuery(undefined, { skip: !user });
  const [updateLocation] = useUpdateDeliveryLocationMutation();

  const isOnboarding = pathname === '/delivery/onboarding';

  // Real-time GPS Telemetry Watcher
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator && profile && profile.isOnline) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          updateLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }).catch(() => {});
        },
        (err) => console.warn('[GPS Watcher]:', err.message),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [profile?.isOnline, updateLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F6] text-[#171717]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">Loading Lokaya Delivery Portal...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  // If user has no delivery profile and is not on onboarding page, redirect to onboarding
  if (!profile && !isOnboarding && !isLoading) {
    if (typeof window !== 'undefined') router.push('/delivery/onboarding');
    return null;
  }

  // Restrict unverified riders to holding screen on /delivery
  if (profile && profile.status !== 'APPROVED' && !isOnboarding && pathname !== '/delivery') {
    if (typeof window !== 'undefined') router.push('/delivery');
    return null;
  }

  const navItems = [
    { label: 'Home', href: '/delivery', icon: Home },
    { label: 'Orders', href: '/delivery/orders', icon: Package },
    { label: 'Partner Stores', href: '/delivery/partner-stores', icon: Store },
    { label: 'Earnings', href: '/delivery/earnings', icon: Wallet },
    { label: 'Profile', href: '/delivery/profile', icon: User },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-[#171717] pb-24 font-sans">
      {/* Top Delivery Header (Clean Light Lokaya Style) */}
      {!isOnboarding && (
        <header className="sticky top-0 z-30 bg-white border-b border-[#E5E2DC] px-4 py-3.5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="p-2 -ml-1 rounded-full hover:bg-gray-100 text-[#171717] transition-colors"
              title="Return to Lokaya Market"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-[#171717] flex items-center gap-1.5">
                  LOKAYA <span className="text-[#FF5A36] font-black text-xs px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-200">RIDER</span>
                </span>
                {profile?.status === 'APPROVED' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified
                  </span>
                ) : profile?.status === 'REJECTED' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-800 border border-red-200">
                    <ShieldAlert className="w-3 h-3" />
                    Rejected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                    <ShieldAlert className="w-3 h-3" />
                    Pending Review
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6B6B6B] truncate max-w-[200px] mt-0.5 font-medium">
                {profile?.vehicleType || 'Motorcycle'} • {profile?.vehicleNumber || 'Standard'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/delivery/profile"
              className="w-9 h-9 rounded-full bg-[#171717] text-white border border-[#E5E2DC] overflow-hidden flex items-center justify-center font-bold text-xs shadow-xs hover:ring-2 hover:ring-[#FF5A36] transition-all"
            >
              {profile?.selfieUrl ? (
                <img src={profile.selfieUrl} alt="Rider" className="w-full h-full object-cover" />
              ) : (
                (user.name || 'R').charAt(0).toUpperCase()
              )}
            </Link>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto">
        {children}
      </main>

      {/* Bottom Sticky Navigation Dock (Clean Lokaya Design) */}
      {!isOnboarding && profile?.status === 'APPROVED' && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E2DC] px-3 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <div className="max-w-lg mx-auto flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200",
                    isActive
                      ? "text-[#FF5A36] font-black scale-105"
                      : "text-[#888888] hover:text-[#171717] font-medium"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all",
                    isActive && "bg-orange-50 text-[#FF5A36]"
                  )}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
