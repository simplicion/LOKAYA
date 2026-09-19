'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, Bell, UserCheck, HelpCircle } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          <h1 className="text-lg font-bold text-[#171717]">Privacy Policy</h1>
        </div>
        <span className="text-xs font-semibold text-[#6B6B6B]">Last updated: Sep 2026</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-4">
        {/* Intro Card */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5A36] flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#171717] mb-2">Your Privacy Matters to Lokaya</h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            At Lokaya, we are committed to safeguarding your personal data, ensuring full transparency in how your location, payment details, and shopping activity are used to empower local commerce.
          </p>
        </div>

        {/* Section 1: Information We Collect */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#171717] font-bold text-base">
            <Database className="w-5 h-5 text-[#FF5A36]" />
            <h3>1. Information We Collect</h3>
          </div>
          <ul className="text-sm text-[#6B6B6B] space-y-2 list-disc pl-5 leading-relaxed">
            <li><strong>Personal Identity:</strong> Your name, phone number, email address, and profile avatar provided during registration.</li>
            <li><strong>Location & Geodata:</strong> Precise device coordinates (with your permission) and OpenStreetMap boundary data to display nearby stores, estimate local delivery radius, and show hyper-local feed content.</li>
            <li><strong>Order & Transaction Records:</strong> Purchased items, delivery addresses, transaction IDs, and receipt history. Financial credentials (UPI, Cards) are processed exclusively through RBI-authorized payment gateways.</li>
            <li><strong>Social Interaction:</strong> Content you publish (posts, reels, stories), user comments, likes, and store following relationships.</li>
          </ul>
        </div>

        {/* Section 2: How We Use Your Data */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#171717] font-bold text-base">
            <Eye className="w-5 h-5 text-[#FF5A36]" />
            <h3>2. How We Use Your Data</h3>
          </div>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            We utilize collected information to facilitate local orders, connect buyers with nearby merchant stores, verify identity, deliver push notifications regarding order states, and continuously improve platform speed and recommendation quality.
          </p>
        </div>

        {/* Section 3: Data Protection & Security */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#171717] font-bold text-base">
            <Lock className="w-5 h-5 text-[#FF5A36]" />
            <h3>3. Data Security & Storage</h3>
          </div>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            All data in transit is encrypted using industry-standard TLS 1.3 encryption. Media assets are chunked and streamed via Cloudflare R2 enterprise storage, and authentication tokens are secured via hardened HTTP-only cookies.
          </p>
        </div>

        {/* Section 4: Your Rights */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#171717] font-bold text-base">
            <UserCheck className="w-5 h-5 text-[#FF5A36]" />
            <h3>4. Your Rights & Choices</h3>
          </div>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            You maintain full rights to inspect, update, or request the deletion of your account and associated social content. You can revoke GPS location permissions at any time via your device settings, defaulting to manual address selection.
          </p>
        </div>

        {/* Contact Support */}
        <div className="bg-[#F2EFE9] rounded-3xl p-5 border border-[#E5E2DC] flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="font-bold text-[#171717] text-sm">Have Questions Regarding Privacy?</h4>
            <p className="text-xs text-[#6B6B6B]">Our data protection and support team is ready to assist you.</p>
          </div>
          <button
            onClick={() => router.push('/profile/help')}
            className="px-4 py-2 bg-[#FF5A36] text-white text-xs font-bold rounded-full shadow-xs hover:bg-[#e04d2d] transition-colors cursor-pointer"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
