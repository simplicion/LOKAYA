'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Gift, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EGiftCardsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-center py-4 relative px-4 sticky top-0 bg-white z-50 border-b border-gray-100">
        <button onClick={() => router.back()} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900">E-gift cards</h1>
      </div>

      {/* Balance Card */}
      <div className="p-4 pt-6">
        <div className="w-full bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/30 rounded-full blur-xl -ml-10 -mb-10"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-8">
              <span className="text-indigo-100 font-medium text-sm tracking-wide">E-GIFT BALANCE</span>
              <Gift className="w-6 h-6 text-indigo-300" />
            </div>
            
            <div>
              <span className="text-4xl font-black tracking-tight">₹0.00</span>
              <p className="text-indigo-200 text-xs mt-2 font-medium">Valid across all Snapick stores</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 flex gap-3">
        <Button 
          onClick={() => {}}
          className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[15px] shadow-[0_8px_30px_rgb(79,70,229,0.25)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Card
        </Button>
        <Button 
          onClick={() => {}}
          variant="outline"
          className="flex-1 h-14 rounded-2xl border-2 border-indigo-100 text-indigo-700 font-bold text-[15px] hover:bg-indigo-50 bg-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Gift className="w-5 h-5" />
          Buy Gift Card
        </Button>
      </div>

      <div className="mt-8 px-4">
        <h3 className="font-bold text-gray-900 mb-4 px-1 text-[15px]">Recent Transactions</h3>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <Gift className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium text-sm">No recent transactions</p>
          <p className="text-gray-400 text-xs mt-1">Your e-gift card activity will appear here.</p>
        </div>
      </div>
    </div>
  );
}
