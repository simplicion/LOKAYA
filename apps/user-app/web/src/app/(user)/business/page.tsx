'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useGetMyStoreQuery, useGetDeliveryProfileQuery } from '@/lib/api';
import { 
  ArrowLeft, 
  Store, 
  Bike, 
  ChevronRight, 
  CheckCircle2, 
  Zap, 
  TrendingUp, 
  Clock, 
  MapPin, 
  BadgePercent
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BusinessPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: myStore } = useGetMyStoreQuery(undefined, { skip: !user });
  const { data: deliveryProfile } = useGetDeliveryProfileQuery(undefined, { skip: !user });

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 md:pb-12">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E5E2DC] px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-gray-50 border border-[#E5E2DC] flex items-center justify-center text-[#171717] hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-black text-[#171717]">Business with Lokaya</h1>
              <p className="text-[11px] font-medium text-[#6B6B6B]">Merchant & Delivery Partner Hub</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Hero Section */}
        <section className="text-center py-2">
          <h2 className="text-2xl sm:text-4xl font-black text-[#171717] tracking-tight">
            Grow Your Business or Earn with Us
          </h2>
        </section>

        {/* Track 1: Become a Store Seller */}
        <section className="bg-[#F2EFE9] rounded-3xl p-6 sm:p-8 border border-[#E5E2DC] shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-[#FF5A36] text-xs font-extrabold">
                <Store className="w-3.5 h-3.5" />
                <span>FOR MERCHANTS & STORE OWNERS</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-[#FF5A36] tracking-tight">
                {myStore ? 'Your Seller Dashboard' : 'Become a Seller!'}
              </h3>

              <p className="text-xs sm:text-sm text-[#555] leading-relaxed">
                {myStore 
                  ? `Manage your active store ${myStore.name}, update catalog items, review incoming orders, and dispatch to partner riders.`
                  : 'Open your store today and start selling to millions of customers. Tap into neighborhood buyers with automated instant rider dispatches, fair 5% platform commissions, and zero printer requirements.'}
              </p>

              {/* Bullet Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#171717]">
                  <CheckCircle2 className="w-4 h-4 text-[#FF5A36] shrink-0" />
                  <span>15-Minute Instant Store Launch</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#171717]">
                  <CheckCircle2 className="w-4 h-4 text-[#FF5A36] shrink-0" />
                  <span>Assign Online & Offline Riders</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#171717]">
                  <CheckCircle2 className="w-4 h-4 text-[#FF5A36] shrink-0" />
                  <span>Secure 4-Digit Pickup Handshake</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#171717]">
                  <CheckCircle2 className="w-4 h-4 text-[#FF5A36] shrink-0" />
                  <span>Instant Financial Settlement</span>
                </div>
              </div>

              <div className="pt-4">
                {myStore ? (
                  <Link 
                    href="/seller" 
                    className="inline-flex items-center justify-center gap-2 bg-[#FF5A36] text-white px-7 py-3.5 rounded-2xl font-bold text-sm shadow-md hover:bg-[#e04d2d] transition-colors"
                  >
                    <span>Open Seller Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link 
                    href="/seller/onboarding" 
                    className="inline-flex items-center justify-center gap-2 bg-[#FF5A36] text-white px-7 py-3.5 rounded-2xl font-bold text-sm shadow-md hover:bg-[#e04d2d] transition-colors"
                  >
                    <span>Set Up Your Shop Now</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* 3D Visual Block */}
            <div className="w-32 h-32 sm:w-44 sm:h-44 bg-orange-100 rounded-3xl flex items-center justify-center shrink-0 border border-orange-200 relative overflow-hidden self-center md:self-auto">
              <Store className="w-16 sm:w-24 h-16 sm:h-24 text-[#FF5A36] opacity-60" />
              <div className="absolute top-0 w-full h-5 bg-orange-200/80"></div>
              <div className="absolute bottom-3 w-20 sm:w-28 h-10 sm:h-12 bg-orange-300/80 rounded-xl mx-auto left-0 right-0"></div>
            </div>
          </div>
        </section>

        {/* Track 2: Join as Delivery Partner */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E2DC] shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-100">
                <Bike className="w-3.5 h-3.5" />
                <span>EARN WITH LOKAYA FLEET</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
                {deliveryProfile ? 'Your Rider Portal' : 'Join as Delivery Partner!'}
              </h3>

              <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed">
                {deliveryProfile
                  ? 'Access your incoming assignment queue, view active deliveries, and manage your daily wallet payouts.'
                  : 'Deliver orders for nearby shops with flexible hours and instant payouts. Earn 2-way delivery payouts for round-trip travel, backed by dynamic country fuel benchmark floors.'}
              </p>

              {/* Bullet Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#171717]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>2-Way Round-Trip Delivery Payouts</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#171717]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dynamic Fuel Rate Floor Protection</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#171717]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bike, Scooter, Cycle, or Walker</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#171717]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant Wallet Credit Per Drop</span>
                </div>
              </div>

              <div className="pt-4">
                {deliveryProfile ? (
                  <Link 
                    href="/delivery" 
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-7 py-3.5 rounded-2xl font-bold text-sm shadow-md hover:bg-slate-800 transition-colors"
                  >
                    <span>Open Delivery Portal</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link 
                    href="/delivery/onboarding" 
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-7 py-3.5 rounded-2xl font-bold text-sm shadow-md hover:bg-slate-800 transition-colors"
                  >
                    <span>Apply as Delivery Partner</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Visual Block */}
            <div className="w-32 h-32 sm:w-44 sm:h-44 bg-emerald-50 rounded-3xl flex items-center justify-center shrink-0 border border-emerald-100 self-center md:self-auto">
              <Bike className="w-16 sm:w-24 h-16 sm:h-24 text-emerald-600" />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
