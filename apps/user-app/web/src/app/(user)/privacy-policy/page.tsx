'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Database, 
  MapPin, 
  Lock, 
  Eye, 
  UserCheck, 
  Trash2, 
  Bell, 
  CreditCard, 
  Camera, 
  ShieldCheck, 
  Server, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { ComplianceLayout } from '@/components/compliance/ComplianceLayout';

export default function PrivacyPolicyPage() {
  return (
    <ComplianceLayout
      title="Privacy Policy & Data Safety"
      subtitle="Comprehensive transparency on how Lokaya collects, utilizes, protects, and handles your personal information across our mobile application and web ecosystem."
      lastUpdated="September 24, 2026"
      badgeText="Google Play Data Safety Certified"
    >
      {/* Overview Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2>1. Introduction & Scope</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Welcome to <strong>Lokaya</strong> (&quot;Lokaya&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), operated by <strong>Lokaya Technologies Private Limited</strong>. Lokaya provides a hyper-local social commerce platform enabling users to discover neighborhood businesses, view and publish creator reels and product posts, place orders, and coordinate fast local deliveries (Package name: <code className="font-mono text-[#172554] bg-[#F5F3EF] px-1.5 py-0.5 rounded">app.lokaya.shop</code>).
        </p>
        <p className="text-sm text-[#64748B] leading-relaxed">
          This Privacy Policy strictly conforms to Google Play Developer Programme Policies, the Digital Personal Data Protection Act (DPDPA), Information Technology Act 2000, and global data privacy standards. By installing, creating an account, or interacting with Lokaya, you acknowledge and consent to the data practices described herein.
        </p>
      </section>

      {/* Section 2: Data We Collect */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#172554]/10 text-[#172554] flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <h2>2. Personal & Sensitive Information We Collect</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Item A */}
          <div className="p-4 rounded-2xl bg-[#F5F3EF]/60 border border-[#E7E5E0] space-y-2">
            <div className="flex items-center gap-2 text-[#172554] font-semibold text-sm">
              <UserCheck className="w-4 h-4 text-[#FF6B00]" />
              <span>Identity & Account Info</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Name, mobile telephone number, email address, profile photo, and delivery addresses provided upon registration or checkout.
            </p>
          </div>

          {/* Item B */}
          <div className="p-4 rounded-2xl bg-[#F5F3EF]/60 border border-[#E7E5E0] space-y-2">
            <div className="flex items-center gap-2 text-[#172554] font-semibold text-sm">
              <MapPin className="w-4 h-4 text-[#FF6B00]" />
              <span>Location Data (Precise & Approximate)</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              With explicit user consent, we collect GPS coordinates to compute delivery radii, connect you with local stores within 5-10km, and route delivery couriers accurately.
            </p>
          </div>

          {/* Item C */}
          <div className="p-4 rounded-2xl bg-[#F5F3EF]/60 border border-[#E7E5E0] space-y-2">
            <div className="flex items-center gap-2 text-[#172554] font-semibold text-sm">
              <Camera className="w-4 h-4 text-[#FF6B00]" />
              <span>Photos, Videos & Media</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              User-uploaded videos, product reels, photos for storefront creation, and product reviews. Media is securely stored and streamed via Cloudflare R2 object storage.
            </p>
          </div>

          {/* Item D */}
          <div className="p-4 rounded-2xl bg-[#F5F3EF]/60 border border-[#E7E5E0] space-y-2">
            <div className="flex items-center gap-2 text-[#172554] font-semibold text-sm">
              <CreditCard className="w-4 h-4 text-[#FF6B00]" />
              <span>Financial & Transaction Records</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Order history, purchase amounts, and transaction IDs. We <strong>never</strong> store raw debit/credit card numbers or UPI MPINs. Payments are processed exclusively through certified PCI-DSS compliant gateways (Razorpay).
            </p>
          </div>

          {/* Item E */}
          <div className="p-4 rounded-2xl bg-[#F5F3EF]/60 border border-[#E7E5E0] space-y-2 md:col-span-2">
            <div className="flex items-center gap-2 text-[#172554] font-semibold text-sm">
              <Bell className="w-4 h-4 text-[#FF6B00]" />
              <span>Device Identifiers & Diagnostics</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Firebase Cloud Messaging (FCM) registration tokens (for dispatching real-time order alerts), OS version, device model, IP address, and anonymized performance crash diagnostics.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Android Device Permissions */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <h2>3. Device Permissions & Disclosures</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          The Lokaya Android client declares and utilizes only the minimal permissions required for operational functionality:
        </p>

        <div className="overflow-x-auto border border-[#E7E5E0] rounded-2xl mt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F3EF] border-b border-[#E7E5E0] text-[#172554] font-bold">
              <tr>
                <th className="p-3">Permission</th>
                <th className="p-3">Category</th>
                <th className="p-3">Explicit Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E0] text-[#64748B]">
              <tr>
                <td className="p-3 font-mono font-semibold text-[#172554]">ACCESS_FINE_LOCATION</td>
                <td className="p-3">Location</td>
                <td className="p-3">Enables discovering nearby neighborhood storefronts and accurate address pinning for delivery.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-semibold text-[#172554]">POST_NOTIFICATIONS</td>
                <td className="p-3">Notifications</td>
                <td className="p-3">Sends transactional updates (Order Confirmed, Out for Delivery, Seller Messages).</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-semibold text-[#172554]">READ_MEDIA_IMAGES</td>
                <td className="p-3">Storage / Media</td>
                <td className="p-3">Allows users and merchants to upload catalog images, post product reels, and attach review pictures.</td>
              </tr>
              <tr>
                <td className="p-3 font-mono font-semibold text-[#172554]">INTERNET</td>
                <td className="p-3">Network</td>
                <td className="p-3">Communicates with Lokaya API servers and Cloudflare media CDN over encrypted TLS.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Third-Party SDKs & Data Sharing */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#172554]/10 text-[#172554] flex items-center justify-center shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <h2>4. Third-Party Service Providers & SDKs</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Lokaya does <strong>NOT sell, lease, or monetize</strong> your personal data to data brokers or advertising exchanges. Data is processed exclusively by verified infrastructure partners under strict confidentiality agreements:
        </p>

        <ul className="text-sm text-[#64748B] space-y-2.5 list-disc pl-5 leading-relaxed pt-1">
          <li><strong>Razorpay Payments:</strong> RBI-licensed payment gateway processing credit/debit cards, UPI, Netbanking, and Wallets.</li>
          <li><strong>Google Firebase:</strong> Used for secure authentication verification and Firebase Cloud Messaging (FCM) push notifications.</li>
          <li><strong>Cloudflare Inc.:</strong> Global CDN and S3-compatible R2 storage for fast, low-latency streaming of reels, media, and images.</li>
          <li><strong>Delivery & Logistics Partners:</strong> Registered local couriers receive only delivery address coordinates and masked recipient contact numbers to complete delivery.</li>
        </ul>
      </section>

      {/* Section 5: Data Security & Retention */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <h2>5. Data Security & Storage Architecture</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          All network communication between the Lokaya client application and server infrastructure is encrypted using modern <strong>TLS 1.3 / HTTPS</strong> cryptographic protocols. At-rest databases are encrypted using AES-256 encryption. Access to production data is restricted to authorized operations engineers through role-based access control and dual-factor authentication.
        </p>
      </section>

      {/* Section 6: Account & Data Deletion Policy */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#FF6B00]/30 bg-gradient-to-br from-white to-[#FF6B00]/5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Trash2 className="w-5 h-5" />
          </div>
          <h2>6. User Rights & Account Deletion (Google Play Requirement)</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          You retain sovereign rights over your data. In full compliance with Google Play&apos;s Account Deletion Policy, any user may request the permanent deletion of their account, identity records, reels, posts, comments, and stored addresses without needing to retain the mobile app.
        </p>

        <div className="p-4 rounded-2xl bg-white border border-[#E7E5E0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-bold text-[#172554] text-sm">Self-Service Account & Data Deletion Portal</div>
            <p className="text-xs text-[#64748B]">Submit an immediate erasure request online with zero friction.</p>
          </div>
          <Link
            href="/delete-account"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B00] text-white text-xs font-bold rounded-full hover:bg-[#e05f00] transition-colors shadow-xs shrink-0"
          >
            <span>Delete Account & Data</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Section 7: Children's Privacy */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-3">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#172554]/10 text-[#172554] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <h2>7. Children&apos;s Privacy Protection</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          Lokaya is intended solely for general audience consumers aged 18 and older. We do not knowingly solicit or collect personal identification from children under the age of 13 (or under 18 without parental supervision). If you believe a minor has registered an account, contact us immediately at <a href="mailto:privacy@lokaya.shop" className="text-[#FF6B00] font-semibold underline">privacy@lokaya.shop</a> for prompt account revocation and data purge.
        </p>
      </section>

      {/* Section 8: Grievance Officer & Contact */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E7E5E0] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 text-[#172554] font-bold text-lg">
          <div className="w-10 h-10 rounded-2xl bg-[#172554]/10 text-[#172554] flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2>8. Data Protection Officer & Redressal Desk</h2>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          In accordance with the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, inquiries can be directed to:
        </p>
        <div className="p-4 rounded-2xl bg-[#F5F3EF] border border-[#E7E5E0] space-y-1 text-xs text-[#172554]">
          <div><strong>Officer:</strong> Grievance & Data Protection Officer</div>
          <div><strong>Company:</strong> Lokaya Technologies Private Limited</div>
          <div><strong>Email:</strong> <a href="mailto:privacy@lokaya.shop" className="text-[#FF6B00] font-semibold underline">privacy@lokaya.shop</a> / <a href="mailto:grievance@lokaya.shop" className="text-[#FF6B00] font-semibold underline">grievance@lokaya.shop</a></div>
          <div><strong>Registered Address:</strong> Lokaya Technologies HQ, Indiranagar, Bengaluru, Karnataka 560038, India</div>
          <div><strong>Turnaround Time:</strong> Acknowledged within 48 hours; resolved within 15 working days.</div>
        </div>
      </section>
    </ComplianceLayout>
  );
}
