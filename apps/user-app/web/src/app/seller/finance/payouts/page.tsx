import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, Loader2, ArrowDownCircle, AlertCircle, Clock, CheckCircle2, XCircle, PlusCircle, Building2 } from 'lucide-react';
import { useGetPayoutsQuery, useRequestPayoutMutation, useGetFinanceSummaryQuery, useGetBankAccountsQuery } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';

export default function PayoutSummaryPage() {
  const router = useRouter();
  const { formatPrice, currencySymbol } = useCurrency();
  const [dateRange, setDateRange] = useState('All Time');
  const [isRequesting, setIsRequesting] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const { data: payoutsData, isLoading, refetch } = useGetPayoutsQuery();
  const { data: financeSummary, refetch: refetchSummary } = useGetFinanceSummaryQuery();
  const { data: bankAccounts, isLoading: isLoadingBanks } = useGetBankAccountsQuery();
  const [requestPayout, { isLoading: isSubmittingPayout }] = useRequestPayoutMutation();

  const payouts = payoutsData?.payouts || [];
  const totalPayouts = payoutsData?.totalPayouts ?? 0;
  const pendingPayouts = financeSummary?.pendingPayouts ?? payoutsData?.pendingPayouts ?? 0;
  const availableBalance = financeSummary?.availableBalance ?? 0;
  const successRate = payoutsData?.successRate || '100%';
  const hasLinkedBank = Boolean(bankAccounts && bankAccounts.length > 0);
  const primaryBank = bankAccounts?.find((b: any) => b.isPrimary) || bankAccounts?.[0];

  const handleStartWithdrawal = () => {
    if (!hasLinkedBank) {
      toast.error('No bank account linked. Please add your bank account first.');
      router.push('/seller/finance/bank-accounts/add');
      return;
    }
    if (availableBalance < 100) {
      toast.error(`Minimum withdrawal amount is ${currencySymbol}100`);
      return;
    }
    setIsRequesting(true);
  };

  const handleRequestPayout = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }
    if (amt > availableBalance) {
      toast.error(`Amount exceeds available withdrawal balance (${formatPrice(availableBalance)})`);
      return;
    }
    if (amt < 100) {
      toast.error(`Minimum withdrawal amount is ${currencySymbol}100`);
      return;
    }
    try {
      await requestPayout({ amount: amt, bankAccountId: primaryBank?.id }).unwrap();
      toast.success('Withdrawal request submitted! It will appear in admin panel for clearance.');
      setIsRequesting(false);
      setWithdrawAmount('');
      refetch();
      refetchSummary();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to request payout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900 p-1 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Payout Summary</h1>
        </div>
        
        <button 
          onClick={() => router.push('/seller/finance/bank-accounts')}
          className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 text-xs font-semibold hover:bg-indigo-100 transition-colors"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Bank Accounts</span>
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Linked Bank Warning if None */}
        {!isLoadingBanks && !hasLinkedBank && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900">No Bank Account Linked</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                You must add your bank account before you can withdraw your funds.
              </p>
              <Button
                size="sm"
                onClick={() => router.push('/seller/finance/bank-accounts/add')}
                className="mt-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 h-8 px-3"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Bank Account Now
              </Button>
            </div>
          </div>
        )}

        {/* Withdrawal Action Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-200 font-medium">Available for Withdrawal</p>
              <p className="text-3xl font-black mt-1 tracking-tight">{formatPrice(availableBalance)}</p>
              {pendingPayouts > 0 && (
                <p className="text-xs text-amber-200 font-medium mt-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 inline animate-pulse" />
                  <span>{formatPrice(pendingPayouts)} currently in progress</span>
                </p>
              )}
            </div>
            <Button 
              onClick={handleStartWithdrawal}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl shadow-sm text-sm px-4 py-2 h-auto"
            >
              Withdraw Funds
            </Button>
          </div>
          {primaryBank && (
            <div className="mt-4 pt-3 border-t border-indigo-500/40 flex items-center justify-between text-xs text-indigo-100">
              <span>Payout Destination: <strong className="text-white">{primaryBank.bankName}</strong> ({primaryBank.accountNumber})</span>
              <button 
                onClick={() => router.push('/seller/finance/bank-accounts')}
                className="underline hover:text-white"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[11px] font-medium text-gray-500 mb-1">Total Payouts</p>
            <p className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{formatPrice(totalPayouts)}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">Processed</p>
          </div>
          
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[11px] font-medium text-gray-500 mb-1">In Progress</p>
            <p className="text-base sm:text-lg font-bold text-amber-600 leading-tight">{formatPrice(pendingPayouts)}</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-1">Awaiting Admin</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-[11px] font-medium text-gray-500 mb-1">Success Rate</p>
            <p className="text-base sm:text-lg font-bold text-indigo-600 leading-tight">{successRate}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-1">Platform Avg</p>
          </div>
        </div>

        {/* Withdrawal Modal */}
        {isRequesting && (
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Request Payout to Bank</h3>
              <span className="text-xs text-gray-500">Max: {formatPrice(availableBalance)}</span>
            </div>

            {primaryBank && (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">A/C Holder:</span>
                  <span className="font-semibold text-gray-900">{primaryBank.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bank & A/C:</span>
                  <span className="font-semibold text-gray-900">{primaryBank.bankName} ({primaryBank.accountNumber})</span>
                </div>
                {primaryBank.ifsc && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">IFSC:</span>
                    <span className="font-semibold text-gray-900">{primaryBank.ifsc}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Withdrawal Amount</label>
              <div className="relative">
                <input 
                  type="number"
                  placeholder={`Min ${currencySymbol}100`}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900 text-base"
                />
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(availableBalance.toString())}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl"
                onClick={() => setIsRequesting(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                disabled={isSubmittingPayout || !withdrawAmount || Number(withdrawAmount) <= 0}
                onClick={handleRequestPayout}
              >
                {isSubmittingPayout ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </span>
                ) : 'Submit Request'}
              </Button>
            </div>
          </div>
        )}

        {/* Payouts History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Recent Payouts</h2>
            <span className="text-xs text-gray-400">{payouts.length} total</span>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <>
              {payouts.map((payout: any, index: number) => {
                const isPending = payout.status === 'Pending' || payout.rawStatus === 'PENDING' || payout.rawStatus === 'PROCESSING';
                const isFailed = payout.status === 'Failed' || payout.rawStatus === 'FAILED';
                const isCompleted = payout.status === 'Completed' || payout.rawStatus === 'COMPLETED';

                return (
                  <div 
                    key={payout.id}
                    className={`p-4 ${index !== payouts.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{payout.date}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{payout.bank}</p>
                        {payout.referenceNumber && (
                          <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Ref: {payout.referenceNumber}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <p className="font-bold text-gray-900 text-sm">{formatPrice(payout.amount)}</p>
                        {isPending && (
                          <div className="bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                            <span>In Progress</span>
                          </div>
                        )}
                        {isCompleted && (
                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Completed</span>
                          </div>
                        )}
                        {isFailed && (
                          <div className="bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            <span>Rejected</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isFailed && payout.failureReason && (
                      <div className="mt-2 p-2 bg-rose-50/70 border border-rose-100 rounded-lg text-xs text-rose-700">
                        <span className="font-semibold">Reason: </span>
                        {payout.failureReason}
                        <span className="block text-[11px] text-rose-600 mt-0.5">Amount has been restored to your available balance.</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {payouts.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  <ArrowDownCircle className="w-10 h-10 mx-auto text-gray-300 mb-2 stroke-[1.5]" />
                  No payouts have been requested yet.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
