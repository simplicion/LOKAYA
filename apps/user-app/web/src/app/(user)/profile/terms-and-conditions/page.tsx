'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, CheckCircle2, RotateCcw, Store, AlertCircle, Scale } from 'lucide-react';

export default function TermsAndConditionsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-50 px-4 py-3.5 border-b border-[#E5E2DC] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => router.back()} 
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#171717] hover:bg-gray-100 active:scale-95 transition-all -ml-1 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
          </button>
          <h1 className="text-lg font-bold text-[#171717]">Terms & Conditions</h1>
        </div>
        <span className="text-xs font-semibold text-[#6B6B6B]">Version 2.4</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-4">
        {/* Intro Card */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5A36] flex items-center justify-center mb-3">
            <Scale className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#171717] mb-2">Platform Terms of Service</h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            Welcome to Lokaya. By accessing or using our hyper-local e-commerce marketplace and social discovery features, you agree to comply with and be bound by the following terms.
          </p>
        </div>

        {/* Section 1: Marketplace Operation */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#171717] font-bold text-base">
            <Store className="w-5 h-5 text-[#FF5A36]" />
            <h3>1. Marketplace Role & Merchants</h3>
          </div>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            Lokaya provides a technology bridge enabling independent sellers to manage physical storefronts, list inventory, and fulfill deliveries to local customers. Each merchant is responsible for their product accuracy, pricing, and fulfillment speed.
          </p>
        </div>

        {/* Section 2: Orders, Pricing & Payments */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#171717] font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-[#FF5A36]" />
            <h3>2. Orders, Pricing & Checkout</h3>
          </div>
          <ul className="text-sm text-[#6B6B6B] space-y-2 list-disc pl-5 leading-relaxed">
            <li>All product prices are quoted in INR and include applicable Goods and Services Tax (GST) unless otherwise explicitly specified.</li>
            <li>Orders are confirmed upon successful payment verification or Cash on Delivery approval by the seller.</li>
            <li>Stores reserve the right to cancel orders due to sudden stock depletion or delivery area non-serviceability with automatic customer refund.</li>
          </ul>
        </div>

        {/* Section 3: Returns & Refunds */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#171717] font-bold text-base">
            <RotateCcw className="w-5 h-5 text-[#FF5A36]" />
            <h3>3. Returns, Cancellations & Disputes</h3>
          </div>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            Eligible products may be returned within the designated return window specified on the product page. If a discrepancy arises regarding quality or damaged delivery, buyers can raise a support ticket via the Help & Support center for immediate arbitration.
          </p>
        </div>

        {/* Section 4: Social Community Guidelines */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#171717] font-bold text-base">
            <AlertCircle className="w-5 h-5 text-[#FF5A36]" />
            <h3>4. Content & Community Conduct</h3>
          </div>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            Users are solely responsible for media shared via posts, reels, and stories. Defamatory content, spam, fraudulent listings, and copyright violations will lead to immediate content removal and potential account suspension.
          </p>
        </div>

        {/* Contact Support */}
        <div className="bg-[#F2EFE9] rounded-3xl p-5 border border-[#E5E2DC] flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="font-bold text-[#171717] text-sm">Need Help with Our Terms?</h4>
            <p className="text-xs text-[#6B6B6B]">Raise a ticket or speak with our support representatives.</p>
          </div>
          <button
            onClick={() => router.push('/profile/help')}
            className="px-4 py-2 bg-[#FF5A36] text-white text-xs font-bold rounded-full shadow-xs hover:bg-[#e04d2d] transition-colors cursor-pointer"
          >
            Help & Support
          </button>
        </div>
      </div>
    </div>
  );
}
