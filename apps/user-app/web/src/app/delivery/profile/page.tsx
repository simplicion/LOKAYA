'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { logout } from '@/lib/features/authSlice';
import { clearCart } from '@/lib/features/cartSlice';
import { 
  useGetDeliveryProfileQuery, 
  useUpdateDeliveryPricingMutation, 
  useGetPricingBenchmarksQuery 
} from '@/lib/api';
import { 
  User, 
  Bike, 
  Phone, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  LogOut, 
  Store, 
  ChevronRight, 
  FileText, 
  Camera, 
  Loader2,
  Car,
  Flame,
  Banknote,
  DollarSign,
  Save,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DeliveryProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { formatPrice, currencySymbol: localCurrencySymbol } = useCurrency();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: profile, isLoading, refetch } = useGetDeliveryProfileQuery();
  const { data: benchmarkData } = useGetPricingBenchmarksQuery();
  const [updatePricing, { isLoading: isUpdatingPricing }] = useUpdateDeliveryPricingMutation();

  const [perKmRate, setPerKmRate] = useState<number>(8.0);
  const [isCustomPricingEnabled, setIsCustomPricingEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (profile) {
      if ((profile as any).perKmRate !== undefined) setPerKmRate((profile as any).perKmRate);
      if ((profile as any).isCustomPricingEnabled !== undefined) setIsCustomPricingEnabled((profile as any).isCustomPricingEnabled);
    }
  }, [profile]);

  const currencySym = benchmarkData?.benchmark?.currencySymbol || localCurrencySymbol || '₹';
  const minFloor = benchmarkData?.floors?.[profile?.vehicleType || 'MOTORCYCLE'] || 3.0;

  const handleSavePricing = async () => {
    if (perKmRate < minFloor) {
      toast.error(`Per-km rate cannot be lower than the live fuel floor of ${currencySym}${minFloor}/km.`);
      return;
    }

    try {
      await updatePricing({ perKmRate, isCustomPricingEnabled }).unwrap();
      toast.success('🎉 Delivery rate updated successfully!');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update pricing');
    }
  };

  const handleLogout = async () => {
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
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

  const isVerified = profile?.status === 'APPROVED';

  return (
    <div className="p-4 space-y-4">
      
      {/* Identity Profile Header */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#171717] text-white font-black text-xl flex items-center justify-center overflow-hidden border-2 border-[#E5E2DC] shrink-0">
            {profile?.selfieUrl ? (
              <img src={profile.selfieUrl} alt="Rider" className="w-full h-full object-cover" />
            ) : (
              (user?.name || 'R').charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base font-black text-[#171717] truncate">{user?.name}</h2>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  Pending Review
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">{user?.phone || 'No phone'}</p>
            <p className="text-[11px] text-[#6B6B6B] truncate">{user?.email || 'No email'}</p>
          </div>
        </div>

        {/* Operating Area */}
        <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#E5E2DC] flex items-center gap-2.5 text-xs text-[#171717]">
          <MapPin className="w-4 h-4 text-[#FF5A36] shrink-0" />
          <span className="truncate">{profile?.locationArea || 'Hyperlocal Delivery Zone'}</span>
        </div>
      </div>

      {/* Pricing & Rates Management Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5A36] flex items-center justify-center border border-orange-100">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">Your Custom Rate</h3>
              <p className="text-[10px] text-[#6B6B6B]">Set your earnings per kilometer</p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Min Fuel Floor: {currencySym}{minFloor}/km
          </span>
        </div>

        {/* Per-Km Rate Input */}
        <div>
          <label className="text-[11px] font-bold text-[#171717] block mb-1">
            Rate Per Km ({currencySym}/km)
          </label>
          <input
            type="number"
            step="0.5"
            min={minFloor}
            value={perKmRate}
            onChange={(e) => setPerKmRate(Number(e.target.value))}
            className="w-full h-11 px-3.5 rounded-xl border border-[#E5E2DC] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] font-black text-base"
          />
        </div>

        {/* Platform Base Fare Guarantee Banner */}
        <div className="p-3.5 bg-gradient-to-r from-orange-50/80 via-amber-50/60 to-emerald-50/60 rounded-2xl border border-orange-200 flex items-start gap-2.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-black text-[#171717]">
              Platform Minimum Trip Floor: <span className="text-[#FF5A36]">{formatPrice(50)}</span>
            </p>
            <p className="text-[10px] text-gray-600 leading-relaxed">
              Every trip is automatically protected by the platform minimum base fare ({formatPrice(50)}), calibrated to your operating country currency.
            </p>
          </div>
        </div>

        <Button
          onClick={handleSavePricing}
          disabled={isUpdatingPricing}
          className="w-full h-11 rounded-xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isUpdatingPricing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Save Rate Changes</span>
        </Button>
      </div>


      {/* Vehicle Profile Details */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">Registered Delivery Vehicle</h3>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF5A36] flex items-center justify-center font-bold border border-orange-100">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#171717]">{profile?.vehicleType || 'MOTORCYCLE'}</p>
              <p className="text-xs font-mono font-bold text-[#6B6B6B] uppercase mt-0.5">
                {profile?.vehicleNumber || 'DL 01 AB 1234'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            Active
          </span>
        </div>
      </div>

      {/* 4 KYC Upload Status Summary */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B]">KYC Verification Documents</h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-[#171717] truncate">1. Rider Selfie</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-[#171717] truncate">2. Government ID</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-[#171717] truncate">3. Vehicle Photo</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-[#171717] truncate">4. Vehicle RC Doc</span>
          </div>
        </div>
      </div>

      {/* Navigation & Logout Actions */}
      <div className="space-y-2 pt-2">
        <Link
          href="/home"
          className="w-full h-12 rounded-2xl bg-white border border-[#E5E2DC] hover:bg-gray-50 text-[#171717] font-bold text-xs flex items-center justify-between px-4 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#FF5A36]" />
            <span>Switch to Customer Marketplace</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#6B6B6B]" />
        </Link>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Delivery Partner</span>
        </Button>
      </div>

    </div>
  );
}
