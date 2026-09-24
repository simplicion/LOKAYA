'use client';

import React from 'react';
import Link from 'next/link';
import { 
  RotateCcw, 
  Clock, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle,
  Truck,
  PackageCheck
} from 'lucide-react';
import { ComplianceLayout } from '@/components/compliance/ComplianceLayout';

export default function RefundPolicyPage() {
  return (
    <ComplianceLayout
      title="Refund, Return & Cancellation Policy"
      subtitle="Clear and fair return standards for local neighborhood orders, damaged item claims, and prompt automated payment reimbursements."
      lastUpdated="September 24, 2026"
      badgeText="Consumer Protection Compliant"
    >
      {/* 1. Cancellation Policy */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <h2>1. Order Cancellation Windows</h2>
        </div>
        <div className="space-y-2 text-sm text-[#64748B] leading-relaxed">
          <p>
            <strong>Before Dispatch:</strong> You may cancel any order free of charge directly via the app within the &quot;Orders&quot; tab prior to the merchant assigning a delivery courier or handing over the package. An immediate full refund is triggered to your source payment method.
          </p>
          <p>
            <strong>After Dispatch:</strong> Once a hyperlocal delivery courier is in transit with your package, immediate automated cancellation is restricted. If you no longer wish to accept the package, inform the courier upon arrival or submit a return request.
          </p>
        </div>
      </section>

      {/* 2. Return Eligibility */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#172554]/10 text-[#172554] flex items-center justify-center shrink-0">
            <PackageCheck className="w-5 h-5" />
          </div>
          <h2>2. Return Eligibility & Timeframes</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Merchandise is eligible for return or replacement under the following conditions:
        </p>
        <ul className="text-sm text-[#64748B] space-y-2 list-disc pl-5 leading-relaxed pt-1">
          <li><strong>Damaged or Tampered Items:</strong> Must be reported within <strong>24 to 48 hours</strong> of delivery along with photographic proof in the app.</li>
          <li><strong>Incorrect Item Delivered:</strong> Discrepancies in size, color, or model will be replaced or refunded with priority.</li>
          <li><strong>Apparel & General Goods:</strong> Standard return window is <strong>7 days</strong> provided tags remain intact and merchandise is unused.</li>
          <li><strong>Non-Returnable Items:</strong> Perishable groceries, cooked meals, customized goods, and personal hygiene items are non-returnable unless arrived spoiled or defective.</li>
        </ul>
      </section>

      {/* 3. Refund Timelines */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <h2>3. Refund Processing Timelines</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Once an approved return is picked up by our courier and inspected by the merchant, refunds are credited back to the original source:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#F5F3EF] border border-[#E7E5E0] text-center space-y-1">
            <strong className="text-xs font-bold text-[#172554] block">UPI / Wallets</strong>
            <span className="text-sm font-extrabold text-[#FF6B00]">Instant to 24 Hours</span>
            <p className="text-[11px] text-[#64748B]">Credited directly to UPI VPA</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F5F3EF] border border-[#E7E5E0] text-center space-y-1">
            <strong className="text-xs font-bold text-[#172554] block">Credit / Debit Cards</strong>
            <span className="text-sm font-extrabold text-[#172554]">3 to 5 Banking Days</span>
            <p className="text-[11px] text-[#64748B]">Depending on your card issuer</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F5F3EF] border border-[#E7E5E0] text-center space-y-1">
            <strong className="text-xs font-bold text-[#172554] block">Netbanking</strong>
            <span className="text-sm font-extrabold text-[#172554]">4 to 7 Banking Days</span>
            <p className="text-[11px] text-[#64748B]">Via standard NEFT / RTGS</p>
          </div>
        </div>
      </section>

      {/* 4. Raising a Dispute */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2>4. Dispute Mediation & Support</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          If a seller denies an eligible return, you can escalate the matter directly to the Lokaya Customer Arbitration Desk at <a href="mailto:support@lokaya.shop" className="text-[#FF6B00] font-semibold underline">support@lokaya.shop</a>. Our team investigates chat logs, dispatch media, and tracking data to enforce fair buyer resolution within 48 business hours.
        </p>
      </section>
    </ComplianceLayout>
  );
}
