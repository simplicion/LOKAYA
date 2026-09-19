'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  MapPin, 
  Truck, 
  Package, 
  CheckCircle2, 
  ExternalLink, 
  Clock, 
  ShieldCheck, 
  Loader2,
  Store as StoreIcon,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetOrderTrackingQuery, useGetOrderQuery } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const { data: trackingData, isLoading: isTrackingLoading, refetch } = useGetOrderTrackingQuery(orderId);
  const { data: orderDetails, isLoading: isOrderLoading } = useGetOrderQuery(orderId);

  const isLoading = isTrackingLoading && isOrderLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading Tracking Telemetry...</span>
      </div>
    );
  }

  // Active status
  const rawStatus = (trackingData?.status || orderDetails?.status || 'PENDING').toUpperCase();
  const courierName = trackingData?.courierName || orderDetails?.courierName || (rawStatus === 'SHIPPED' ? 'Standard Surface' : null);
  const awbCode = trackingData?.awbCode || orderDetails?.awbCode;
  const trackingUrl = trackingData?.trackingUrl || orderDetails?.trackingUrl;
  const estimatedDelivery = trackingData?.estimatedDelivery || orderDetails?.estimatedDelivery || 'Within 3 - 5 business days';
  const deliveryAddress = trackingData?.deliveryAddress || orderDetails?.deliveryAddress || 'Customer Address';

  // Progress computation
  const ALL_STATES = ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  let activeIndex = ALL_STATES.indexOf(rawStatus);
  if (rawStatus === 'PENDING') activeIndex = 0;
  if (activeIndex === -1 && ['PROCESSING'].includes(rawStatus)) activeIndex = 1;
  const progressPercent = activeIndex >= 0 ? Math.round((activeIndex / (ALL_STATES.length - 1)) * 100) : 10;

  // Timeline events
  const timeline = trackingData?.timeline || [
    {
      title: 'Order Placed',
      description: 'Your order was successfully submitted.',
      completed: true,
      time: orderDetails?.createdAt ? new Date(orderDetails.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Done'
    },
    {
      title: 'Order Confirmed',
      description: 'Payment verified and confirmed.',
      completed: rawStatus !== 'PENDING',
      time: rawStatus !== 'PENDING' ? 'Confirmed' : 'Pending'
    },
    {
      title: 'Packed at Merchant Store',
      description: `Packed and sealed by ${trackingData?.storeName || orderDetails?.store?.name || 'Seller'}.`,
      completed: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(rawStatus),
      time: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(rawStatus) ? 'Ready' : null
    },
    {
      title: 'Courier In Transit',
      description: courierName ? `Handed over to ${courierName} (AWB: ${awbCode || 'Assigned'})` : 'Awaiting courier pickup.',
      completed: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(rawStatus),
      time: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(rawStatus) ? 'In Transit' : null
    },
    {
      title: 'Out for Delivery',
      description: 'Delivery partner has reached your local hub and is out for delivery.',
      completed: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(rawStatus),
      time: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(rawStatus) ? 'Out Today' : null
    },
    {
      title: 'Delivered',
      description: 'Package delivered to your doorstep.',
      completed: rawStatus === 'DELIVERED',
      time: rawStatus === 'DELIVERED' ? 'Delivered' : null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 flex flex-col max-w-lg mx-auto relative shadow-2xl">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 px-4 h-14 flex items-center gap-3">
        <button 
          onClick={() => router.back()} 
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-extrabold text-gray-900 leading-none">Order Tracking</h1>
          <p className="text-[11px] font-mono text-gray-500 truncate mt-0.5">
            #{orderId.slice(0, 16)}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Status Card & Horizontal Progress Bar */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF6B00] bg-orange-50 px-2.5 py-1 rounded-full">
                {rawStatus.replace(/_/g, ' ')}
              </span>
              <h2 className="font-black text-gray-900 text-lg mt-2">
                {rawStatus === 'DELIVERED' ? 'Delivered to Doorstep' :
                 rawStatus === 'OUT_FOR_DELIVERY' ? 'Out for Delivery Today' :
                 rawStatus === 'SHIPPED' ? 'On the Way' :
                 rawStatus === 'PACKED' ? 'Order Packed & Ready' :
                 'Order Confirmed'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Estimated Delivery: <span className="font-bold text-gray-800">{estimatedDelivery}</span>
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF6B00] flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
          </div>

          {/* Progress Track */}
          <div className="pt-2">
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full transition-all duration-700" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2">
              <span className={activeIndex >= 0 ? 'text-[#FF6B00]' : ''}>Confirmed</span>
              <span className={activeIndex >= 1 ? 'text-[#FF6B00]' : ''}>Packed</span>
              <span className={activeIndex >= 2 ? 'text-[#FF6B00]' : ''}>Shipped</span>
              <span className={activeIndex >= 4 ? 'text-emerald-600' : ''}>Delivered</span>
            </div>
          </div>
        </div>

        {/* 3PL Courier Details Card (if courier assigned or shipped) */}
        {awbCode && (
          <div className="bg-gradient-to-br from-white to-orange-50/40 rounded-3xl p-5 border border-orange-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs">Logistics Tracking</h3>
                  <p className="text-[11px] text-gray-500">{courierName || 'Express Courier'}</p>
                </div>
              </div>

              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                LIVE AWB
              </span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-gray-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">AWB Number</span>
                <span className="font-mono font-bold text-gray-900">{awbCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Logistics Provider</span>
                <span className="font-bold text-gray-900">{courierName || 'Express Courier'}</span>
              </div>
            </div>

            {trackingUrl && (
              <Button
                onClick={() => window.open(trackingUrl, '_blank')}
                className="w-full h-11 bg-white hover:bg-gray-50 text-[#FF6B00] border-2 border-[#FF6B00] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Live Courier Telemetry</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}

        {/* Vertical Milestones Timeline */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Delivery Milestones</h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {timeline.map((step: any, idx: number) => {
              const isCompleted = step.completed;
              return (
                <div key={idx} className="relative group">
                  {/* Status Bullet */}
                  <div className={cn(
                    "absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center transition-colors shadow-sm",
                    isCompleted ? "bg-[#FF6B00] text-white" : "bg-gray-300 text-transparent"
                  )}>
                    <CheckCircle2 className="w-3 h-3" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("text-xs font-bold", isCompleted ? "text-gray-900" : "text-gray-400")}>
                        {step.title}
                      </h4>
                      {step.time && (
                        <span className="text-[10px] font-semibold text-gray-400">
                          {step.time}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Address Card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">
            <MapPin className="w-5 h-5 text-[#FF6B00]" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <h4 className="font-bold text-gray-900 text-sm mb-1">Delivery Destination</h4>
            <p className="text-gray-600 leading-relaxed">
              {deliveryAddress}
            </p>
          </div>
        </div>

        {/* Return to Home Action */}
        <div className="pt-2">
          <Button
            onClick={() => router.push('/home')}
            className="w-full h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs"
          >
            Continue Exploring Lokaya
          </Button>
        </div>

      </div>
    </div>
  );
}
