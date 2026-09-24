'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Scale, 
  Store, 
  CheckCircle2, 
  RotateCcw, 
  AlertCircle, 
  ShieldCheck, 
  Ban, 
  Truck, 
  CreditCard,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { ComplianceLayout } from '@/components/compliance/ComplianceLayout';

export default function TermsAndConditionsPage() {
  return (
    <ComplianceLayout
      title="Terms of Service & Platform Conditions"
      subtitle="The binding contractual agreement governing usage of the Lokaya social discovery and local commerce platform by consumers, sellers, and community creators."
      lastUpdated="September 24, 2026"
      badgeText="Platform Terms v2.4 (IT Act Compliant)"
    >
      {/* 1. Introduction */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <h2>1. Agreement to Terms</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          These Terms of Service constitute a legally binding agreement between you and <strong>Lokaya Technologies Private Limited</strong> governing your access to and use of the Lokaya mobile software application (Android package: <code className="font-mono text-[#172554] bg-[#F5F3EF] px-1.5 py-0.5 rounded">app.lokaya.shop</code>) and web services at <a href="https://lokaya.shop" className="text-[#172554] font-semibold underline">lokaya.shop</a>.
        </p>
        <p className="text-sm text-[#64748B] leading-relaxed">
          By registering, downloading, browsing, or transacting on Lokaya, you signify acceptance of these Terms and our Privacy Policy. If you do not agree, you must immediately cease usage and uninstall the application.
        </p>
      </section>

      {/* 2. Nature of Platform */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#172554]/10 text-[#172554] flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <h2>2. Marketplace Intermediary Role</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Lokaya operates as an electronic intermediary marketplace under Section 79 of the Information Technology Act, 2000. Lokaya connects independent neighborhood retail merchants (&quot;Sellers&quot;), freelance delivery couriers (&quot;Delivery Partners&quot;), and end-consumers (&quot;Buyers&quot;).
        </p>
        <ul className="text-sm text-[#64748B] space-y-2 list-disc pl-5 leading-relaxed pt-1">
          <li>Merchants are independent entities directly responsible for product manufacturing, quality assurance, merchant warranty, pricing, and stock accuracy.</li>
          <li>Commercial sales contracts are entered directly between the Buyer and the respective Seller.</li>
          <li>Lokaya facilitates payment aggregation, digital catalog display, and localized logistics routing.</li>
        </ul>
      </section>

      {/* 3. User-Generated Content (UGC) & Social Reels Policy */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h2>3. User-Generated Content (UGC) & Safety (Play Store Compliance)</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Lokaya allows users and merchants to post video reels, photos, comments, and reviews. In strict accordance with Google Play Developer Policies on User-Generated Content, the following rules are non-negotiable:
        </p>

        <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 space-y-2 text-xs text-red-900">
          <div className="flex items-center gap-1.5 font-bold">
            <Ban className="w-4 h-4 text-red-600" />
            <span>Strict Zero Tolerance for Objectionable Content:</span>
          </div>
          <p className="leading-relaxed">
            You may not post content that contains sexual explicit imagery, violence, hate speech, bullying, defamation, illegal weapons, narcotics, counterfeit goods, or intellectual property infringement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E7E5E0] text-xs space-y-1">
            <strong className="text-[#172554] block">In-App Reporting Mechanism</strong>
            <p className="text-[#64748B]">Every post, reel, and comment features an instant Report button (&quot;Flag Content&quot;). Our automated and human moderation team reviews reports within 24 hours.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F5F3EF] border border-[#E7E5E0] text-xs space-y-1">
            <strong className="text-[#172554] block">User Blocking Capabilities</strong>
            <p className="text-[#64748B]">Users can block any user or creator at any time from their profile or reel screen to instantly suppress unwanted interactions.</p>
          </div>
        </div>
      </section>

      {/* 4. Orders, Pricing & Payments */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#172554]/10 text-[#172554] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <h2>4. Pricing, Orders & Payments</h2>
        </div>
        <ul className="text-sm text-[#64748B] space-y-2 list-disc pl-5 leading-relaxed">
          <li><strong>Currency & Taxes:</strong> All retail prices listed are in Indian Rupees (INR) and inclusive of statutory GST unless explicitly stated.</li>
          <li><strong>Payment Processing:</strong> Transactions are routed through RBI-compliant payment gateways (Razorpay). Lokaya does not store card CVVs or UPI PINs.</li>
          <li><strong>Order Acceptance:</strong> An order confirmation email/SMS denotes receipt of request; formal acceptance occurs once the merchant acknowledges stock readiness.</li>
        </ul>
      </section>

      {/* 5. Logistics & Deliveries */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <h2>5. Delivery & Fulfillment</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Deliveries are coordinated through verified hyperlocal delivery partners. Delivery ETAs shown on checkout are estimates calculated using live distance and traffic. The recipient must inspect packages upon arrival and notify support within 24 hours of any external damage or seal tampering.
        </p>
      </section>

      {/* 6. Returns & Cancellation */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#172554]/10 text-[#172554] flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <h2>6. Returns, Cancellations & Refunds</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Buyers may cancel orders prior to merchant dispatch with zero penalty. Returns are governed by our dedicated <Link href="/refund-policy" className="text-[#FF6B00] font-semibold underline">Refund & Cancellation Policy</Link>, ensuring fair dispute mediation and prompt reimbursement via original payment methods.
        </p>
      </section>

      {/* 7. Governing Law */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#172554]/10 text-[#172554] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2>7. Limitation of Liability & Governing Law</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          These Terms are governed by and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the competent courts in <strong>Bengaluru, Karnataka, India</strong>.
        </p>
      </section>
    </ComplianceLayout>
  );
}
