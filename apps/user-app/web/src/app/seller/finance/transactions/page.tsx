'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useGetTransactionsQuery } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';

export default function TransactionsPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [activeFilter, setActiveFilter] = useState('All');

  const { data: response, isLoading } = useGetTransactionsQuery({ type: activeFilter });
  const transactions = response?.transactions || [];

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
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['All', 'Credits', 'Debits', 'Payouts'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter 
                  ? 'bg-indigo-100 text-indigo-700 font-bold' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {transactions.map((transaction: any, index: number) => (
                <div 
                  key={transaction.id}
                  className={`p-4 flex items-center justify-between ${
                    index !== transactions.length - 1 ? 'border-b border-gray-50' : ''
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
                        {transaction.amount > 0 ? `+${formatPrice(transaction.amount)}` : `-${formatPrice(Math.abs(transaction.amount))}`}
                      </p>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">{transaction.type}</span>
                    </div>
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No transactions recorded in this category.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
