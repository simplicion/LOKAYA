'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { 
  Printer, 
  Share2, 
  X, 
  Store, 
  Package, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Copy,
  PenTool
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export interface ParcelSlipItem {
  id?: string;
  name: string;
  productName?: string;
  variantName?: string | null;
  sku?: string | null;
  quantity?: number;
  qty?: number;
  price?: number;
  priceAt?: number;
  image?: string | null;
}

export interface ParcelSlipOrder {
  id: string;
  orderNumber?: string;
  status?: string;
  createdAt?: string;
  timeLabel?: string;
  paymentMethod?: string;
  isPaid?: boolean;
  total?: number | string;
  totalAmount?: number | string;
  customerName?: string;
  phone?: string;
  deliveryAddress?: string;
  deliveryLandmark?: string;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
  items?: ParcelSlipItem[];
  currencySymbol?: string;
}

interface ParcelRecognitionSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ParcelSlipOrder;
}

export function ParcelRecognitionSlipModal({
  isOpen,
  onClose,
  order
}: ParcelRecognitionSlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const shortId = (order.orderNumber || order.id || '').slice(0, 8).toUpperCase();
  const items = order.items || [];
  const isCod = 
    order.paymentMethod?.toLowerCase().includes('cash') || 
    order.paymentMethod?.toLowerCase().includes('cod') ||
    !order.isPaid;
  
  const rawTotal = order.totalAmount || order.total || 0;
  const numTotal = typeof rawTotal === 'number' 
    ? rawTotal 
    : parseFloat(String(rawTotal).replace(/[^0-9.]/g, '')) || 0;

  const currency = order.currencySymbol || '₹';
  const formattedTotal = `${currency}${numTotal.toLocaleString()}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lokaya.in';
  const parcelVerificationUrl = `${origin}/parcel/${order.id}`;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = () => {
    const summary = [
      `📦 LOKAYA PARCEL DISPATCH SLIP`,
      `Order: #${shortId}`,
      `Payment: ${isCod ? `CASH ON DELIVERY (Collect ${formattedTotal})` : 'PREPAID (Do not collect cash)'}`,
      `Customer: ${order.customerName || 'Customer'} (${order.phone || 'No phone'})`,
      `Address: ${order.deliveryAddress || 'Store Pickup'}`,
      `Items: ${items.map(i => `${i.quantity || i.qty || 1}x ${i.name || i.productName}${i.variantName ? ` (${i.variantName})` : ''}`).join(', ')}`,
      `Store: ${order.storeName || 'Merchant'}`,
      `Verify / Lost & Found: ${parcelVerificationUrl}`
    ].join('\n');

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `Lokaya Parcel #${shortId}`,
        text: summary
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summary);
      toast.success('Parcel dispatch text copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 print:p-0">
      {/* Backdrop (hidden when printing) */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity print:hidden"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E5E2DC] z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Actions Bar (hidden when printing) */}
        <div className="px-5 py-3.5 border-b border-[#E5E2DC] flex items-center justify-between bg-gray-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-gray-700">
              🏷️ Parcel Recognition Slip
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#FF5A36]">
              Scannable QR Included
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handleShare}
              className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1 border-[#E5E2DC]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 px-3 rounded-xl text-xs font-bold bg-[#FF5A36] hover:bg-[#e04d2d] text-white gap-1 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </Button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center ml-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Slip Viewport */}
        <div className="overflow-y-auto p-4 sm:p-6 print:p-2 print:overflow-visible" ref={printRef}>
          
          {/* Printable Ticket Box */}
          <div className="border-2 border-black rounded-2xl p-4 sm:p-5 space-y-4 bg-white text-black font-sans print:rounded-none print:border-black print:border-2">
            
            {/* Header: Brand & Large Human-Readable Order ID */}
            <div className="flex items-start justify-between border-b-2 border-black pb-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-700">
                  LOKAYA HYPERLOCAL DISPATCH
                </p>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5 font-mono">
                  #{shortId}
                </h1>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {order.timeLabel || order.createdAt ? new Date(order.createdAt || Date.now()).toLocaleString() : 'Ready for Dispatch'}
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-md bg-black text-white text-xs font-black uppercase tracking-wider">
                  PACKAGE SLIP
                </span>
                <p className="text-[10px] text-gray-600 mt-1 font-bold">
                  {items.length} {items.length === 1 ? 'Product' : 'Products'} Packed
                </p>
              </div>
            </div>

            {/* SMART SCANNABLE QR CODE & LOST PARCEL IDENTIFIER */}
            <div className="p-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-400 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-black bg-amber-200 border border-amber-400 px-1.5 py-0.5 rounded">
                    LOST & FOUND QR
                  </span>
                  <span className="text-[10px] font-bold text-gray-700">Smartphone Camera Scannable</span>
                </div>
                <p className="text-xs font-black text-black mt-1 leading-tight">
                  Scan to verify items or return lost parcel
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">
                  Opens instant customer drop details & merchant return desk
                </p>
              </div>

              <div className="p-1.5 bg-white rounded-xl border-2 border-black shrink-0 shadow-xs flex flex-col items-center">
                <QRCodeSVG
                  value={parcelVerificationUrl}
                  size={76}
                  level="M"
                  includeMargin={false}
                />
                <span className="text-[8px] font-mono font-bold text-gray-700 mt-1 uppercase">
                  #{shortId}
                </span>
              </div>
            </div>

            {/* HIGH-CONTRAST PAYMENT PROTECTION BANNER */}
            <div className={`p-3 rounded-xl border-2 text-center ${
              isCod 
                ? 'bg-black text-white border-black' 
                : 'bg-emerald-50 text-emerald-950 border-emerald-600'
            }`}>
              {isCod ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    ⚠️ CASH ON DELIVERY — COLLECT FROM CUSTOMER
                  </p>
                  <p className="text-xl sm:text-2xl font-black mt-0.5 tracking-tight">
                    COLLECT {formattedTotal}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                    ✅ PREPAID ORDER — DO NOT COLLECT CASH
                  </p>
                  <p className="text-sm font-extrabold text-emerald-900 mt-0.5">
                    Amount Paid Online: {formattedTotal}
                  </p>
                </div>
              )}
            </div>

            {/* PRODUCT RECOGNITION SECTION (ANTI-MIXUP DETAILS) */}
            <div className="space-y-2 border-b-2 border-black pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-800">
                  📦 Product Recognition & Verification
                </span>
                <span className="text-[10px] font-medium text-gray-500">
                  Verify items inside packet
                </span>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => {
                  const qty = item.quantity || item.qty || 1;
                  const name = item.name || item.productName || 'Item';
                  const variant = item.variantName;
                  const sku = item.sku;

                  return (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-xl border border-gray-300 bg-gray-50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.image ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-white shrink-0 relative">
                            <img src={item.image} alt={name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 shrink-0 font-bold text-xs">
                            <Package className="w-4 h-4" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-bold text-xs text-black leading-tight line-clamp-1">
                            {name}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap text-[10px] text-gray-600 mt-0.5">
                            {variant && (
                              <span className="font-semibold bg-white px-1.5 py-0.5 rounded border border-gray-200 text-black">
                                {variant}
                              </span>
                            )}
                            {sku && (
                              <span className="font-mono text-gray-500">
                                SKU: {sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-black text-white text-xs font-black">
                          QTY: {qty}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CUSTOMER ROUTING & ADDRESS */}
            <div className="border-b-2 border-black pb-3 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-800">
                📍 Deliver To (Customer Doorstep)
              </span>
              
              <div className="flex items-baseline justify-between pt-0.5">
                <p className="text-sm font-black text-black">
                  {order.customerName || 'Customer'}
                </p>
                {order.phone && (
                  <p className="text-xs font-mono font-bold text-black">
                    📞 {order.phone}
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-800 leading-relaxed font-medium">
                {order.deliveryAddress || 'Customer Address on Record'}
              </p>

              {order.deliveryLandmark && (
                <p className="text-[11px] font-bold text-black mt-0.5">
                  🚩 Landmark: {order.deliveryLandmark}
                </p>
              )}
            </div>

            {/* STORE / DISPATCH DETAILS */}
            <div className="flex items-start justify-between text-[11px] text-gray-700 pt-0.5">
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] text-gray-500 block">
                  Dispatched From:
                </span>
                <span className="font-black text-black">{order.storeName || 'Merchant Store'}</span>
                {order.storePhone && <span className="block text-[10px] text-gray-600">Ph: {order.storePhone}</span>}
              </div>

              <div className="text-right">
                <span className="font-bold uppercase tracking-wider text-[10px] text-gray-500 block">
                  Security Handshake:
                </span>
                <span className="font-extrabold text-black">4-Digit Dual OTP</span>
                <span className="block text-[10px] text-gray-600">Pickup & Handover</span>
              </div>
            </div>

            {/* ZERO-PRINTER MARKER HELPER (FOR KIRANAS & SMALL VENDORS) */}
            <div className="p-2.5 rounded-xl border border-dashed border-gray-400 bg-amber-50/60 flex items-start gap-2 text-[10px] text-gray-700">
              <PenTool className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900">No printer? Marker Pen Fast Track: </span>
                <span>Write </span>
                <span className="font-mono font-black text-black bg-amber-100 px-1 py-0.5 rounded">
                  #{shortId} • {isCod ? `COD ${formattedTotal}` : 'PREPAID'}
                </span>
                <span> directly on the bag/box with a marker pen.</span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer (hidden when printing) */}
        <div className="p-3 bg-gray-50 border-t border-[#E5E2DC] text-center print:hidden">
          <p className="text-[10px] text-gray-500">
            Print on standard 4×6 / 3×2 thermal stickers or standard A4 paper.
          </p>
        </div>

      </div>
    </div>
  );
}
