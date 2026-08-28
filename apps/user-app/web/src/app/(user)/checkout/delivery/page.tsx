'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DELIVERY_OPTIONS = [
  { id: 'free', title: 'FREE Delivery', duration: '5-7 Days', price: 0 },
  { id: 'express', title: 'Express Delivery', duration: '2-3 Days', price: 150 },
  { id: 'sameday', title: 'Same Day Delivery', duration: 'Today by 10 PM', price: 250 },
];

export default function DeliveryOptionsPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>('free');

  return (
    <div className="min-h-screen bg-white pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => router.back()} className="mr-4 text-gray-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Delivery Options</h1>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {DELIVERY_OPTIONS.map((option) => (
          <div 
            key={option.id}
            onClick={() => setSelectedId(option.id)}
            className={cn(
              "border-2 rounded-2xl p-4 transition-all cursor-pointer flex items-center justify-between",
              selectedId === option.id ? "border-[#FF6B00] bg-[#FF6B00]/5" : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="mt-0.5">
                {selectedId === option.id ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#FF6B00] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900">{option.title}</h3>
                <p className="text-sm text-gray-500 font-medium">{option.duration}</p>
              </div>
            </div>
            
            <div className="font-bold text-gray-900">
              {option.price === 0 ? <span className="text-[#208b5e]">FREE</span> : `₹${option.price}`}
            </div>
          </div>
        ))}
      </div>

      {/* Trust Bottom Info */}
      <div className="flex divide-x divide-gray-200 border-t border-gray-100 bg-gray-50/50 py-4 mb-[80px]">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <svg className="w-5 h-5 text-gray-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.67-5.68"/></svg>
          <span className="text-xs font-bold text-gray-700">Easy Returns</span>
          <span className="text-[10px] text-gray-500">7 days return</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <svg className="w-5 h-5 text-gray-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span className="text-xs font-bold text-gray-700">Secure Payment</span>
          <span className="text-[10px] text-gray-500">100% secure transactions</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <svg className="w-5 h-5 text-gray-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span className="text-xs font-bold text-gray-700">Original Products</span>
          <span className="text-[10px] text-gray-500">Direct from brands</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button 
          onClick={() => router.push('/checkout/summary')}
          className="w-full h-12 rounded-xl bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold text-lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
