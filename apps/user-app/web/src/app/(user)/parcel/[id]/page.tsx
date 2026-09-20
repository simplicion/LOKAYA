'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Package, 
  MapPin, 
  Store, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Bike, 
  HelpCircle, 
  ChevronRight,
  Loader2,
  ExternalLink,
  ArrowLeft,
  Headphones
} from 'lucide-react';
import { useGetPublicParcelVerificationQuery } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PublicParcelVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const orderId = resolvedParams.id;

  const { data: parcel, isLoading, error } = useGetPublicParcelVerificationQuery(orderId, {
    skip: !orderId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-4">
          <Loader2 className="w-7 h-7 text-[#FF5A36] animate-spin" />
        </div>
        <h2 className="text-base font-black text-gray-900">Verifying Parcel Hologram...</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Scanning Lokaya Hyperlocal Delivery Network database for parcel records.
        </p>
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4 text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-gray-900">Parcel Record Not Found</h2>
        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
          The scanned QR code does not match any active shipment in our database or may have expired.
        </p>

        <div className="w-full bg-white p-4 rounded-2xl border border-[#E5E2DC] shadow-xs mt-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
            <Headphones className="w-4 h-4 text-[#FF5A36]" />
            <span>Found a Lost Parcel?</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            If you found an unattended delivery parcel with this QR code, please contact Lokaya Operations Support:
          </p>
          <a
            href="tel:+918000056529"
            className="w-full h-10 rounded-xl bg-gray-900 text-white font-bold text-xs flex items-center justify-center gap-2 mt-2 hover:bg-black transition-colors"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Call Support Hotline: +91 80000 56529</span>
          </a>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push('/')}
          className="mt-6 w-full h-11 rounded-2xl border-[#E5E2DC] font-bold text-xs text-gray-700"
        >
          Return to Lokaya Home
        </Button>
      </div>
    );
  }

  const isCod = parcel.isCod;
  const shortId = parcel.shortId;
  const items = parcel.items || [];

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 flex flex-col max-w-lg mx-auto border-x border-[#E5E2DC] font-sans">
      
      {/* Top Bar Navigation */}
      <div className="bg-white border-b border-[#E5E2DC] sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
            title="Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-black text-gray-900 leading-tight">Parcel Verification Desk</h1>
            <p className="text-[10px] text-gray-500 font-mono">Ref: {parcel.reference}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Parcel</span>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* 🚨 LOST PARCEL RETURN & HELP BANNER */}
        <div className="bg-gradient-to-br from-amber-500 via-[#FF5A36] to-amber-600 rounded-3xl p-5 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-100 bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Lost & Found Support</span>
            </span>
            <span className="text-[11px] font-bold text-white/90">Official Lokaya Network</span>
          </div>

          <div>
            <h2 className="text-lg font-black tracking-tight leading-snug text-white">
              Found this lost or misplaced parcel?
            </h2>
            <p className="text-xs text-amber-100 mt-1 leading-relaxed">
              Thank you for helping! You can immediately connect with the merchant store or customer below to return or report this package.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {parcel.store?.phone && (
              <a
                href={`tel:${parcel.store.phone}`}
                className="h-11 rounded-xl bg-white text-gray-900 hover:bg-amber-50 font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Store className="w-4 h-4 text-[#FF5A36]" />
                <span>Call Store</span>
              </a>
            )}

            {parcel.recipient?.phone && (
              <a
                href={`tel:${parcel.recipient.phone}`}
                className="h-11 rounded-xl bg-black text-white hover:bg-gray-900 font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call Customer</span>
              </a>
            )}
          </div>
        </div>

        {/* HIGH-CONTRAST PAYMENT CLARITY BANNER */}
        <div className={cn(
          "rounded-2xl p-4 border-2 shadow-xs text-center",
          isCod 
            ? "bg-black text-white border-black" 
            : "bg-emerald-50 text-emerald-950 border-emerald-500"
        )}>
          {isCod ? (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                ⚠️ CASH ON DELIVERY ORDER
              </p>
              <p className="text-2xl font-black mt-0.5 tracking-tight font-mono">
                COLLECT {parcel.currencySymbol}{parcel.collectAmount?.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-300 mt-1">
                Collect exact cash payment from recipient upon handover.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                ✅ PREPAID SHIPMENT — DO NOT COLLECT CASH
              </p>
              <p className="text-lg font-black text-emerald-900 mt-0.5">
                Paid Online via Verified Gateway
              </p>
              <p className="text-[10px] text-emerald-700 mt-0.5">
                Deliver to recipient without requesting any fee.
              </p>
            </div>
          )}
        </div>

        {/* ROUTING CARDS: ORIGIN & DESTINATION */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-black text-sm text-gray-900">Shipment Routing</h3>
            <span className="text-[10px] font-bold text-gray-400 font-mono">ID: #{shortId}</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Origin */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-[#FF5A36] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Dispatched From (Merchant)
                </span>
                <p className="font-bold text-gray-900 text-sm">{parcel.store?.name}</p>
                <p className="text-gray-600 mt-0.5 leading-relaxed">{parcel.store?.address}</p>
                {parcel.store?.phone && (
                  <p className="text-[11px] font-semibold text-gray-500 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{parcel.store.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Destination */}
            <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Deliver To (Customer Doorstep)
                </span>
                <p className="font-bold text-gray-900 text-sm">{parcel.recipient?.name}</p>
                <p className="text-gray-600 mt-0.5 leading-relaxed">{parcel.recipient?.deliveryAddress}</p>
                {parcel.recipient?.phone && (
                  <p className="text-[11px] font-semibold text-gray-500 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{parcel.recipient.phone}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* VERIFIED PACKED PRODUCTS (ANTI-TAMPER RECOGNITION) */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-gray-900">Verified Package Contents</h3>
              <p className="text-[11px] text-gray-500">Verify items without breaking sealed package</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {items.map((item: any) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0 relative flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-gray-900 truncate">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                    {item.variantName && (
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded font-semibold text-gray-700">
                        {item.variantName}
                      </span>
                    )}
                    {item.sku && <span className="font-mono text-gray-400">SKU: {item.sku}</span>}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-900 font-extrabold text-xs">
                    QTY: {item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DUAL-HANDSHAKE SECURITY NOTE */}
        <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-gray-900">Dual-Handshake Verification Protection</h4>
            <p className="text-gray-600 mt-0.5 leading-relaxed">
              Every parcel in the Lokaya network requires a 4-Digit Pickup OTP from the merchant and a 4-Digit Doorstep Handover OTP from the recipient, cryptographically preventing parcel mix-ups.
            </p>
          </div>
        </div>

        {/* LOKAYA PLATFORM SUPPORT DESK */}
        <div className="p-4 rounded-2xl border border-gray-200 bg-gray-100/60 text-center space-y-2">
          <p className="text-[11px] text-gray-500 font-medium">
            Need urgent assistance with this parcel?
          </p>
          <div className="flex justify-center gap-4 text-xs font-bold text-gray-800">
            <a href="tel:+918000056529" className="hover:text-[#FF5A36] transition-colors flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>+91 80000 56529</span>
            </a>
            <span className="text-gray-300">•</span>
            <a href="mailto:support@lokaya.in" className="hover:text-[#FF5A36] transition-colors">
              support@lokaya.in
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
