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

  const { data: trackingData, isLoading: isTrackingLoading, refetch } = useGetOrderTrackingQuery(orderId, {
    pollingInterval: 3000
  });
  const { data: orderDetails, isLoading: isOrderLoading } = useGetOrderQuery(orderId, {
    pollingInterval: 3000
  });

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
  const rawEstimatedDelivery = trackingData?.estimatedDelivery || orderDetails?.estimatedDelivery;
  const isHoursOrExpress = rawEstimatedDelivery && (
    rawEstimatedDelivery.toLowerCase().includes('hour') || 
    rawEstimatedDelivery.toLowerCase().includes('express') ||
    rawEstimatedDelivery.includes('2-4') ||
    rawEstimatedDelivery.includes('2 - 4') ||
    rawEstimatedDelivery.includes('2 – 4') ||
    rawEstimatedDelivery.includes('2—4')
  );
  const estimatedDelivery = (!rawEstimatedDelivery || isHoursOrExpress)
    ? '2-3 days'
    : rawEstimatedDelivery;
  const deliveryAddress = trackingData?.deliveryAddress || orderDetails?.deliveryAddress || null;
  const deliveryOtp = trackingData?.deliveryOtp || orderDetails?.deliveryOtp || null;
  const deliveryPartner = trackingData?.deliveryPartner || orderDetails?.deliveryPartner;

  // Progress computation
  const isArrived = ['ARRIVED_AT_CUSTOMER', 'ARRIVED_AT_DESTINATION', 'ARRIVED'].includes(rawStatus);
  const ALL_STATES = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'DELIVERED'];
  let activeIndex = ALL_STATES.indexOf(rawStatus);
  if (activeIndex === -1) {
    if (['PROCESSING'].includes(rawStatus)) activeIndex = 2;
    else if (isArrived) activeIndex = 5;
  }
  const progressPercent = activeIndex >= 0 ? Math.round((activeIndex / (ALL_STATES.length - 1)) * 100) : 10;

  // Timeline events from backend
  const timeline = trackingData?.timeline && trackingData.timeline.length > 0 ? trackingData.timeline : [
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
      completed: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(rawStatus),
      time: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(rawStatus) ? 'Ready' : null
    },
    {
      title: 'Courier In Transit',
      description: courierName ? `Handed over to ${courierName} (AWB: ${awbCode || 'Assigned'})` : 'Awaiting courier pickup.',
      completed: ['SHIPPED', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(rawStatus),
      time: ['SHIPPED', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(rawStatus) ? 'In Transit' : null
    },
    {
      title: 'Out for Delivery',
      description: 'Delivery partner has reached your local hub and is out for delivery.',
      completed: ['OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(rawStatus),
      time: ['OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(rawStatus) ? 'Out Today' : null
    },
    {
      title: 'Arrived at Destination',
      description: isArrived || rawStatus === 'DELIVERED'
        ? `${deliveryPartner?.name || 'Rider'} has arrived at your destination and is at your doorstep.`
        : `${deliveryPartner?.name || 'Rider'} will reach your destination shortly.`,
      completed: ['ARRIVED_AT_CUSTOMER', 'ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(rawStatus),
      time: ['ARRIVED_AT_CUSTOMER', 'ARRIVED_AT_DESTINATION', 'DELIVERED'].includes(rawStatus) ? 'Arrived' : null
    },
    {
      title: 'Delivered',
      description: 'Package delivered to your doorstep.',
      completed: rawStatus === 'DELIVERED',
      time: rawStatus === 'DELIVERED' ? 'Delivered' : null
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 flex flex-col max-w-md mx-auto relative shadow-2xl font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-[#E5E2DC] sticky top-0 z-30 px-4 h-14 flex items-center gap-3">
        <button 
          onClick={() => router.back()} 
          className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors border border-gray-200"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-extrabold text-[#171717] leading-none">Order Tracking</h1>
          <p className="text-[11px] font-mono text-gray-500 truncate mt-0.5">
            #{orderId.slice(0, 16)}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        
        {/* Status Card & Horizontal Progress Bar */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E2DC] shadow-xs space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF5A36] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                {rawStatus.replace(/_/g, ' ')}
              </span>
              <h2 className="font-black text-[#171717] text-lg mt-2">
                {rawStatus === 'DELIVERED' ? 'Delivered to Doorstep' :
                 isArrived ? 'Rider Arrived at Your Destination' :
                 rawStatus === 'OUT_FOR_DELIVERY' ? 'Out for Delivery Today' :
                 rawStatus === 'SHIPPED' ? 'On the Way' :
                 rawStatus === 'PACKED' ? 'Order Packed & Ready' :
                 'Order Confirmed'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Estimated Delivery: <span className="font-bold text-[#171717]">{estimatedDelivery}</span>
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF5A36] flex items-center justify-center shrink-0 border border-orange-100">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          {/* Progress Track */}
          <div className="pt-2">
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#FF5A36] to-emerald-500 rounded-full transition-all duration-700" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2">
              <span className={activeIndex >= 0 ? 'text-[#FF5A36]' : ''}>Confirmed</span>
              <span className={activeIndex >= 2 ? 'text-[#FF5A36]' : ''}>Packed</span>
              <span className={activeIndex >= 3 ? 'text-[#FF5A36]' : ''}>Shipped</span>
              <span className={activeIndex >= 5 ? 'text-[#FF5A36]' : ''}>Arrived</span>
              <span className={activeIndex >= 6 ? 'text-emerald-600' : ''}>Delivered</span>
            </div>
          </div>
        </div>

        {/* SECURE CUSTOMER DELIVERY OTP CARD (Clean Lokaya Design System) */}
        {rawStatus !== 'DELIVERED' && deliveryOtp && (
          <div className="bg-white rounded-2xl p-5 border border-[#E5E2DC] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Secure Delivery OTP</span>
              </span>
              <span className="text-xs text-gray-500 font-medium">Handover Verification</span>
            </div>

            <div className="bg-[#FAF9F6] rounded-xl p-4 text-center border border-[#E5E2DC]">
              <span className="text-3xl sm:text-4xl font-mono font-black tracking-[0.4em] text-[#171717]">
                {deliveryOtp}
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed text-center">
              Share this 4-digit code with your delivery partner <span className="text-[#171717] font-bold">only upon receiving your package</span> at your doorstep.
            </p>
          </div>
        )}

        {/* ASSIGNED DELIVERY PARTNER CARD */}
        {deliveryPartner && (
          <div className="bg-white rounded-2xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Delivery Rider</span>
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF5A36] font-bold flex items-center justify-center overflow-hidden shrink-0 border border-orange-100">
                  {deliveryPartner.avatarUrl ? (
                    <img src={deliveryPartner.avatarUrl} alt={deliveryPartner.name} className="w-full h-full object-cover" />
                  ) : (
                    deliveryPartner.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#171717]">{deliveryPartner.name}</h4>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {deliveryPartner.vehicleType} • {deliveryPartner.vehicleNumber}
                  </p>
                </div>
              </div>

              {deliveryPartner.phone && (
                <a
                  href={`tel:${deliveryPartner.phone}`}
                  className="px-3.5 py-2 rounded-xl bg-orange-50 text-[#FF5A36] hover:bg-orange-100 transition-colors text-xs font-bold flex items-center gap-1.5 border border-orange-200"
                  title="Call Delivery Partner"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* 3PL Courier Details Card (if courier assigned or shipped) */}
        {awbCode && (
          <div className="bg-white rounded-2xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5A36] flex items-center justify-center font-bold text-xs border border-orange-100">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#171717] text-xs">Logistics Tracking</h3>
                  <p className="text-[11px] text-gray-500">{courierName || 'Express Courier'}</p>
                </div>
              </div>

              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                LIVE AWB
              </span>
            </div>

            <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E2DC] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">AWB Number</span>
                <span className="font-mono font-bold text-[#171717]">{awbCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Logistics Provider</span>
                <span className="font-bold text-[#171717]">{courierName || 'Express Courier'}</span>
              </div>
            </div>

            {trackingUrl && (
              <Button
                onClick={() => window.open(trackingUrl, '_blank')}
                className="w-full h-10 bg-white hover:bg-gray-50 text-[#FF5A36] border border-[#FF5A36] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Live Courier Telemetry</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}

        {/* Vertical Milestones Timeline */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E2DC] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#171717] text-sm">Delivery Milestones</h3>
            <span className="text-[11px] text-gray-400 font-medium">Real-time Telemetry</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {timeline.map((step: any, idx: number) => {
              const isCompleted = step.completed;
              const formatTimestamp = (ts: any) => {
                if (!ts) return null;
                const d = new Date(ts);
                if (isNaN(d.getTime())) return null;
                const now = new Date();
                const isToday = d.toDateString() === now.toDateString();
                const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                return isToday ? `Today, ${time}` : `${dateStr}, ${time}`;
              };

              const displayTime = step.displayTime || (step.timestamp ? formatTimestamp(step.timestamp) : (step.time && step.time !== 'Done' && step.time !== 'Ready' && step.time !== 'In Transit' && step.time !== 'Out Today' && step.time !== 'Delivered' && step.time !== 'Confirmed' ? step.time : (step.timestamp ? formatTimestamp(step.timestamp) : null)));

              return (
                <div key={idx} className="relative group">
                  {/* Status Bullet */}
                  <div className={cn(
                    "absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center transition-colors shadow-xs",
                    isCompleted ? "bg-[#FF5A36] text-white" : step.isCurrent ? "bg-amber-500 text-white animate-pulse" : "bg-gray-300 text-transparent"
                  )}>
                    <CheckCircle2 className="w-3 h-3" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className={cn("text-xs font-bold", isCompleted ? "text-[#171717]" : step.isCurrent ? "text-amber-900" : "text-gray-400")}>
                          {step.title}
                        </h4>
                        {step.isCurrent && !isCompleted && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-extrabold border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            Active Now
                          </span>
                        )}
                      </div>

                      {displayTime && (
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 tracking-tight",
                          isCompleted ? "bg-orange-50 text-[#FF5A36] border border-orange-100 font-bold" : "text-gray-400 bg-gray-50 border border-gray-100"
                        )}>
                          {displayTime}
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
        {deliveryAddress && (
          <div className="bg-white rounded-2xl p-5 border border-[#E5E2DC] shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF5A36] flex items-center justify-center shrink-0 border border-orange-100">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <h4 className="font-bold text-[#171717] text-xs uppercase tracking-wider mb-1">Delivery Destination</h4>
              <p className="text-gray-600 leading-relaxed">
                {deliveryAddress}
              </p>
            </div>
          </div>
        )}

        {/* Return to Home Action */}
        <div className="pt-2">
          <Button
            onClick={() => router.push('/home')}
            className="w-full h-11 rounded-xl bg-white hover:bg-gray-50 text-[#171717] font-bold text-xs border border-[#E5E2DC] shadow-xs"
          >
            Continue Exploring Lokaya
          </Button>
        </div>

      </div>
    </div>
  );
}
