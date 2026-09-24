'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  Trash2, 
  Users, 
  RotateCcw, 
  Building2, 
  ExternalLink,
  Printer,
  ChevronRight,
  Mail
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface ComplianceLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  badgeText?: string;
  children: React.ReactNode;
}

const COMPLIANCE_NAV_LINKS = [
  { href: '/privacy-policy', label: 'Privacy Policy', icon: ShieldCheck },
  { href: '/terms-and-conditions', label: 'Terms of Service', icon: FileText },
  { href: '/delete-account', label: 'Delete Account & Data', icon: Trash2 },
  { href: '/community-guidelines', label: 'Community Guidelines', icon: Users },
  { href: '/refund-policy', label: 'Refund & Returns', icon: RotateCcw },
  { href: '/compliance', label: 'Grievance & Legal', icon: Building2 },
];

export function ComplianceLayout({
  title,
  subtitle,
  lastUpdated,
  badgeText = 'Google Play & IT Rules Compliant',
  children,
}: ComplianceLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/home');
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#172554] flex flex-col font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#172554]">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E7E5E0] transition-all">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#172554] hover:bg-[#F5F3EF] active:scale-95 transition-all border border-transparent hover:border-[#E7E5E0] cursor-pointer"
              aria-label="Navigate Back"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
            </button>
            <Link href="/home" className="flex items-center gap-2 group">
              <Logo className="text-xl" showWhiteBg={false} />
              <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-[#172554]/5 text-[#172554] border border-[#172554]/10">
                Legal & Trust
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#172554] hover:bg-[#F5F3EF] rounded-lg transition-colors border border-transparent hover:border-[#E7E5E0] cursor-pointer"
              title="Print Policy Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <Link
              href="/support"
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-[#172554] bg-[#F5F3EF] hover:bg-[#E7E5E0] rounded-full transition-colors border border-[#E7E5E0]"
            >
              <Mail className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Help Center</span>
            </Link>
          </div>
        </div>

        {/* Horizontal Navigation Pills */}
        <div className="border-t border-[#E7E5E0]/60 bg-white/70 overflow-x-auto no-scrollbar">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 py-2 min-w-max">
            {COMPLIANCE_NAV_LINKS.map((item) => {
              const isActive = pathname === item.href || (item.href === '/privacy-policy' && pathname?.includes('privacy'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#172554] text-white shadow-xs font-semibold'
                      : 'text-[#64748B] hover:text-[#172554] hover:bg-[#F5F3EF]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF6B00]' : 'text-[#64748B]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E7E5E0] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#FF6B00]/10 via-[#FF4D6D]/5 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none blur-2xl" />
          
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              {badgeText}
            </span>
            <span className="text-xs font-medium text-[#64748B]">
              Last Modified: <strong className="text-[#172554]">{lastUpdated}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#172554] tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl">
            {subtitle}
          </p>

          <div className="mt-4 pt-4 border-t border-[#E7E5E0] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#64748B]">
            <div><strong>Application:</strong> Lokaya (Social & Local Commerce)</div>
            <div><strong>Package:</strong> <code className="font-mono text-[#172554] bg-[#F5F3EF] px-1.5 py-0.5 rounded">app.lokaya.shop</code></div>
            <div><strong>Entity:</strong> Lokaya Technologies Pvt. Ltd.</div>
          </div>
        </div>

        {/* Injected Policy Sections */}
        <div className="space-y-6">
          {children}
        </div>

        {/* Quick Help & Grievance Box */}
        <div className="bg-[#F5F3EF] rounded-3xl p-6 border border-[#E7E5E0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-bold text-[#172554] text-base">Have Privacy Inquiries or Questions?</h2>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-xl leading-relaxed">
              Our Data Protection Officer and Legal Redressal Desk respond within 24 to 48 business hours.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/delete-account"
              className="px-4 py-2 text-xs font-bold text-[#172554] bg-white border border-[#E7E5E0] rounded-full hover:bg-gray-50 transition-colors shadow-xs"
            >
              Delete Account
            </Link>
            <Link
              href="/support"
              className="px-4 py-2 text-xs font-bold text-white bg-[#FF6B00] rounded-full hover:bg-[#e05f00] transition-colors shadow-xs"
            >
              Contact DPO Desk
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E7E5E0] mt-12 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-3">
            <Logo className="text-lg" showWhiteBg={false} />
            <span>&copy; {new Date().getFullYear()} Lokaya Technologies Private Limited. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-[#172554] transition-colors">Privacy</Link>
            <Link href="/terms-and-conditions" className="hover:text-[#172554] transition-colors">Terms</Link>
            <Link href="/delete-account" className="hover:text-[#172554] transition-colors">Data Deletion</Link>
            <Link href="/compliance" className="hover:text-[#172554] transition-colors">Grievance</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
