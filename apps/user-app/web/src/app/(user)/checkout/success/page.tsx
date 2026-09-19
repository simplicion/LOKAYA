'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Loader2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetOrderQuery } from '@/lib/api';
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
  const orderId = searchParams.get('orderId');

  const { data: order, isLoading } = useGetOrderQuery(orderId || '', {
    skip: !orderId,
  });

  useEffect(() => {
    triggerCelebrationConfetti();
  }, []);

  const displayOrderId = order?.id || orderId || 'ORD-240509-001';
  const displayAmount = order ? `₹${order.totalAmount?.toLocaleString('en-IN')}` : '₹4,298';
  const displayPaymentMethod = order?.payment?.provider || order?.paymentMethod || 'Online / UPI';
  const displayDate = order?.createdAt 
    ? new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Just now';

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      <div className="flex-1 overflow-y-auto pb-32">
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
            <h1 className="text-2xl font-black text-gray-900 mb-1.5 tracking-tight">
              Order Confirmed!
            </h1>
            <p className="text-sm text-gray-500 font-medium px-4">
              We've received your order and the seller is preparing your items.
            </p>
          </motion.div>
        </div>

        {/* Staggered Order Details Cards */}
        <FadeInStagger className="p-4 space-y-4">
          <StaggerItem>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E2DC] space-y-3.5">
              <div className="flex justify-between items-center pb-3.5 border-b border-gray-100">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Order ID</span>
                <span className="font-mono font-bold text-xs text-gray-900 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                  #{displayOrderId.slice(0, 13)}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Payment Method</span>
                <span className="font-bold text-gray-900">{displayPaymentMethod}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Total Paid</span>
                <span className="font-black text-[#FF5A36] text-xl">{displayAmount}</span>
              </div>
              
              <div className="flex justify-between items-center pt-3.5 border-t border-gray-100 text-xs">
                <span className="text-gray-500 font-medium">Date & Time</span>
                <span className="font-bold text-gray-700">{displayDate}</span>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider mb-0.5">Estimated Delivery</p>
                <p className="font-black text-gray-900 text-sm">
                  {order?.estimatedDelivery || 'Within 2 - 4 hours (Express Local)'}
                </p>
              </div>
            </div>
          </StaggerItem>
        </FadeInStagger>
      </div>

      {/* Floating CTA Dock */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-[#E5E2DC] p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] space-y-2.5 z-30">
        <Button 
          onClick={() => router.push(`/orders/${displayOrderId}/track`)}
          className="w-full h-13 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-base shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
        >
          <span>Track Order Live</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <Button 
          variant="outline"
          onClick={() => router.push('/home')}
          className="w-full h-11 rounded-2xl border-[#E5E2DC] bg-white hover:bg-gray-50 text-gray-800 font-bold text-sm"
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
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
