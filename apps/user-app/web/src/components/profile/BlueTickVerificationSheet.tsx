'use client';

import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Search, 
  Headphones, 
  Loader2,
  Store
} from 'lucide-react';
import { useRequestStoreVerificationMutation } from '@/lib/api';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/utils';

interface BlueTickVerificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  store: {
    id: string;
    name: string;
    logoUrl?: string;
    category?: string;
  };
}

export function BlueTickVerificationSheet({
  isOpen,
  onClose,
  store
}: BlueTickVerificationSheetProps) {
  const [requestVerification, { isLoading }] = useRequestStoreVerificationMutation();

  if (!isOpen) return null;

  const handleApply = async () => {
    try {
      await requestVerification(store.id).unwrap();
      toast.success('Verification request submitted to Verification Center!', {
        description: 'Our admin team will review your application shortly.'
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to request verification:', err);
      toast.error(err?.data?.message || 'Failed to submit verification request. Please try again.');
    }
  };

  const benefits = [
    {
      icon: <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />,
      bg: 'bg-blue-50 border-blue-100',
      title: 'Official Blue Verification Badge',
      description: 'Display the distinguished blue tick on your seller profile, public storefront, and product cards.'
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />,
      bg: 'bg-emerald-50 border-emerald-100',
      title: '3x Higher Customer Trust & Sales',
      description: 'Buyers feel significantly more confident buying from verified merchants with verified authenticity.'
    },
    {
      icon: <Search className="w-5 h-5 text-purple-500 shrink-0" />,
      bg: 'bg-purple-50 border-purple-100',
      title: 'Priority Search & Explore Discovery',
      description: 'Verified stores rank higher in search listings, local explore maps, and category feeds.'
    },
    {
      icon: <Headphones className="w-5 h-5 text-amber-500 shrink-0" />,
      bg: 'bg-amber-50 border-amber-100',
      title: 'Priority Merchant Protection',
      description: 'Direct priority assistance from the Lokaya merchant support desk and order dispute coverage.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-6 z-10 animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base">Get Blue Tick Verified</h3>
              <p className="text-xs text-gray-500">Official Merchant Verification</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-500 flex items-center justify-center transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
          {/* Live Preview Card */}
          <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-purple-50/60 border border-blue-200/70 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-white border-2 border-blue-400 overflow-hidden shrink-0 shadow-sm relative">
              {store.logoUrl ? (
                <img 
                  src={getMediaUrl(store.logoUrl)} 
                  alt={store.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-[#FF5A36] text-white font-bold flex items-center justify-center text-lg">
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="font-black text-gray-900 text-base truncate">{store.name}</h4>
                <CheckCircle2 className="w-4.5 h-4.5 text-blue-500 fill-blue-500 text-white shrink-0 animate-pulse" />
              </div>
              <p className="text-xs text-blue-700 font-semibold mt-0.5">
                {store.category || 'Local Merchant'} • Official Verified Store
              </p>
              <span className="inline-block text-[10px] text-gray-500 font-medium mt-1">
                Preview of your badge once approved
              </span>
            </div>
          </div>

          {/* Benefits List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 px-1">
              Why Get Verified?
            </h4>

            {benefits.map((b, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50/70 border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${b.bg}`}>
                  {b.icon}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900">{b.title}</h5>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-gray-100 space-y-2 shrink-0">
          <button
            onClick={handleApply}
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting to Verification Center...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                <span>Confirm & Apply for Blue Tick</span>
              </>
            )}
          </button>
          
          <p className="text-center text-[11px] text-gray-500">
            Free merchant verification • Reviewed by Lokaya Verification Center within 1–4 hours
          </p>
        </div>
      </div>
    </div>
  );
}
