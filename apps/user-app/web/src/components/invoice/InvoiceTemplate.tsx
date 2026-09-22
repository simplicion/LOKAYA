'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Store, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  Package,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyContext';
import { getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface InvoiceItem {
  slNo?: number;
  id?: string;
  name: string;
  sku?: string;
  variantName?: string | null;
  image?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  orderDate: string;
  store: {
    id?: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstNumber?: string;
    contactPhone?: string;
    logoUrl?: string;
  };
  customer: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  payment: {
    method: string;
    status?: string;
    currency?: string;
    currencySymbol?: string;
  };
  isManualBooking?: boolean;
  notes?: string;
  items: InvoiceItem[];
  pricing: {
    subtotal: number;
    discountAmount?: number;
    shippingFee?: number;
    totalAmount: number;
    currency?: string;
    currencySymbol?: string;
  };
}

interface InvoiceTemplateProps {
  invoice: InvoiceData;
  onBack?: () => void;
  showActions?: boolean;
}

export function InvoiceTemplate({ invoice, onBack, showActions = true }: InvoiceTemplateProps) {
  const { formatPrice } = useCurrency();

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `Invoice ${invoice.invoiceNumber} - ${invoice.store.name}`,
        text: `Tax Invoice ${invoice.invoiceNumber} for Order #${invoice.orderId.slice(0, 8).toUpperCase()}`,
        url: window.location.href
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Invoice link copied to clipboard');
    }
  };

  const isCash = invoice.payment.method?.toLowerCase().includes('cash');
  const isUpi = invoice.payment.method?.toLowerCase().includes('upi') || invoice.payment.method?.toLowerCase().includes('online');

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-6 px-3 sm:px-6 print:p-0 print:bg-white text-[#171717]">
      
      {/* Top Action Bar (Hidden during Print) */}
      {showActions && (
        <div className="max-w-4xl mx-auto mb-6 print:hidden flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E5E2DC] shadow-sm">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="h-9 px-3 rounded-xl font-bold text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back
              </Button>
            )}
            <span className="font-mono font-black text-sm text-gray-900 hidden sm:inline">
              {invoice.invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-9 rounded-xl text-xs font-bold border-[#E5E2DC] text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-9 rounded-xl text-xs font-bold bg-[#171717] hover:bg-black text-white shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      )}

      {/* Main Printable Tax Invoice Sheet */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-[#E5E2DC] print:border-none shadow-sm print:shadow-none overflow-hidden invoice-sheet">
        
        {/* Invoice Top Header Banner */}
        <div className="bg-[#171717] text-white px-6 sm:px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-900">
          <div className="flex items-center gap-3.5">
            {invoice.store.logoUrl ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white relative border border-gray-700 shrink-0">
                <Image 
                  src={getMediaUrl(invoice.store.logoUrl)} 
                  alt={invoice.store.name} 
                  fill 
                  className="object-cover" 
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-[#FF5A36] shrink-0 font-black text-lg">
                {invoice.store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">{invoice.store.name}</h1>
                <span className="bg-[#FF5A36] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                TAX INVOICE & CASH MEMO • LOKAYA COMMERCE
              </p>
            </div>
          </div>

          {/* Invoice Tag & Badge */}
          <div className="text-left sm:text-right">
            <span className="inline-block bg-white/10 text-white border border-white/20 text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
              {invoice.isManualBooking ? 'In-Store POS Sale (Manual)' : 'Online Marketplace Order'}
            </span>
            <p className="font-mono text-xs font-bold text-gray-300 mt-1">
              Invoice #{invoice.invoiceNumber}
            </p>
          </div>
        </div>

        {/* Invoice Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Metadata Grid (Sold By / Billed To / Invoice Details) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-[#E5E2DC]">
            
            {/* Merchant / Store Info */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Sold By (Seller)
              </span>
              <p className="font-black text-gray-900 text-sm">{invoice.store.name}</p>
              {invoice.store.address && (
                <p className="text-gray-600 leading-relaxed">
                  {invoice.store.address}
                  {invoice.store.city ? `, ${invoice.store.city}` : ''}
                  {invoice.store.state ? `, ${invoice.store.state}` : ''}
                  {invoice.store.pincode ? ` - ${invoice.store.pincode}` : ''}
                </p>
              )}
              {invoice.store.contactPhone && (
                <p className="text-gray-600">Phone: <span className="font-semibold text-gray-800">{invoice.store.contactPhone}</span></p>
              )}
              {invoice.store.gstNumber && (
                <p className="font-mono text-[11px] text-gray-500 font-bold">
                  GSTIN / PAN: {invoice.store.gstNumber}
                </p>
              )}
            </div>

            {/* Customer / Billing Info */}
            <div className="space-y-1 text-xs md:border-l md:border-[#E5E2DC] md:pl-6">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Billed To (Customer)
              </span>
              <p className="font-black text-gray-900 text-sm">
                {invoice.customer.name || 'Walk-in Customer'}
              </p>
              {invoice.customer.phone && (
                <p className="text-gray-600">Phone: <span className="font-semibold text-gray-800">{invoice.customer.phone}</span></p>
              )}
              {invoice.customer.email && (
                <p className="text-gray-600">Email: <span className="font-semibold text-gray-800">{invoice.customer.email}</span></p>
              )}
              <p className="text-gray-500 leading-relaxed mt-1">
                {invoice.customer.address || 'Over-the-Counter / Walk-in Purchase'}
              </p>
            </div>

            {/* Order & Payment Meta */}
            <div className="space-y-1.5 text-xs md:border-l md:border-[#E5E2DC] md:pl-6 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Order & Payment Info
              </span>
              <div className="flex justify-between">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-mono font-bold text-gray-900">#{invoice.orderId.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Date:</span>
                <span className="font-semibold text-gray-800">{invoice.orderDate}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                <span className="text-gray-500">Payment:</span>
                <span className="inline-flex items-center gap-1 font-bold text-gray-900">
                  {isCash ? <Banknote className="w-3 h-3 text-amber-600" /> : <CreditCard className="w-3 h-3 text-emerald-600" />}
                  {invoice.payment.method}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment Status:</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded uppercase">
                  {invoice.payment.status || 'PAID'}
                </span>
              </div>
            </div>

          </div>

          {/* Itemized Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-y border-[#E5E2DC] text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 text-center w-10">#</th>
                  <th className="py-3 px-3">Item Description</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-center w-16">Qty</th>
                  <th className="py-3 px-3 text-right w-24">Unit Price</th>
                  <th className="py-3 px-3 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DC]">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-3 text-center text-gray-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        {item.image && (
                          <div className="w-8 h-8 rounded-lg overflow-hidden relative border border-gray-200 shrink-0 bg-gray-50 print:hidden">
                            <Image 
                              src={item.image} 
                              alt={item.name} 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 text-xs sm:text-sm leading-snug">
                            {item.name}
                          </p>
                          {item.variantName && (
                            <span className="inline-block text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">
                              Variant: {item.variantName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-gray-500 text-[11px]">
                      {item.sku || 'N/A'}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-gray-700">
                      {formatPrice(item.unitPrice)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-gray-900">
                      {formatPrice(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation & Totals Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#E5E2DC]">
            
            {/* Notes / Legal Disclaimer */}
            <div className="space-y-3 text-xs text-gray-500">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/60 space-y-1.5">
                <p className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Terms & Conditions
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-gray-600">
                  <li>Goods once sold can be exchanged within 7 days with original invoice.</li>
                  <li>In-store and online warranties apply as per manufacturer terms.</li>
                  <li>This is a valid computer-generated Tax Invoice recognized by Lokaya.</li>
                </ul>
              </div>

              {invoice.notes && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-amber-900 text-xs">
                  <span className="font-bold block mb-0.5">Special Notes:</span>
                  {invoice.notes}
                </div>
              )}
            </div>

            {/* Calculations Breakdown Table */}
            <div className="space-y-2">
              <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200/80 space-y-2.5 text-xs">
                
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-gray-900">{formatPrice(invoice.pricing.subtotal)}</span>
                </div>

                {invoice.pricing.discountAmount != null && invoice.pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount Applied</span>
                    <span className="font-bold">-{formatPrice(invoice.pricing.discountAmount)}</span>
                  </div>
                )}

                {invoice.pricing.shippingFee != null && invoice.pricing.shippingFee > 0 ? (
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery / Shipping Fee</span>
                    <span className="font-bold text-gray-900">{formatPrice(invoice.pricing.shippingFee)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-emerald-600 uppercase text-[10px]">FREE</span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="pt-3 border-t border-gray-300 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-black text-gray-900 uppercase tracking-wide">Grand Total</span>
                    <p className="text-[10px] text-gray-500 font-medium">Inclusive of all applicable taxes</p>
                  </div>
                  <span className="text-xl font-black text-[#FF5A36]">
                    {formatPrice(invoice.pricing.totalAmount)}
                  </span>
                </div>

              </div>

              {/* Authorized Seal & Stamp Placeholder */}
              <div className="pt-4 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <QrCode className="w-8 h-8 text-gray-400" />
                  <span className="text-[10px] font-mono leading-tight">
                    AUTHENTICATED BY<br /><strong>LOKAYA CORE</strong>
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Authorized Signatory</p>
                  <p className="font-bold text-gray-800 text-xs mt-1">{invoice.store.name}</p>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Embedded CSS for Print Styling */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .invoice-sheet {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 0 !important;
          }
          nav, header, footer, aside, button, .no-print {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
