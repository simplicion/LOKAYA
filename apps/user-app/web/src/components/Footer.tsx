import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Store as StoreIcon, 
  Compass, 
  ShieldCheck, 
  Truck, 
  HelpCircle, 
  FileText, 
  Lock, 
  RotateCcw,
  Users,
  Building2,
  ExternalLink
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-[#171717] text-white/80 border-t border-white/10 mt-12 mb-16 md:mb-0 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          {/* Column 1: Brand & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/home" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A36] to-[#FF8C36] flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
                L
              </div>
              <span className="font-black text-2xl tracking-tight text-white">
                Lokaya
              </span>
            </Link>

            <p className="text-sm text-white/60 leading-relaxed max-w-sm">
              Lokaya is India&apos;s leading hyperlocal social commerce platform. Connect directly with verified neighborhood merchants, discover creator reels, and get ultra-fast delivery.
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs text-white/50">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Verified Local Merchants
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
                Fast Local Delivery
              </span>
            </div>
          </div>

          {/* Column 2: Marketplace & Explore */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Marketplace
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/home" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Home Feed</span>
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Explore Trends</span>
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Search Products</span>
                </Link>
              </li>
              <li>
                <Link href="/business" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Local Merchants</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Partner & Business */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Partners &amp; Sellers
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/business" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>Sell on Lokaya</span>
                </Link>
              </li>
              <li>
                <Link href="/partner" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Delivery Partner</span>
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Merchant Support</span>
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Store Verification</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust, Safety & Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Trust &amp; Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-white/40" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-white/40" />
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-white/40" />
                  <span>Refund &amp; Cancellation</span>
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-white/40" />
                  <span>Community Guidelines</span>
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-white/40" />
                  <span>Grievance Officer</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Sitemap Links */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>
            &copy; {new Date().getFullYear()} Lokaya Technologies Private Limited. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/sitemap.xml" className="hover:text-white transition-colors">
              XML Sitemap
            </Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/support" className="hover:text-white transition-colors">
              Customer Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
