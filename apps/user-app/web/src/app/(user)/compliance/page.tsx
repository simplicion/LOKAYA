'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ShieldCheck, 
  Scale, 
  Clock, 
  Mail, 
  MapPin, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { ComplianceLayout } from '@/components/compliance/ComplianceLayout';

export default function ComplianceGrievancePage() {
  return (
    <ComplianceLayout
      title="Grievance Redressal & Statutory Compliance"
      subtitle="Statutory disclosures, Grievance Officer contacts, and nodal compliance mechanisms in accordance with the Information Technology Act and Indian E-Commerce Rules."
      lastUpdated="September 24, 2026"
      badgeText="IT Rules 2021 & E-Commerce Compliant"
    >
      {/* 1. Regulatory Status */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <h2>1. Corporate & Legal Identity</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          The Lokaya digital commerce marketplace and mobile software are owned, designed, and operated by:
        </p>

        <div className="p-4 rounded-2xl bg-[#F5F3EF] border border-[#E7E5E0] space-y-1.5 text-xs text-[#172554]">
          <div><strong>Legal Entity:</strong> Lokaya Technologies Private Limited</div>
          <div><strong>Corporate Identity (CIN):</strong> U72900KA2026PTC184920</div>
          <div><strong>Registered Office:</strong> Level 4, Lokaya Tower, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India</div>
          <div><strong>Official Website:</strong> <a href="https://lokaya.shop" className="text-[#FF6B00] font-semibold underline">https://lokaya.shop</a></div>
          <div><strong>Google Play Package:</strong> <code className="font-mono text-[#172554] bg-white px-1.5 py-0.5 rounded border border-[#E7E5E0]">app.lokaya.shop</code></div>
        </div>
      </section>

      {/* 2. Grievance Officer */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#172554]/10 text-[#172554] flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <h2>2. Grievance Redressal Officer (Rule 3(2) IT Rules, 2021)</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          For any consumer grievances, content violation escalations, or data protection queries, users can contact our designated Grievance Officer directly:
        </p>

        <div className="p-5 rounded-2xl bg-white border border-[#E7E5E0] shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#64748B] block">Designated Officer:</span>
              <strong className="text-sm text-[#172554]">Mr. R. Sharma</strong>
              <span className="text-[#64748B] text-[11px] block">Head of Legal & Compliance</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Direct Compliance Email:</span>
              <a href="mailto:grievance@lokaya.shop" className="text-sm font-bold text-[#FF6B00] underline block">grievance@lokaya.shop</a>
              <span className="text-[#64748B] text-[11px] block">Monitored 7 days a week</span>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-[#E7E5E0]">
              <span className="text-[#64748B] block mb-1">Physical Mailing Address:</span>
              <p className="text-[#172554] leading-relaxed">
                Office of the Grievance Officer, Lokaya Technologies Pvt. Ltd., Level 4, Lokaya Tower, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Statutory Timelines */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <h2>3. Statutory Redressal Timelines</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-[#F5F3EF] border border-[#E7E5E0] space-y-1">
            <div className="text-xs font-bold text-[#172554]">Mandatory Acknowledgment</div>
            <div className="text-base font-extrabold text-[#16A34A]">Within 24 to 48 Hours</div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">Receipt of your grievance ticket is confirmed along with a unique reference number.</p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F5F3EF] border border-[#E7E5E0] space-y-1">
            <div className="text-xs font-bold text-[#172554]">Substantive Resolution</div>
            <div className="text-base font-extrabold text-[#172554]">Within 15 Working Days</div>
            <p className="text-[11px] text-[#64748B] leading-relaxed">Full legal review, dispute disposition, or content removal implemented and communicated.</p>
          </div>
        </div>
      </section>

      {/* 4. Law Enforcement Notice */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2>4. Law Enforcement & Nodal Authority Inquiries</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Authorized Indian law enforcement agencies, cyber cells, and statutory bodies seeking lawful assistance under Section 91 CrPC or Section 69 IT Act can address official notices to <a href="mailto:law-enforcement@lokaya.shop" className="text-[#FF6B00] font-semibold underline">law-enforcement@lokaya.shop</a>.
        </p>
      </section>
    </ComplianceLayout>
  );
}
