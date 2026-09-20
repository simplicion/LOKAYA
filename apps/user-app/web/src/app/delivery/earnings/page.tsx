'use client';

import React from 'react';
import { useGetDeliveryProfileQuery } from '@/lib/api';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  DollarSign, 
  Package, 
  Clock, 
  ShieldCheck, 
  CreditCard,
  Building2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyContext';

export default function DeliveryEarningsPage() {
  const { formatPrice } = useCurrency();
  const { data: profile, isLoading } = useGetDeliveryProfileQuery();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

  const stats = profile?.stats || {
    todayEarnings: 0,
    todayTrips: 0,
    totalDeliveries: profile?.totalDeliveries || 0,
    totalEarnings: profile?.totalEarnings || 0
  };

  return (
    <div className="p-4 space-y-4">
      
      {/* Total Earnings Balance Card (Clean Light Lokaya Theme) */}
      <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50/70 border-2 border-orange-200 text-[#171717] p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between text-[#6B6B6B]">
          <span className="text-xs font-bold uppercase tracking-wider">Total Delivery Earnings</span>
          <div className="p-2 rounded-xl bg-orange-100 text-[#FF5A36]">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#171717]">
            {formatPrice(stats.totalEarnings)}
          </h2>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Instant payouts enabled for every completed delivery</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-orange-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Today</span>
            <p className="text-lg font-black text-[#171717]">{formatPrice(stats.todayEarnings)}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Total Trips</span>
            <p className="text-lg font-black text-[#171717]">{stats.totalDeliveries} orders</p>
          </div>
        </div>
      </div>

      {/* Rider Custom Pricing & Vehicle Economics Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#6B6B6B]">Your Active Delivery Rates</h3>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-[#FF5A36]">
            {profile?.vehicleType || 'BIKE'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Per Km Rate</span>
            <p className="text-lg font-black text-[#171717]">
              {formatPrice(profile?.perKmRate || 8)} <span className="text-xs font-normal text-gray-400">/ km</span>
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">2-Way Round Trip Billed</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Min Base Floor</span>
            <p className="text-lg font-black text-[#171717]">
              {formatPrice(profile?.baseFare || 40)} <span className="text-xs font-normal text-gray-400">min</span>
            </p>
            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Guaranteed per drop</p>
          </div>
        </div>

        {/* 2-Way Round Trip Payout Simulator */}
        <div className="pt-2">
          <span className="text-[11px] font-bold text-gray-700 block mb-2">Estimated Earnings per Trip:</span>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200">
              <span className="text-[10px] text-gray-500 font-bold block">3 km Trip</span>
              <span className="font-black text-sm text-[#FF5A36]">
                {formatPrice(Math.max(profile?.baseFare || 40, 2 * 3 * (profile?.perKmRate || 8)))}
              </span>
              <span className="text-[9px] text-gray-400 block">6 km total</span>
            </div>

            <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200">
              <span className="text-[10px] text-gray-500 font-bold block">5 km Trip</span>
              <span className="font-black text-sm text-[#FF5A36]">
                {formatPrice(Math.max(profile?.baseFare || 40, 2 * 5 * (profile?.perKmRate || 8)))}
              </span>
              <span className="text-[9px] text-gray-400 block">10 km total</span>
            </div>

            <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200">
              <span className="text-[10px] text-gray-500 font-bold block">8 km Trip</span>
              <span className="font-black text-sm text-[#FF5A36]">
                {formatPrice(Math.max(profile?.baseFare || 40, 2 * 8 * (profile?.perKmRate || 8)))}
              </span>
              <span className="text-[9px] text-gray-400 block">16 km total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Structure & Settlement */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#6B6B6B]">Settlement & Payout Schedule</h3>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#171717]">Direct Bank Payout</p>
              <p className="text-[11px] text-[#6B6B6B]">Settled directly to your registered bank account</p>
            </div>
          </div>
          <span className="font-bold text-xs text-[#6B6B6B]">Daily 11:59 PM</span>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#171717]">Automatic Invoicing</p>
              <p className="text-[11px] text-[#6B6B6B]">Itemized receipts for store and merchant partners</p>
            </div>
          </div>
          <span className="font-bold text-xs text-emerald-700">Instant</span>
        </div>
      </div>

      {/* Security & Support Banner */}
      <div className="p-4 rounded-3xl bg-white border border-[#E5E2DC] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#171717]">Guaranteed Payout Protection</h4>
            <p className="text-[10px] text-[#6B6B6B]">Every drop is verified via 4-digit customer OTP code</p>
          </div>
        </div>
      </div>

    </div>
  );
}
