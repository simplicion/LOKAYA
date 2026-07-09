'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';

const mockPayouts = [
  { id: 1, date: '20 May 2024', amount: 5340, status: 'Completed' },
  { id: 2, date: '13 May 2024', amount: 4890, status: 'Completed' },
  { id: 3, date: '06 May 2024', amount: 5120, status: 'Completed' },
  { id: 4, date: '29 Apr 2024', amount: 4750, status: 'Completed' },
];

export default function PayoutSummaryPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('This Month');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Payout Summary</h1>
        </div>
        
        <button className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          <span className="text-sm font-medium text-gray-700">{dateRange}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Payouts</p>
            <p className="text-xl font-bold text-gray-900">₹32,450</p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Payout Success Rate</p>
            <p className="text-xl font-bold text-gray-900">98.6%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900">Recent Payouts</h2>
          </div>
          
          {mockPayouts.map((payout, index) => (
            <div 
              key={payout.id}
              className={`p-4 flex items-center justify-between ${
                index !== mockPayouts.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div>
                <p className="font-semibold text-gray-900 text-sm">{payout.date}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <p className="font-bold text-gray-900 text-sm">₹{payout.amount.toLocaleString()}</p>
                <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {payout.status}
                </div>
              </div>
            </div>
          ))}
          
          <div className="p-4 border-t border-gray-50">
            <button className="w-full py-3 rounded-xl border border-indigo-200 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors">
              View All Payouts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
