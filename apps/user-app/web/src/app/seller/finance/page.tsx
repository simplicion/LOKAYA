'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronRight, Landmark, IndianRupee, ArrowRightLeft, Loader2 } from 'lucide-react';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { DateRangeModal } from '@/components/seller/DateRangeModal';
import { useGetFinanceSummaryQuery } from '@/lib/api';

export default function FinanceOverviewPage() {
  const router = useRouter();
  const [activeDateFilter, setActiveDateFilter] = useState('This Month');
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);

  const { data: summary, isLoading } = useGetFinanceSummaryQuery();

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-20">
      <SellerHeader 
        title="Finance Overview"
        showBack={true}
        onBack={() => router.back()}
        hideSearchIcon={true}
        rightAction={
          <button 
            onClick={() => setIsDateSelectorOpen(true)}
            className="flex items-center gap-1.5 bg-[#F9F9F9] pl-3 pr-2 py-1 rounded-full border border-[#E5E2DC]"
          >
            <span className="text-xs font-semibold text-[#171717]">{activeDateFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </button>
        }
      />

      <DateRangeModal
        isOpen={isDateSelectorOpen}
        onClose={() => setIsDateSelectorOpen(false)}
        selectedRange={activeDateFilter}
        onSelectRange={(range) => {
          setActiveDateFilter(range);
          setIsDateSelectorOpen(false);
        }}
      />

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm">
            <p className="text-xs text-[#6B6B6B] mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-[#171717]">₹{(summary?.totalRevenue ?? 0).toLocaleString()}</p>
          </div>
          
          <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm">
            <p className="text-xs text-[#6B6B6B] mb-1">Total Payouts</p>
            <p className="text-xl font-bold text-[#171717]">₹{(summary?.totalPayouts ?? 0).toLocaleString()}</p>
          </div>
          
          <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm">
            <p className="text-xs text-[#6B6B6B] mb-1">Pending Payouts</p>
            <p className="text-xl font-bold text-[#171717]">₹{(summary?.pendingPayouts ?? 0).toLocaleString()}</p>
          </div>
          
          <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm">
            <p className="text-xs text-[#6B6B6B] mb-1">Available Balance</p>
            <p className="text-xl font-bold text-[#171717]">₹{(summary?.availableBalance ?? 0).toLocaleString()}</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#171717] mb-3">Transaction Summary</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm">
              <p className="text-xs text-[#6B6B6B] mb-1">Today Collected</p>
              <p className="text-lg font-bold text-[#171717]">₹{(summary?.todayCollected ?? 0).toLocaleString()}</p>
            </div>
            
            <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm">
              <p className="text-xs text-[#6B6B6B] mb-1">Last Collected</p>
              <p className="text-lg font-bold text-[#171717]">₹{(summary?.lastCollected ?? 0).toLocaleString()}</p>
            </div>
            
            <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm">
              <p className="text-xs text-[#6B6B6B] mb-1">Today Orders</p>
              <p className="text-lg font-bold text-[#171717]">{summary?.todayOrders ?? 0}</p>
            </div>
            
            <div className="bg-[#FFFFFF] p-4 rounded-[1.25rem] border border-[#E5E2DC] shadow-sm">
              <p className="text-xs text-[#6B6B6B] mb-1">Last Orders</p>
              <p className="text-lg font-bold text-[#171717]">{summary?.lastOrders ?? 0}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#171717] mb-3">Finance Management</h2>
          <div className="bg-[#FFFFFF] rounded-[1.25rem] border border-[#E5E2DC] shadow-sm overflow-hidden">
            <button 
              onClick={() => router.push('/seller/finance/payouts')}
              className="w-full flex items-center justify-between p-4 border-b border-[#E5E2DC] hover:bg-[#F9F9F9] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E5F7ED] flex items-center justify-center text-[#00B960]">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#171717] text-sm">Payout Summary</p>
                  <p className="text-xs text-[#6B6B6B]">View payout history and status</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
            </button>
            
            <button 
              onClick={() => router.push('/seller/finance/transactions')}
              className="w-full flex items-center justify-between p-4 border-b border-[#E5E2DC] hover:bg-[#F9F9F9] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#4B5563]">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#171717] text-sm">Transactions</p>
                  <p className="text-xs text-[#6B6B6B]">Credits, debits, and refunds</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
            </button>
            
            <button 
              onClick={() => router.push('/seller/finance/bank-accounts')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFEBEE] flex items-center justify-center text-[#FF5A36]">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#171717] text-sm">Bank Accounts</p>
                  <p className="text-xs text-[#6B6B6B]">Manage your linked accounts</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#6B6B6B]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
