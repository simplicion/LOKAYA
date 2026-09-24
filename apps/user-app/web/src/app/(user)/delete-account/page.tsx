'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  HelpCircle, 
  FileText, 
  UserX,
  Mail,
  Phone
} from 'lucide-react';
import { ComplianceLayout } from '@/components/compliance/ComplianceLayout';

export default function DeleteAccountPage() {
  const [identifier, setIdentifier] = useState('');
  const [reason, setReason] = useState('');
  const [confirmUnderstood, setConfirmUnderstood] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !confirmUnderstood) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setTicketId(`LOK-DEL-${Math.floor(100000 + Math.random() * 900000)}`);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <ComplianceLayout
      title="Delete Account & Data Erasure"
      subtitle="Request permanent deletion of your Lokaya user account, identity details, uploaded reels, and associated personal records in full compliance with Google Play Developer policies."
      lastUpdated="September 24, 2026"
      badgeText="Google Play Account Deletion Compliant"
    >
      {/* What Happens Notice */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h2>What Happens When You Request Account Deletion?</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          At Lokaya, we respect your right to be forgotten. In accordance with Google Play&apos;s Account Deletion Policy, you can initiate a complete account deletion request through this public web portal without having to install or reinstall the mobile application.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Deleted Data */}
          <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 space-y-2">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Data That Will Be Permanently Erased</span>
            </div>
            <ul className="text-xs text-red-800/90 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>Your user profile, name, avatar, email, and phone number.</li>
              <li>Saved delivery addresses and GPS geo-tags.</li>
              <li>All published reels, posts, video media, and product reviews.</li>
              <li>Comments, likes, store following connections, and wishlist items.</li>
              <li>Active sessions, push tokens, and authentication credentials.</li>
            </ul>
          </div>

          {/* Retained Data */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Data Retained Under Statutory Law</span>
            </div>
            <p className="text-xs text-amber-800/90 leading-relaxed">
              Pursuant to applicable commercial tax regulations (Indian Goods and Services Tax Act and Consumer Protection E-Commerce Rules), financial transaction receipts, invoice numbers, and GST logs are retained for standard statutory audit windows (up to 7 years) solely for legal compliance, after which they are purged.
            </p>
          </div>
        </div>
      </section>

      {/* Form or Success State */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <h2>Self-Service Account Deletion Request</h2>
        </div>

        {submitted ? (
          <div className="p-6 rounded-2xl bg-[#16A34A]/5 border border-[#16A34A]/20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#172554]">Deletion Request Successfully Submitted</h3>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
              We have received your account erasure request for <strong className="text-[#172554]">{identifier}</strong>. A verification notice has been dispatched.
            </p>
            <div className="inline-block bg-white px-4 py-2 rounded-xl border border-[#E7E5E0] text-xs font-mono font-bold text-[#172554]">
              Tracking Ticket: {ticketId}
            </div>
            <p className="text-xs text-[#64748B]">
              In accordance with standard safety protocols, accounts enter a <strong>30-day cooling-off window</strong> before permanent cryptographic purge. If you log back into Lokaya within 30 days, you can choose to cancel this deletion request.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#172554] mb-1.5">
                Registered Mobile Number or Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. +91 98765 43210 or yourname@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7E5E0] bg-[#FAF9F6] text-sm text-[#172554] focus:outline-none focus:border-[#FF6B00] transition-colors"
              />
              <span className="text-[11px] text-[#64748B] mt-1 block">
                Must match the credential linked to your Lokaya account.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172554] mb-1.5">
                Reason for Leaving (Optional)
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E7E5E0] bg-[#FAF9F6] text-sm text-[#172554] focus:outline-none focus:border-[#FF6B00] transition-colors"
              >
                <option value="">Select a reason</option>
                <option value="privacy">Privacy concerns / Data reduction</option>
                <option value="not_using">No longer shopping locally</option>
                <option value="multiple_accounts">Cleaning up duplicate accounts</option>
                <option value="other">Other reason</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={confirmUnderstood}
                  onChange={(e) => setConfirmUnderstood(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#FF6B00] focus:ring-[#FF6B00] border-gray-300 cursor-pointer"
                />
                <span className="text-xs text-[#64748B] leading-relaxed">
                  I understand that this action will permanently schedule the deletion of my profile, order history, published reels, and addresses, and is irreversible after 30 days.
                </span>
              </label>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !confirmUnderstood || !identifier}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#DC2626] text-white text-xs font-bold rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Request...' : 'Submit Deletion Request'}</span>
              </button>
              <span className="text-xs text-[#64748B]">
                Or email our DPO directly at <a href="mailto:privacy@lokaya.shop" className="text-[#172554] font-semibold underline">privacy@lokaya.shop</a>
              </span>
            </div>
          </form>
        )}
      </section>

      {/* In-App Deletion Alternative */}
      <section className="bg-[#F5F3EF] rounded-3xl p-6 border border-[#E7E5E0] space-y-2">
        <div className="flex items-center gap-2 text-[#172554] font-bold text-sm">
          <Clock className="w-4 h-4 text-[#FF6B00]" />
          <h3>Deleting From Inside the Mobile App</h3>
        </div>
        <p className="text-xs text-[#64748B] leading-relaxed">
          If you have the Lokaya Android app installed on your smartphone, you can also delete your account instantly by navigating to:
          <br />
          <strong className="text-[#172554]">Profile Tab → Settings (⚙️) → Account Security → Delete Account</strong>.
        </p>
      </section>
    </ComplianceLayout>
  );
}
