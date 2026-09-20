'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, Loader2, ArrowDownCircle } from 'lucide-react';
import { useGetPayoutsQuery, useRequestPayoutMutation, useGetFinanceSummaryQuery } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';

export default function PayoutSummaryPage() {
  const router = useRouter();
  const { formatPrice, currencySymbol } = useCurrency();
  const [dateRange, setDateRange] = useState('This Month');
  const [isRequesting, setIsRequesting] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const { data: payoutsData, isLoading, refetch } = useGetPayoutsQuery();
  const { data: financeSummary } = useGetFinanceSummaryQuery();
  const [requestPayout, { isLoading: isSubmittingPayout }] = useRequestPayoutMutation();

  const payouts = payoutsData?.payouts || [];
  const totalPayouts = payoutsData?.totalPayouts ?? 0;
  const successRate = payoutsData?.successRate || '100%';

  const handleRequestPayout = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }
    try {
      await requestPayout({ amount: amt }).unwrap();
      toast.success('Payout request submitted successfully!');
      setIsRequesting(false);
      setWithdrawAmount('');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to request payout');
    }
  };

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
            <p className="text-xl font-bold text-gray-900">{formatPrice(totalPayouts)}</p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Payout Success Rate</p>
            <p className="text-xl font-bold text-gray-900">{successRate}</p>
          </div>
        </div>

        {/* Withdrawal Action Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-indigo-100 font-medium">Available for Withdrawal</p>
            <p className="text-2xl font-black mt-0.5">{formatPrice(financeSummary?.availableBalance ?? 0)}</p>
          </div>
          <Button 
            onClick={() => setIsRequesting(true)}
            className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-sm text-sm"
          >
            Withdraw Funds
          </Button>
        </div>

        {/* Withdrawal Modal */}
        {isRequesting && (
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Request Payout to Bank</h3>
            <input 
              type="number"
              placeholder={`Enter amount (min ${currencySymbol}100)`}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900"
            />
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl"
                onClick={() => setIsRequesting(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-indigo-600 text-white rounded-xl font-bold"
                disabled={isSubmittingPayout || !withdrawAmount}
                onClick={handleRequestPayout}
              >
                {isSubmittingPayout ? 'Submitting...' : 'Confirm'}
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900">Recent Payouts</h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {payouts.map((payout: any, index: number) => (
                <div 
                  key={payout.id}
                  className={`p-4 flex items-center justify-between ${
                    index !== payouts.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{payout.date}</p>
                    <p className="text-xs text-gray-400">{payout.bank}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-gray-900 text-sm">{formatPrice(payout.amount)}</p>
                    <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {payout.status}
                    </div>
                  </div>
                </div>
              ))}

              {payouts.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No payouts have been processed yet.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
