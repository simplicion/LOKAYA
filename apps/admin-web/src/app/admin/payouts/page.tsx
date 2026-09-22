'use client';

import React, { useState } from 'react';
import { 
  useGetPayoutsQuery,
  useCompletePayoutMutation,
  useRejectPayoutMutation
} from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Banknote, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Building2, 
  Copy, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  X, 
  ExternalLink,
  ShieldCheck,
  User,
  Phone,
  DollarSign,
  ArrowUpRight
} from 'lucide-react';

export default function AdminPayoutsPage() {
  const { formatPrice } = useCurrency();
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [activePayout, setActivePayout] = useState<any | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { 
    data, 
    isLoading, 
    refetch, 
    isFetching 
  } = useGetPayoutsQuery({
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    search: searchQuery.trim() || undefined,
  });

  const [completePayout, { isLoading: isCompleting }] = useCompletePayoutMutation();
  const [rejectPayout, { isLoading: isRejecting }] = useRejectPayoutMutation();

  const payouts = data?.payouts || [];
  const stats = data?.stats || {
    pendingCount: 0,
    pendingAmount: 0,
    completedCount: 0,
    completedAmount: 0,
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openCompleteModal = (payout: any) => {
    setActivePayout(payout);
    setTransactionRef(payout.referenceNumber || `UTR-${Date.now().toString().slice(-8)}`);
    setShowCompleteModal(true);
  };

  const openRejectModal = (payout: any) => {
    setActivePayout(payout);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleCompleteSubmit = async () => {
    if (!activePayout) return;
    try {
      await completePayout({
        id: activePayout.id,
        transactionRef: transactionRef.trim() || undefined,
      }).unwrap();
      toast.success(`Payout of ${formatPrice(activePayout.amount)} marked as completed! Seller panel updated.`);
      setShowCompleteModal(false);
      setActivePayout(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to complete payout');
    }
  };

  const handleRejectSubmit = async () => {
    if (!activePayout) return;
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectPayout({
        id: activePayout.id,
        reason: rejectReason.trim(),
      }).unwrap();
      toast.success(`Payout rejected. Funds restored to seller's balance.`);
      setShowRejectModal(false);
      setActivePayout(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reject payout');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seller Payouts & Withdrawals</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Review withdrawal requests, verify seller bank details, and disburse payments.
              </p>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          disabled={isFetching}
          className="flex items-center gap-2 border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
              Pending Clearance
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-3">{formatPrice(stats.pendingAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">
            <strong className="text-amber-600 font-semibold">{stats.pendingCount}</strong> request{stats.pendingCount === 1 ? '' : 's'} awaiting payout
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Total Disbursed
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-3">{formatPrice(stats.completedAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">
            <strong className="text-emerald-600 font-semibold">{stats.completedCount}</strong> payout{stats.completedCount === 1 ? '' : 's'} settled successfully
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              Total Requests
            </span>
            <Building2 className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-3">{data?.total || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Total lifetime payout applications</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: 'PENDING', label: 'Pending', count: stats.pendingCount },
            { id: 'COMPLETED', label: 'Completed', count: stats.completedCount },
            { id: 'FAILED', label: 'Rejected' },
            { id: 'ALL', label: 'All Requests' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                selectedStatus === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  tab.id === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input 
            placeholder="Search store, seller, bank, IFSC..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-gray-200 text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Loading withdrawal requests...</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <Banknote className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-base font-semibold text-gray-700">No payout requests found</p>
            <p className="text-xs text-gray-400 mt-1">There are no payouts matching the selected filter or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Store & Seller</th>
                  <th className="py-3.5 px-4">Bank Details (NEFT/IMPS)</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Date & Ref</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {payouts.map((payout: any) => {
                  const store = payout.store;
                  const bank = payout.bankAccount;
                  const owner = store?.users?.[0]?.user;
                  const isPending = payout.status === 'PENDING' || payout.status === 'PROCESSING';
                  const isCompleted = payout.status === 'COMPLETED';
                  const isFailed = payout.status === 'FAILED';

                  return (
                    <tr key={payout.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Store & Seller Info */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-gray-900">{store?.name || 'Local Store'}</div>
                        {owner?.name && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-gray-400" />
                            <span>{owner.name}</span>
                          </div>
                        )}
                        {(store?.contactPhone || owner?.phone) && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{store?.contactPhone || owner?.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Bank Details */}
                      <td className="py-4 px-4 align-top">
                        {bank ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{bank.bankName}</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              Holder: <span className="font-medium text-gray-900">{bank.accountName}</span>
                            </div>
                            <div className="text-xs flex items-center gap-1.5 font-mono text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 w-fit">
                              <span>A/C: {bank.fullAccount || bank.accountNumber}</span>
                              <button
                                onClick={() => handleCopy(bank.fullAccount || bank.accountNumber, `acc-${payout.id}`)}
                                className="text-gray-400 hover:text-gray-700 ml-1"
                                title="Copy account number"
                              >
                                {copiedId === `acc-${payout.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            {bank.ifsc && (
                              <div className="text-xs flex items-center gap-1.5 font-mono text-gray-700">
                                <span>IFSC: <strong className="text-gray-900">{bank.ifsc}</strong></span>
                                <button
                                  onClick={() => handleCopy(bank.ifsc, `ifsc-${payout.id}`)}
                                  className="text-gray-400 hover:text-gray-700"
                                  title="Copy IFSC"
                                >
                                  {copiedId === `ifsc-${payout.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No bank record attached</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 align-top">
                        <div className="text-base font-extrabold text-gray-900">
                          {formatPrice(payout.amount)}
                        </div>
                        {payout.fee > 0 && (
                          <div className="text-[11px] text-gray-400">
                            Fee: {formatPrice(payout.fee)}
                          </div>
                        )}
                      </td>

                      {/* Date & Ref */}
                      <td className="py-4 px-4 align-top text-xs text-gray-500">
                        <div>{new Date(payout.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{new Date(payout.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        {payout.referenceNumber && (
                          <div className="text-[10px] font-mono text-gray-400 mt-1">
                            Ref: {payout.referenceNumber}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 align-top">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
                            <Clock className="w-3 h-3 animate-spin text-amber-500" />
                            <span>Pending</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Paid</span>
                          </span>
                        )}
                        {isFailed && (
                          <div>
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold">
                              <XCircle className="w-3 h-3 text-rose-500" />
                              <span>Rejected</span>
                            </span>
                            {payout.failureReason && (
                              <p className="text-[11px] text-rose-600 mt-1 max-w-[200px] leading-tight">
                                {payout.failureReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 align-top text-right space-x-2">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => openCompleteModal(payout)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm h-8 px-3"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Mark Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRejectModal(payout)}
                              className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold h-8 px-3"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : isCompleted ? (
                          <span className="text-xs font-medium text-emerald-600">Settled</span>
                        ) : (
                          <span className="text-xs font-medium text-gray-400">Closed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Mark Payout as Paid */}
      {showCompleteModal && activePayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-lg">Mark Payout as Completed</h3>
              </div>
              <button 
                onClick={() => setShowCompleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 space-y-1.5 text-xs text-emerald-950">
              <div className="flex justify-between">
                <span className="text-gray-600">Store:</span>
                <span className="font-bold">{activePayout.store?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Disbursement Amount:</span>
                <span className="font-extrabold text-sm text-emerald-700">{formatPrice(activePayout.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bank & A/C:</span>
                <span className="font-semibold">{activePayout.bankAccount?.bankName} ({activePayout.bankAccount?.fullAccount || activePayout.bankAccount?.accountNumber})</span>
              </div>
              {activePayout.bankAccount?.ifsc && (
                <div className="flex justify-between">
                  <span className="text-gray-600">IFSC:</span>
                  <span className="font-mono font-bold">{activePayout.bankAccount.ifsc}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Bank UTR / Transaction Reference Number
              </label>
              <Input
                placeholder="e.g. UTR123456789 / IMPS ref"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="rounded-xl border-gray-300 font-mono text-sm"
              />
              <p className="text-[11px] text-gray-500">
                This reference number will be visible to the seller on their withdrawal history and notification.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowCompleteModal(false)}
                disabled={isCompleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                onClick={handleCompleteSubmit}
                disabled={isCompleting}
              >
                {isCompleting ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Payout */}
      {showRejectModal && activePayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <XCircle className="w-5 h-5" />
                <h3 className="font-bold text-gray-900 text-lg">Reject Withdrawal Request</h3>
              </div>
              <button 
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800 space-y-1">
              <p className="font-semibold">
                Rejecting withdrawal of {formatPrice(activePayout.amount)} for {activePayout.store?.name}.
              </p>
              <p className="text-[11px] text-rose-700">
                Note: The full requested amount will immediately be credited back to the seller's available balance.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Bank account number does not match IFSC / Account holder name mismatch"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowRejectModal(false)}
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
                onClick={handleRejectSubmit}
                disabled={isRejecting || !rejectReason.trim()}
              >
                {isRejecting ? 'Rejecting...' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
