'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const mockTransactions = [
  { id: 1, title: 'Order #ORD12345', date: '24 May, 12:00 PM', amount: 245, type: 'Credit' },
  { id: 2, title: 'Order #ORD12344', date: '24 May, 11:30 AM', amount: 320, type: 'Credit' },
  { id: 3, title: 'Payout to Bank **4042', date: '20 May, 10:00 AM', amount: -32240, type: 'Payout' },
  { id: 4, title: 'Order #ORD12343', date: '19 May, 11:30 AM', amount: 1150, type: 'Credit' },
  { id: 5, title: 'Refund #REF1234', date: '18 May, 09:30 PM', amount: -145, type: 'Refund' },
];

export default function TransactionsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredTransactions = mockTransactions.filter(t => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Credits') return t.type === 'Credit';
    if (activeFilter === 'Debits') return t.type === 'Refund'; // Group refunds as debits for this UI
    if (activeFilter === 'Payouts') return t.type === 'Payout';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Credits', 'Debits', 'Payouts'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filteredTransactions.map((transaction, index) => (
            <div 
              key={transaction.id}
              className={`p-4 flex items-center justify-between ${
                index !== filteredTransactions.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div>
                <p className="font-semibold text-gray-900 text-sm">{transaction.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{transaction.date}</p>
              </div>
              
              <div className="text-right">
                <p className={`font-bold text-sm ${
                  transaction.type === 'Credit' ? 'text-emerald-600' :
                  transaction.type === 'Refund' ? 'text-red-500' :
                  'text-gray-900'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                </p>
                <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                  transaction.type === 'Credit' ? 'text-emerald-600' :
                  transaction.type === 'Refund' ? 'text-red-500' :
                  'text-indigo-600'
                }`}>
                  {transaction.type}
                </p>
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No transactions found for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
