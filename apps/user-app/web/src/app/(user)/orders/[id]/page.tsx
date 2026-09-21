'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Box, 
  Download, 
  RotateCcw, 
  HeadphonesIcon, 
  MapPin, 
  Truck, 
  Loader2, 
  Package, 
  ExternalLink,
  ShieldCheck,
  Star
} from 'lucide-react';
import { useGetOrderQuery } from '@/lib/api';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const orderId = resolvedParams.id;
  const { formatPrice } = useCurrency();

  const { data: order, isLoading } = useGetOrderQuery(orderId, { skip: !orderId });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading Order Details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-3">
          <Package className="w-8 h-8 text-gray-300" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Order Not Found</h2>
        <p className="text-xs text-gray-500 mb-4">We could not locate this order in your purchase records.</p>
        <Button onClick={() => router.push('/orders')} className="h-10 px-5 rounded-xl bg-[#FF6B00] text-white text-xs font-bold">
          View All Orders
        </Button>
      </div>
    );
  }

  const rawStatus = (order.status || 'PENDING').toUpperCase();
  const isDelivered = rawStatus === 'DELIVERED';
  const isCancellable = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'].includes(rawStatus);

  const formatDateTime = (dateStr?: string | Date | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const orderDateStr = formatDateTime(order.createdAt) || 'Recent Order';
  const deliveredDateStr = formatDateTime(order.deliveredAt);
  const pickedUpDateStr = formatDateTime(order.pickedUpAt);

  const rawEstimatedDelivery = order.estimatedDelivery;
  const estimatedDelivery = (!rawEstimatedDelivery || rawEstimatedDelivery.includes('2 - 4 hours'))
    ? '2-3 days'
    : rawEstimatedDelivery;

  // Exact money breakdown computation
  const calculatedItemsTotal = (order.items || []).reduce((sum: number, item: any) => {
    const price = Number(item.priceAt || item.price || item.product?.sellingPrice || 0);
    const qty = Number(item.quantity || item.qty || 1);
    return sum + (price * qty);
  }, 0);
  const deliveryFee = Number(order.shippingFee || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const rawPlatformFee = Number(order.platformFee || 0);
  const totalAmountNum = Number(order.totalAmount || 0);
  const platformFee = rawPlatformFee > 0
    ? rawPlatformFee
    : calculatedItemsTotal > 0
      ? Math.max(0, Math.round((totalAmountNum - calculatedItemsTotal - deliveryFee + discountAmount) * 100) / 100)
      : 0;
  const itemsSubtotal = calculatedItemsTotal > 0 
    ? calculatedItemsTotal 
    : Math.max(0, totalAmountNum - deliveryFee - platformFee + discountAmount);

  return (
    <div className="min-h-screen bg-gray-50 pb-28 flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.back()} 
            className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-gray-800 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-black text-gray-900 tracking-tight">Order Details</h1>
        </div>
        <span className="text-xs font-mono font-bold text-gray-500">#{order.id.slice(0, 8)}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        
        {/* Status Banner */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-500">Placed on {orderDateStr}</span>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF6B00] border border-orange-200">
              {rawStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="bg-orange-50/70 border border-orange-100 rounded-xl p-3.5 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-xs">
                {isDelivered ? 'Delivered Successfully' : 
                 rawStatus === 'ARRIVED_AT_CUSTOMER' || rawStatus === 'ARRIVED_AT_DESTINATION' ? 'Rider Arrived at Destination' :
                 rawStatus === 'SHIPPED' ? (order.awbCode ? `In Transit (${order.courierName || 'Shiprocket Express'})` : 'In Transit (Dispatched)') :
                 rawStatus === 'OUT_FOR_DELIVERY' ? 'Out for Delivery Today' :
                 'Order Confirmed & Processing'}
              </h3>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {isDelivered 
                  ? (deliveredDateStr ? `Package delivered on ${deliveredDateStr}.` : 'Package delivered to your address.') 
                  : (pickedUpDateStr ? `Dispatched at ${pickedUpDateStr} • Expected: ${estimatedDelivery}` : `Expected delivery: ${estimatedDelivery}`)}
              </p>
              
              <Button 
                onClick={() => router.push(`/orders/${order.id}/track`)}
                className="mt-3 w-full h-8 rounded-lg bg-[#FF6B00] hover:bg-[#ff7a1f] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Live Delivery Tracking</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Secure Handover OTP Banner */}
          {!isDelivered && (order.deliveryOtp || order.pickupOtp) && (
            <div className="bg-[#0F172A] text-white rounded-xl p-3 flex items-center justify-between border border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Delivery OTP:</span>
                <span className="font-mono text-sm tracking-widest text-emerald-300 font-black">
                  {order.deliveryOtp || order.pickupOtp}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Share with Rider at Doorstep</span>
            </div>
          )}

          {/* Courier Telemetry if assigned */}
          {order.awbCode && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
              <span className="text-gray-500">AWB: <span className="font-mono font-bold text-gray-900">{order.awbCode}</span></span>
              <span className="font-semibold text-gray-700">{order.courierName || 'Standard Surface'}</span>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-gray-900 text-sm">Items in this Order</h3>
            <span className="text-xs text-gray-400 font-semibold">{order.items?.length || 0} items</span>
          </div>

          <div className="divide-y divide-gray-100">
            {order.items?.map((item: any) => {
              const itemImg = item.product?.media?.[0]?.url || item.product?.imageUrl || '';
              return (
                <div key={item.id} className="py-3 flex gap-3.5 items-center first:pt-0 last:pb-0">
                  <div 
                    onClick={() => item.productId && router.push(`/product/${item.productId}`)}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 cursor-pointer flex items-center justify-center"
                  >
                    {itemImg ? (
                      <Image 
                        src={itemImg} 
                        alt={item.productName || 'Product'} 
                        fill 
                        className="object-cover" 
                        sizes="64px"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 
                      onClick={() => item.productId && router.push(`/product/${item.productId}`)}
                      className="font-bold text-gray-900 text-xs leading-tight truncate cursor-pointer hover:text-[#FF6B00]"
                    >
                      {item.productName || item.product?.name}
                    </h4>
                    
                    {item.variant?.name && (
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {item.variant.name}
                      </span>
                    )}

                    <div className="flex justify-between items-center mt-1.5">
                      <span className="font-black text-gray-900 text-xs">
                        {formatPrice((item.priceAt || item.product?.sellingPrice || 0) * (item.quantity || 1))}
                      </span>
                      <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                        Qty: {item.quantity}
                      </span>
                    </div>

                    {isDelivered && (
                      <button
                        onClick={() => router.push(`/orders/${order.id}/review?productId=${item.productId || item.product?.id}`)}
                        className="mt-2 text-xs font-bold text-[#FF5A36] hover:text-[#e04d2d] flex items-center gap-1.5 border border-orange-200/80 bg-orange-50/60 px-3 py-1.5 rounded-xl w-fit cursor-pointer transition-all active:scale-95"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Write a Review</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2.5">
          <h3 className="font-extrabold text-gray-900 text-sm">Delivery Address</h3>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs leading-relaxed text-gray-700">
              {order.deliveryAddress ? (
                <p className="font-medium whitespace-pre-line">{order.deliveryAddress}</p>
              ) : (
                <p className="text-gray-500 italic">No specific delivery address recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <h3 className="font-extrabold text-gray-900 text-sm">Payment Summary</h3>
          
          <div className="space-y-2 text-xs border-b border-gray-100 pb-3">
            <div className="flex justify-between text-gray-600">
              <span>Items Total</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(itemsSubtotal)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charges</span>
              <span className={`font-semibold ${deliveryFee > 0 ? 'text-gray-900' : 'text-emerald-600'}`}>
                {deliveryFee > 0 ? formatPrice(deliveryFee) : 'FREE'}
              </span>
            </div>
            {platformFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Platform Fee</span>
                <span className="font-semibold text-gray-900">{formatPrice(platformFee)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount</span>
                <span className="font-semibold">-{formatPrice(discountAmount)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <span className="font-extrabold text-gray-900 text-sm">Total Paid</span>
            <span className="font-black text-[#FF6B00] text-base">
              {formatPrice(order.totalAmount || 0)}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Paid via {order.paymentMethod || 'ONLINE'}</span>
          </div>
        </div>

        {/* Action Grid */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm grid grid-cols-2 gap-2.5 text-xs">
          {isDelivered && (
            <Button 
              variant="outline" 
              onClick={() => router.push(`/orders/${order.id}/review`)}
              className="h-10 rounded-xl border-gray-200 font-bold text-gray-800 text-xs"
            >
              Rate & Review
            </Button>
          )}

          <Button 
            variant="outline" 
            onClick={() => router.push(`/orders/${order.id}/invoice`)}
            className="h-10 rounded-xl border-gray-200 font-bold text-gray-800 text-xs flex items-center justify-center gap-1.5 hover:bg-orange-50 hover:border-orange-200 hover:text-[#FF6B00] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#FF6B00]" />
            Tax Invoice
          </Button>

          <Button 
            variant="outline" 
            onClick={() => router.push(`/support?orderId=${order.id}&tab=raise`)}
            className="h-10 rounded-xl border-gray-200 font-bold text-gray-800 text-xs flex items-center justify-center gap-1.5 hover:bg-orange-50 hover:border-orange-200 hover:text-[#FF6B00] transition-colors"
          >
            <HeadphonesIcon className="w-3.5 h-3.5" />
            Help
          </Button>
        </div>

      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-3.5 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
        <Button 
          onClick={() => router.push('/')}
          className="w-full h-11 rounded-xl bg-[#FF6B00] hover:bg-[#ff7a1f] text-white font-bold text-xs tracking-wide uppercase shadow-md flex items-center justify-center gap-2"
        >
          <Box className="w-4 h-4" />
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
