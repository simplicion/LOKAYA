'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  ShieldAlert, 
  Ban, 
  Heart, 
  CheckCircle, 
  AlertTriangle, 
  Flag, 
  UserX,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { ComplianceLayout } from '@/components/compliance/ComplianceLayout';

export default function CommunityGuidelinesPage() {
  return (
    <ComplianceLayout
      title="Community Guidelines & UGC Standards"
      subtitle="Fostering a safe, inspiring, and authentic social commerce ecosystem where creators, local store owners, and shoppers interact with mutual trust."
      lastUpdated="September 24, 2026"
      badgeText="Google Play Social Policy Compliant"
    >
      {/* Intro */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2>Our Core Community Mission</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          At Lokaya, our motto is <strong>&quot;See It. Know It. Buy It.&quot;</strong> We celebrate genuine neighborhood stories, authentic product demonstrations, and real shopping discoveries. These Community Guidelines apply to all media formats, including product reels, feed posts, live broadcasts, product reviews, and direct merchant interactions.
        </p>
      </section>

      {/* Prohibited Content */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5" />
          </div>
          <h2>Strictly Prohibited Content & Behaviors</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          The following violations will result in immediate content removal, account suspension, and possible referral to law enforcement agencies:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 space-y-1.5">
            <strong className="text-xs font-bold text-red-900 block">1. Nudity & Sexually Explicit Media</strong>
            <p className="text-xs text-red-800/80 leading-relaxed">Zero tolerance for pornography, sexual solicitation, or suggestive content involving minors (CSAM/CSAE).</p>
          </div>

          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 space-y-1.5">
            <strong className="text-xs font-bold text-red-900 block">2. Hate Speech & Harassment</strong>
            <p className="text-xs text-red-800/80 leading-relaxed">Attacks based on religion, caste, gender, sexual orientation, disability, or targeted cyber-bullying.</p>
          </div>

          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 space-y-1.5">
            <strong className="text-xs font-bold text-red-900 block">3. Counterfeit & Prohibited Goods</strong>
            <p className="text-xs text-red-800/80 leading-relaxed">Selling counterfeit branded items, prescription narcotics, firearms, fireworks, or hazardous substances.</p>
          </div>

          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 space-y-1.5">
            <strong className="text-xs font-bold text-red-900 block">4. Deceptive Marketing & Fake Reviews</strong>
            <p className="text-xs text-red-800/80 leading-relaxed">Paid or fabricated customer testimonials, bait-and-switch pricing, and artificial engagement manipulation.</p>
          </div>
        </div>
      </section>

      {/* Safety Mechanisms */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#172554]/10 text-[#172554] flex items-center justify-center shrink-0">
            <Flag className="w-5 h-5" />
          </div>
          <h2>User Protection & Reporting Tools</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Every member of the Lokaya community has continuous access to safety controls:
        </p>

        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F5F3EF] border border-[#E7E5E0]">
            <Flag className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="text-[#172554]">Instant In-App Reporting</strong>
              <p className="text-[#64748B] leading-relaxed">
                Tap the three-dots (⋯) on any reel, product card, or seller profile to submit an anonymous violation report. Our AI-assisted review queue prioritizes reports for human audit within 24 hours.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F5F3EF] border border-[#E7E5E0]">
            <UserX className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="text-[#172554]">Immediate User Blocking</strong>
              <p className="text-[#64748B] leading-relaxed">
                Block any creator, shopper, or store at any time. Blocked parties cannot message you, see your posts, or comment on your public reviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seller Best Practices */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h2>Seller Code of Ethics</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Registered merchants must deliver authentic merchandise matching the visual reel depictions, honor advertised discounts, package items securely for local transit, and treat customer inquiries with utmost courtesy and speed.
        </p>
      </section>
    </ComplianceLayout>
  );
}
