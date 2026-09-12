'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Package, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetOrderQuery } from '@/lib/api';

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { data: order, isLoading } = useGetOrderQuery(orderId || '', {
    skip: !orderId
  });

  const displayOrderId = order?.id || orderId || 'ORD-240509-001';
  const displayAmount = order ? `₹${order.totalAmount?.toLocaleString('en-IN')}` : '₹4,298';
  const displayPaymentMethod = order?.payment?.provider || order?.paymentMethod || 'Online / UPI';
  const displayDate = order?.createdAt 
    ? new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Just now';

  return (
    <div className="min-h-screen bg-gray-50 pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      <div className="flex-1 overflow-y-auto">
        {/* Success Header Box */}
        <div className="bg-white pt-12 pb-8 px-6 flex flex-col items-center text-center border-b border-gray-100">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-[#FF6B00]/10 rounded-3xl flex items-center justify-center rotate-3">
              <Package className="w-12 h-12 text-[#FF6B00] -rotate-3" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <Check className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-sm text-gray-500 font-medium px-4">
            We've received your order and are getting it ready to be shipped.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <span className="text-sm text-gray-500 font-medium">Order ID</span>
              <span className="font-mono font-bold text-xs text-gray-900 truncate max-w-[200px]">
                #{displayOrderId.slice(0, 13)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">Payment Method</span>
              <span className="font-bold text-gray-900">{displayPaymentMethod}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">Total Amount</span>
              <span className="font-black text-gray-900 text-lg">{displayAmount}</span>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500 font-medium">Date & Time</span>
              <span className="font-bold text-gray-900 text-sm">{displayDate}</span>
            </div>
          </div>

          <div className="bg-[#208b5e]/5 border border-[#208b5e]/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#208b5e]/10 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-[#208b5e]" />
            </div>
            <div>
              <p className="text-xs text-[#208b5e] font-bold uppercase tracking-wider mb-0.5">Estimated Delivery</p>
              <p className="font-black text-gray-900 text-base">
                {order?.estimatedDelivery || 'Within 3 - 5 business days'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] space-y-3 z-30">
        <Button 
          onClick={() => router.push(`/orders/${displayOrderId}/track`)}
          className="w-full h-12 rounded-xl bg-[#FF6B00] hover:bg-[#ff7a1f] text-white font-bold text-base shadow-md active:scale-95 transition-all"
        >
          Track Order
        </Button>
        <Button 
          onClick={() => router.push('/home')}
          className="w-full h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-sm"
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
