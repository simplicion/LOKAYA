'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOCK_ORDERS } from '@/lib/mock/checkout';
import Image from 'next/image';

export default function OrderSummaryPage() {
  const router = useRouter();
  const order = MOCK_ORDERS[0]; // Using mock data to populate cart items

  return (
    <div className="min-h-screen bg-gray-50 pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 shadow-sm">
        <button onClick={() => router.back()} className="mr-4 text-gray-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Order Summary</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Items List */}
        <div className="bg-white p-4 mb-2">
          {order.items.map((item, index) => (
            <div key={item.id} className={`flex gap-4 py-4 ${index !== 0 ? 'border-t border-gray-100' : ''}`}>
              <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</span>
                  <span className="font-black text-gray-900">₹{item.price.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bill Breakdown */}
        <div className="bg-white p-4 mb-24">
          <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal (2 items)</span>
              <span className="font-medium text-gray-900">₹5,498</span>
            </div>
            <div className="flex justify-between text-[#208b5e]">
              <span>Discount</span>
              <span className="font-medium">-₹1,200</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charges</span>
              <span className="font-medium text-[#208b5e]">FREE</span>
            </div>
            
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-900 text-base">Total Amount</span>
              <span className="font-black text-gray-900 text-xl">₹4,298</span>
            </div>
            <p className="text-xs font-semibold text-[#208b5e] pt-1">You will save ₹1,200 on this order</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button 
          onClick={() => router.push('/checkout/payment')}
          className="w-full h-12 rounded-xl bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold text-lg"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}
