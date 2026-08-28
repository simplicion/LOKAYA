'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, MapPin } from 'lucide-react';
import { MOCK_ORDERS } from '@/lib/mock/checkout';
import { notFound } from 'next/navigation';
import { cn } from '@/lib/utils';

import { use } from 'react';



export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const order = MOCK_ORDERS.find(o => o.id === resolvedParams.id);

  if (!order) {
    notFound();
  }

  // All possible states in order
  const ALL_STATES = ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  
  // Find current index to determine progress
  let currentIndex = ALL_STATES.indexOf(order.status);
  
  // Handle edge cases like cancelled/returned
  if (['CANCELLED', 'RETURNED', 'RETURN_REQUESTED'].includes(order.status)) {
    currentIndex = -1; 
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-4 flex items-center">
        <button onClick={() => router.back()} className="mr-4 text-gray-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Order Tracking</h1>
          <p className="text-xs text-gray-500">Order ID - {order.id}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Out for Delivery Card (From Mockup) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {order.status === 'DELIVERED' ? 'Delivered' : 
                 order.status === 'OUT_FOR_DELIVERY' ? 'Out for Delivery' : 
                 order.status === 'SHIPPED' ? 'Shipped' : 'Processing'}
              </h3>
              <p className="text-xs text-[#208b5e] font-semibold mt-1">
                {order.status === 'DELIVERED' 
                  ? 'Your order has been delivered successfully.' 
                  : `Your order will be delivered today by 9 PM`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400">Based on {order.date.split(',')[0]}</span>
            </div>
          </div>

          {/* Horizontal Progress Bar */}
          <div className="relative pt-2 pb-8">
            <div className="absolute top-4 left-4 right-4 h-1 bg-gray-100 rounded-full" />
            <div 
              className="absolute top-4 left-4 h-1 bg-[#208b5e] rounded-full transition-all duration-500" 
              style={{ width: currentIndex >= 0 ? `${(currentIndex / (ALL_STATES.length - 1)) * 100}%` : '0%' }}
            />
            
            <div className="flex justify-between relative z-10">
              {ALL_STATES.map((state, idx) => (
                <div key={state} className="flex flex-col items-center">
                  <div className={cn(
                    "w-3 h-3 rounded-full mb-2",
                    idx <= currentIndex ? "bg-[#208b5e] ring-4 ring-[#208b5e]/20" : "bg-gray-200"
                  )} />
                  <span className={cn(
                    "text-[10px] font-bold text-center",
                    idx <= currentIndex ? "text-[#208b5e]" : "text-gray-400"
                  )}>
                    {state.replace(/_/g, '\n')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Delivery Partner</span>
            <span className="font-bold text-gray-900 text-sm">Delhivery</span>
          </div>
          <div className="flex justify-between items-center py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Tracking ID</span>
            <span className="font-bold text-gray-900 text-sm">1234567890987</span>
          </div>
        </div>

        {/* Detailed Timeline */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Tracking Details</h3>
          
          <div className="relative pl-6 space-y-6">
            <div className="absolute top-2 bottom-2 left-2 w-0.5 bg-gray-100" />
            
            {order.tracking.slice().reverse().map((event, idx) => (
              <div key={idx} className="relative">
                <div className={cn(
                  "absolute -left-[26px] w-3 h-3 rounded-full border-2",
                  idx === 0 
                    ? "bg-[#FF6B00] border-[#FF6B00] ring-4 ring-[#FF6B00]/20" 
                    : "bg-white border-gray-300"
                )} />
                <div className="flex justify-between items-start mb-1">
                  <h4 className={cn("font-bold text-sm", idx === 0 ? "text-gray-900" : "text-gray-600")}>
                    {event.status.replace(/_/g, ' ')}
                  </h4>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-900">{event.date}</p>
                    <p className="text-[10px] text-gray-500">{event.time}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{event.description}</p>
                {event.location && (
                  <p className="text-xs font-semibold text-gray-700 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {event.location}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900">Deliver To</h3>
            <span className="text-xs font-bold text-[#FF6B00]">Change</span>
          </div>
          <p className="font-bold text-gray-900 text-sm">{order.deliveryAddress.name}</p>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
          </p>
          <p className="text-xs font-medium text-gray-900 mt-1">{order.deliveryAddress.phone}</p>
        </div>
      </div>
    </div>
  );
}
