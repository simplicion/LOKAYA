'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderHistoryDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-center py-4 relative px-4 sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900">Order Details</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4 pb-40">
        {/* Order Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-gray-900 text-[15px]">FreshMart</h2>
            <p className="font-bold text-gray-500 text-[13px]">#{params.id}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-[13px] font-medium">21 May, 12:00 PM</p>
            <div className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[11px] font-bold">
              Completed
            </div>
          </div>
        </div>

        {/* Items Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-900 text-[14px] mb-4">Items</h3>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 text-[13px] w-1/2">Banana (1kg)</span>
              <span className="text-gray-400 font-medium text-[13px] w-8 text-center">x1</span>
              <span className="font-bold text-gray-900 text-[14px] text-right w-12">₹40</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 text-[13px] w-1/2">Milk (1L)</span>
              <span className="text-gray-400 font-medium text-[13px] w-8 text-center">x1</span>
              <span className="font-bold text-gray-900 text-[14px] text-right w-12">₹60</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 text-[13px] w-1/2">Bread (Brown)</span>
              <span className="text-gray-400 font-medium text-[13px] w-8 text-center">x1</span>
              <span className="font-bold text-gray-900 text-[14px] text-right w-12">₹35</span>
            </div>
          </div>

          <div className="w-full h-[1px] bg-gray-100 my-4" />

          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-[13px] font-medium">Total Amount</span>
            <span className="font-black text-gray-900 text-[18px]">₹135</span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-[13px] font-medium">Payment</span>
            <span className="font-bold text-gray-900 text-[13px]">UPI</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[13px] font-medium">Pickup Time</span>
            <span className="font-bold text-gray-900 text-[13px]">ASAP (10-15 mins)</span>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe-offset-4 z-40 flex flex-col gap-3">
        <Button
          onClick={() => { }}
          variant="outline"
          className="w-full h-14 rounded-2xl border-indigo-100 text-indigo-600 font-bold text-[16px] hover:bg-indigo-50 bg-indigo-50/50 transition-all active:scale-[0.98]"
        >
          Reorder
        </Button>
        <Button
          onClick={() => router.push(`/home/order/${params.id}`)}
          className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[16px] shadow-[0_8px_30px_rgb(79,70,229,0.25)] transition-all active:scale-[0.98]"
        >
          View Order Status
        </Button>
      </div>
    </div>
  );
}
