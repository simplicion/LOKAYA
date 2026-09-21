'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  MapPin, 
  Loader2, 
  ShoppingBag, 
  ArrowRight, 
  Copy, 
  Check, 
  Store, 
  ShieldCheck, 
  Package 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetOrderQuery } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { 
  motion, 
  AnimatedSuccessCheck, 
  triggerCelebrationConfetti, 
  FadeInStagger, 
  StaggerItem 
} from '@/components/ui/motion';

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatPrice, currencySymbol } = useCurrency();
  const orderId = searchParams.get('orderId');
  const [copied, setCopied] = useState(false);

  const { data: order, isLoading } = useGetOrderQuery(orderId || '', {
    skip: !orderId,
  });

  useEffect(() => {
    triggerCelebrationConfetti();
  }, []);

  const displayOrderId = order?.id || orderId || 'ORD-240509-001';

  // Resilient calculation of real total
  const totalAmountNum = Number(order?.totalAmount ?? order?.total ?? 0);
  const displayAmount = !isNaN(totalAmountNum) && totalAmountNum > 0
    ? formatPrice(totalAmountNum)
    : order?.totalAmount === 0 || order?.total === 0 ? formatPrice(0) : '—';

  // Payment method and labels
  const rawMethod = (order?.paymentMethod || order?.payment?.provider || order?.rawPaymentMethod || '').toUpperCase();
  const isCod = rawMethod.includes('COD') || rawMethod.includes('CASH');
  const isPickup = !order?.deliveryAddress || rawMethod.includes('PICKUP');
  
  const displayPaymentMethod = order?.paymentMethod 
    || (isCod ? (isPickup ? 'Cash on Pickup' : 'Cash on Delivery (COD)') : 'Prepaid (Online/UPI)');

  const amountLabel = isCod 
    ? (isPickup ? 'Amount to Pay on Pickup' : 'Amount to Pay on Delivery')
    : 'Total Paid';

  // Real timestamp format
  const displayDate = order?.createdAt 
    ? new Date(order.createdAt).toLocaleString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })
    : 'Just now';

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(displayOrderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const items = order?.items || [];
  const itemsCount = order?.itemsCount || items.reduce((acc: number, item: any) => acc + (item.quantity || item.qty || 1), 0);

  // Exact money breakdown computation
  const calculatedItemsTotal = items.reduce((sum: number, item: any) => {
    const price = Number(item.priceAt || item.price || item.product?.sellingPrice || 0);
    const qty = Number(item.quantity || item.qty || 1);
    return sum + (price * qty);
  }, 0);

  const deliveryFee = Number(order?.shippingFee ?? 0);
  const discountAmount = Number(order?.discountAmount ?? 0);
  const rawPlatformFee = Number(order?.platformFee ?? 0);
  const platformFee = rawPlatformFee > 0
    ? rawPlatformFee
    : calculatedItemsTotal > 0
      ? Math.max(0, Math.round((totalAmountNum - calculatedItemsTotal - deliveryFee + discountAmount) * 100) / 100)
      : 0;

  const itemsSubtotal = calculatedItemsTotal > 0 
    ? calculatedItemsTotal 
    : Math.max(0, totalAmountNum - deliveryFee - platformFee + discountAmount);

  const deliveryEstimate = (!order?.estimatedDelivery || order.estimatedDelivery.includes('2 - 4 hours'))
    ? '2-3 days'
    : order.estimatedDelivery;

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      <div className="flex-1 overflow-y-auto pb-44">
        {/* Success Header Box */}
        <div className="bg-white pt-12 pb-8 px-6 flex flex-col items-center text-center border-b border-[#E5E2DC]">
          <div className="mb-6">
            <AnimatedSuccessCheck size={84} color="#FF5A36" />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Order Placed Successfully</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-1.5 tracking-tight">
              Order Confirmed!
            </h1>
            <p className="text-sm text-gray-500 font-medium px-4">
              We've received your order and the seller is preparing your items.
            </p>
          </motion.div>
        </div>

        {/* Staggered Order Details Cards */}
        <FadeInStagger className="p-4 space-y-3.5">
          {/* 1. Core Order Summary Card */}
          <StaggerItem>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E2DC] space-y-3.5">
              <div className="flex justify-between items-center pb-3.5 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Order ID</span>
                <button 
                  onClick={handleCopyId}
                  className="flex items-center gap-1.5 font-mono font-bold text-xs text-gray-900 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 transition-colors"
                  title="Click to copy full Order ID"
                >
                  <span>#{displayOrderId.slice(0, 13)}</span>
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Payment Method</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-900 text-right">{displayPaymentMethod}</span>
                  {!isCod && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Paid
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500 font-medium block">{amountLabel}</span>
                  {isCod && (
                    <span className="text-[10px] text-gray-400 font-medium">Pay when order arrives</span>
                  )}
                </div>
                <span className="font-black text-[#FF5A36] text-xl tracking-tight">{displayAmount}</span>
              </div>
              
              <div className="flex justify-between items-center pt-3.5 border-t border-gray-100 text-xs">
                <span className="text-gray-500 font-medium">Date & Time</span>
                <span className="font-bold text-gray-700">{displayDate}</span>
              </div>
            </div>
          </StaggerItem>

          {/* 2. Delivery or Store Pickup Card */}
          <StaggerItem>
            {order?.deliveryAddress ? (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
                      Doorstep Delivery
                    </p>
                    <p className="font-bold text-gray-900 text-xs">
                      {deliveryEstimate}
                    </p>
                  </div>
                </div>
                <div className="bg-white/80 rounded-xl p-3 border border-emerald-100 text-xs text-gray-700 space-y-1">
                  <span className="font-bold text-gray-900 block text-[11px] uppercase tracking-wider text-emerald-900">
                    Shipping Address
                  </span>
                  <p className="font-medium whitespace-pre-line leading-relaxed text-gray-800">
                    {order.deliveryAddress}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-700">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-blue-800 font-bold uppercase tracking-wider">
                      Self Pickup at Store
                    </p>
                    <p className="font-bold text-gray-900 text-xs">
                      {order?.store?.name || 'Local Merchant Store'}
                    </p>
                  </div>
                </div>
                {order?.store?.address && (
                  <p className="text-xs text-gray-600 bg-white/80 p-2.5 rounded-xl border border-blue-100">
                    📍 {order.store.address}
                  </p>
                )}
                {order?.pickupOtp && (
                  <div className="bg-blue-600 text-white p-3 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Store Pickup OTP</p>
                      <p className="text-xs text-white/90 font-medium">Show this code to storekeeper</p>
                    </div>
                    <span className="font-mono font-black text-xl tracking-widest bg-white/20 px-3 py-1 rounded-lg">
                      {order.pickupOtp}
                    </span>
                  </div>
                )}
              </div>
            )}
          </StaggerItem>

          {/* 3. Items Summary Card */}
          {items.length > 0 && (
            <StaggerItem>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E2DC] space-y-3.5">
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#FF5A36]" />
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Ordered Items ({itemsCount})
                    </span>
                  </div>
                  {order?.store?.name && (
                    <span className="text-[11px] font-semibold text-gray-500 truncate max-w-[140px]">
                      {order.store.name}
                    </span>
                  )}
                </div>

                <div className="divide-y divide-gray-100">
                  {items.map((item: any, idx: number) => {
                    const itemImg = item.image || item.product?.imageUrl || item.product?.media?.[0]?.url;
                    const itemName = item.name || item.productName || item.title || 'Product Item';
                    const itemQty = item.quantity || item.qty || 1;
                    const itemPrice = Number(item.priceAt || item.price || 0);

                    return (
                      <div key={item.id || idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 relative overflow-hidden shrink-0 flex items-center justify-center">
                          {itemImg ? (
                            <Image 
                              src={itemImg} 
                              alt={itemName} 
                              fill 
                              className="object-cover"
                              sizes="48px" 
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate leading-snug">
                            {itemName}
                          </p>
                          {item.variantName && (
                            <p className="text-[10px] font-semibold text-gray-500">
                              Variant: {item.variantName}
                            </p>
                          )}
                          <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                            Qty: {itemQty} × {formatPrice(itemPrice)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-gray-900">
                            {formatPrice(itemPrice * itemQty)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-gray-800">{formatPrice(itemsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery Fee</span>
                    <span className={`font-semibold ${deliveryFee > 0 ? 'text-gray-800' : 'text-emerald-600'}`}>
                      {deliveryFee > 0 ? formatPrice(deliveryFee) : 'FREE'}
                    </span>
                  </div>
                  {platformFee > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Platform Fee</span>
                      <span className="font-semibold text-gray-800">{formatPrice(platformFee)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount</span>
                      <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 font-bold text-sm">
                    <span className="text-gray-900">{amountLabel}</span>
                    <span className="font-black text-[#FF5A36] text-base">{displayAmount}</span>
                  </div>
                </div>
              </div>
            </StaggerItem>
          )}

          {/* 4. Lokaya Guarantee Badge */}
          <StaggerItem>
            <div className="bg-gray-100/70 rounded-2xl p-3.5 flex items-center gap-3 border border-gray-200/60">
              <ShieldCheck className="w-6 h-6 text-[#FF5A36] shrink-0" />
              <div className="text-[11px] text-gray-600 leading-tight">
                <span className="font-bold text-gray-900 block mb-0.5">Lokaya Buyer Protection</span>
                Your purchase is covered by verified seller guarantee and live order telemetry.
              </div>
            </div>
          </StaggerItem>
        </FadeInStagger>
      </div>

      {/* Floating CTA Dock */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-[#E5E2DC] p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] space-y-2 z-30">
        <Button 
          onClick={() => router.push(`/orders/${displayOrderId}/track`)}
          className="w-full h-12 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
        >
          <span>Track Order Live</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/orders/${displayOrderId}`)}
            className="h-10 rounded-xl border-[#E5E2DC] bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs"
          >
            Order Details
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/home')}
            className="h-10 rounded-xl border-[#E5E2DC] bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
