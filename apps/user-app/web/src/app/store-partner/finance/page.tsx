'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronRight, Landmark, IndianRupee, ArrowRightLeft } from 'lucide-react';

export default function FinanceOverviewPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('This Month');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Finance Overview</h1>
        </div>
        
        <button className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
          <span className="text-sm font-medium text-gray-700">{dateRange}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900">₹45,860</p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Payouts</p>
            <p className="text-xl font-bold text-gray-900">₹32,450</p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Pending Payouts</p>
            <p className="text-xl font-bold text-gray-900">₹5,680</p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Available Balance</p>
            <p className="text-xl font-bold text-gray-900">₹7,730</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3">Transaction Summary</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Today Collected</p>
              <p className="text-lg font-bold text-gray-900">₹2,450</p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Last Collected</p>
              <p className="text-lg font-bold text-gray-900">₹2,180</p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Today Orders</p>
              <p className="text-lg font-bold text-gray-900">18</p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Last Orders</p>
              <p className="text-lg font-bold text-gray-900">16</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3">Finance Management</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button 
              onClick={() => router.push('/store-partner/finance/payouts')}
              className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Payout Summary</p>
                  <p className="text-xs text-gray-500">View payout history and status</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => router.push('/store-partner/finance/transactions')}
              className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Transactions</p>
                  <p className="text-xs text-gray-500">Credits, debits, and refunds</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={() => router.push('/store-partner/finance/bank-accounts')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">Bank Accounts</p>
                  <p className="text-xs text-gray-500">Manage your linked accounts</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
