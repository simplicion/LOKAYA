'use client';

import React, { useState } from 'react';
import { 
  useGetDeliveryProfileQuery,
  useGetRiderFinanceSummaryQuery,
  useGetRiderBankAccountsQuery,
  useAddRiderBankAccountMutation,
  useSetPrimaryRiderBankAccountMutation,
  useDeleteRiderBankAccountMutation,
  useGetRiderPayoutsQuery,
  useRequestRiderPayoutMutation
} from '@/lib/api';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  DollarSign, 
  Package, 
  Clock, 
  ShieldCheck, 
  CreditCard,
  Building2,
  ChevronRight,
  Loader2,
  ArrowDownToLine,
  Landmark,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AnimatedBottomSheet } from '@/components/ui/AnimatedBottomSheet';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

export default function DeliveryEarningsPage() {
  const { formatPrice } = useCurrency();

  // Queries
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useGetDeliveryProfileQuery();
  const { data: financeSummary, isLoading: isFinanceLoading, refetch: refetchSummary } = useGetRiderFinanceSummaryQuery();
  const { data: bankAccounts = [], isLoading: isBanksLoading, refetch: refetchBanks } = useGetRiderBankAccountsQuery();
  const { data: payoutsData, isLoading: isPayoutsLoading, refetch: refetchPayouts } = useGetRiderPayoutsQuery();

  // Mutations
  const [addBankAccount, { isLoading: isAddingBank }] = useAddRiderBankAccountMutation();
  const [setPrimaryBank, { isLoading: isSettingPrimary }] = useSetPrimaryRiderBankAccountMutation();
  const [deleteBank, { isLoading: isDeletingBank }] = useDeleteRiderBankAccountMutation();
  const [requestPayout, { isLoading: isRequestingPayout }] = useRequestRiderPayoutMutation();

  // Bottom Sheets state
  const [isBankSheetOpen, setIsBankSheetOpen] = useState(false);
  const [isWithdrawSheetOpen, setIsWithdrawSheetOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bank Form state
  const [bankFormData, setBankFormData] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: ''
  });

  // Withdraw Form state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [selectedBankId, setSelectedBankId] = useState<string>('');

  const isLoading = isProfileLoading && isFinanceLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

  // Balances calculation with fallback
  const totalEarnings = financeSummary?.totalEarnings ?? profile?.totalEarnings ?? 0;
  const availableBalance = financeSummary?.availableBalance ?? 0;
  const pendingPayouts = financeSummary?.pendingPayouts ?? 0;
  const totalPayouts = financeSummary?.totalPayouts ?? 0;

  const primaryBank = bankAccounts.find((b: any) => b.isPrimary) || bankAccounts[0];
  const payoutsList = payoutsData?.payouts || [];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankFormData.accountName.trim()) {
      toast.error('Please enter the account holder name');
      return;
    }
    if (!bankFormData.bankName.trim()) {
      toast.error('Please enter the bank name');
      return;
    }
    if (!bankFormData.accountNumber.trim() || bankFormData.accountNumber.trim().length < 6) {
      toast.error('Please enter a valid bank account number');
      return;
    }
    if (bankFormData.accountNumber.trim() !== bankFormData.confirmAccountNumber.trim()) {
      toast.error('Account numbers do not match. Please verify.');
      return;
    }
    if (!bankFormData.ifsc.trim() || bankFormData.ifsc.trim().length < 4) {
      toast.error('Please enter a valid IFSC code');
      return;
    }

    try {
      await addBankAccount({
        accountName: bankFormData.accountName.trim(),
        bankName: bankFormData.bankName.trim(),
        accountNumber: bankFormData.accountNumber.trim(),
        ifsc: bankFormData.ifsc.trim().toUpperCase()
      }).unwrap();

      toast.success('Bank details added successfully!');
      setBankFormData({
        accountName: '',
        bankName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifsc: ''
      });
      setIsBankSheetOpen(false);
      refetchBanks();
      refetchSummary();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to add bank account');
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      await setPrimaryBank(accountId).unwrap();
      toast.success('Primary bank account updated');
      refetchBanks();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update primary bank');
    }
  };

  const handleDeleteBank = async (accountId: string) => {
    try {
      await deleteBank(accountId).unwrap();
      toast.success('Bank account removed');
      refetchBanks();
      refetchSummary();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to remove bank account');
    }
  };

  const openWithdrawModal = () => {
    if (bankAccounts.length === 0) {
      toast.error('Please link your bank account before requesting a payout');
      setIsBankSheetOpen(true);
      return;
    }
    if (availableBalance < 100) {
      toast.error(`Minimum withdrawal amount is ${formatPrice(100)}. Your available balance is ${formatPrice(availableBalance)}.`);
      return;
    }
    setWithdrawAmount(availableBalance.toString());
    setSelectedBankId(primaryBank?.id || '');
    setIsWithdrawSheetOpen(true);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (!amountNum || isNaN(amountNum)) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }
    if (amountNum < 100) {
      toast.error(`Minimum withdrawal is ${formatPrice(100)}`);
      return;
    }
    if (amountNum > availableBalance) {
      toast.error(`Insufficient balance. Maximum withdrawable is ${formatPrice(availableBalance)}`);
      return;
    }

    try {
      await requestPayout({
        amount: amountNum,
        bankAccountId: selectedBankId || primaryBank?.id
      }).unwrap();

      toast.success(`Withdrawal request for ${formatPrice(amountNum)} submitted! Sent to admin for payment.`);
      setIsWithdrawSheetOpen(false);
      setWithdrawAmount('');
      refetchSummary();
      refetchPayouts();
      refetchProfile();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to process payout request');
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto pb-10">
      
      {/* 1. Main Wallet & Available Balance Card */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white p-6 rounded-3xl shadow-md space-y-4 relative overflow-hidden">
        {/* Subtle decorative background ring */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-100">
              Available For Withdrawal
            </span>
          </div>

          <Button
            size="sm"
            onClick={openWithdrawModal}
            className="bg-white hover:bg-orange-50 text-[#FF5A36] font-bold rounded-2xl shadow-sm text-xs px-4 h-9 flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Withdraw Funds</span>
          </Button>
        </div>

        <div>
          <h2 className="text-4xl font-black tracking-tight text-white">
            {formatPrice(availableBalance)}
          </h2>
          <p className="text-xs text-orange-100/90 mt-1">
            Settled earnings ready to be deposited directly to your bank account
          </p>
        </div>

        {/* Highlight for In-Progress (Pending admin approval) */}
        {pendingPayouts > 0 && (
          <div className="bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-200 animate-spin" />
              <div>
                <p className="font-bold text-white">
                  {formatPrice(pendingPayouts)} In Progress
                </p>
                <p className="text-[10px] text-amber-100">
                  Withdrawal requested • Awaiting admin transfer
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-amber-400/30 text-amber-100 px-2 py-0.5 rounded-full border border-amber-300/30">
              Processing
            </span>
          </div>
        )}

        {/* Lower Metric Row */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/20 text-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200 block">Lifetime Total</span>
            <p className="text-base font-black text-white">{formatPrice(totalEarnings)}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200 block">Paid Out</span>
            <p className="text-base font-black text-white">{formatPrice(totalPayouts)}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200 block">Orders</span>
            <p className="text-base font-black text-white">{profile?.totalDeliveries || 0} drops</p>
          </div>
        </div>
      </div>

      {/* 2. Bank Details Card & Bottom Sheet Trigger */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5A36] flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#171717]">Direct Payout Bank Account</h3>
              <p className="text-[10px] text-[#6B6B6B]">Where your approved payouts are transferred</p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsBankSheetOpen(true)}
            className="h-8 text-xs font-bold rounded-xl border-[#E5E2DC] text-[#171717] hover:bg-orange-50 hover:text-[#FF5A36] flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{bankAccounts.length > 0 ? 'Manage Bank' : 'Add Bank'}</span>
          </Button>
        </div>

        {bankAccounts.length === 0 ? (
          <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#FF5A36] flex items-center justify-center font-bold shadow-xs">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#171717]">No Bank Account Linked</p>
                <p className="text-[11px] text-[#6B6B6B]">Add your account details so the admin can process your payouts directly.</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setIsBankSheetOpen(true)}
              className="bg-[#FF5A36] hover:bg-[#e04b2b] text-white font-bold rounded-xl text-xs h-8 px-3 shrink-0"
            >
              Add Bank Details
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {primaryBank && (
              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC] flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#171717]">{primaryBank.bankName}</span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Primary
                    </span>
                  </div>
                  <p className="text-xs font-mono font-semibold text-gray-700">
                    A/C: {primaryBank.accountNumber}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-[#6B6B6B]">
                    <span>Holder: <strong className="text-[#171717]">{primaryBank.accountName}</strong></span>
                    <span>IFSC: <strong className="text-[#171717] font-mono">{primaryBank.ifsc}</strong></span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Payout Requests History List */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#6B6B6B]">Payout History</h3>
            {payoutsList.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-gray-100 text-gray-700">
                {payoutsList.length}
              </span>
            )}
          </div>
          <button 
            onClick={() => { refetchPayouts(); refetchSummary(); }}
            className="text-xs text-[#6B6B6B] hover:text-[#FF5A36] flex items-center gap-1 font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {payoutsList.length === 0 ? (
          <div className="p-8 text-center text-[#6B6B6B] space-y-1">
            <Clock className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-xs font-semibold text-gray-700">No payout requests yet</p>
            <p className="text-[11px] text-gray-400">When you request a withdrawal, its status will be tracked here in real-time.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payoutsList.map((payout: any) => {
              const isPending = payout.rawStatus === 'PENDING' || payout.rawStatus === 'PROCESSING';
              const isCompleted = payout.rawStatus === 'COMPLETED';
              const isFailed = payout.rawStatus === 'FAILED';

              return (
                <div key={payout.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#171717]">
                        {formatPrice(payout.amount)}
                      </span>
                      
                      {/* Live Status Badge */}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          <Clock className="w-2.5 h-2.5 animate-spin text-amber-600" />
                          <span>In Progress</span>
                        </span>
                      )}

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Payment Done</span>
                        </span>
                      )}

                      {isFailed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          <XCircle className="w-2.5 h-2.5 text-rose-600" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#6B6B6B]">
                      {payout.bank} • {payout.date}
                    </p>

                    {/* UTR / Reference / Failure details */}
                    {isCompleted && payout.referenceNumber && (
                      <p className="text-[10px] font-mono text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded w-fit">
                        Ref / UTR: {payout.referenceNumber}
                      </p>
                    )}

                    {isFailed && payout.failureReason && (
                      <p className="text-[10px] text-rose-600 bg-rose-50/80 px-2 py-0.5 rounded w-fit">
                        {payout.failureReason} (Balance restored)
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-gray-400">
                      #{payout.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Active Pricing & Vehicle Economics Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#6B6B6B]">Your Active Delivery Rates</h3>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-[#FF5A36]">
            {profile?.vehicleType || 'BIKE'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Per Km Rate</span>
            <p className="text-lg font-black text-[#171717]">
              {formatPrice(profile?.perKmRate || 13)} <span className="text-xs font-normal text-gray-400">/ km</span>
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">2-Way Round Trip Billed</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B]">Min Base Floor</span>
            <p className="text-lg font-black text-[#171717]">
              {formatPrice(profile?.baseFare || 64)} <span className="text-xs font-normal text-gray-400">min</span>
            </p>
            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Guaranteed per drop</p>
          </div>
        </div>

        {/* 2-Way Round Trip Payout Simulator */}
        <div className="pt-2">
          <span className="text-[11px] font-bold text-gray-700 block mb-2">Estimated Earnings per Trip:</span>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200">
              <span className="text-[10px] text-gray-500 font-bold block">3 km Trip</span>
              <span className="font-black text-sm text-[#FF5A36]">
                {formatPrice(Math.max(profile?.baseFare || 64, 2 * 3 * (profile?.perKmRate || 13)))}
              </span>
              <span className="text-[9px] text-gray-400 block">6 km total</span>
            </div>

            <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200">
              <span className="text-[10px] text-gray-500 font-bold block">5 km Trip</span>
              <span className="font-black text-sm text-[#FF5A36]">
                {formatPrice(Math.max(profile?.baseFare || 64, 2 * 5 * (profile?.perKmRate || 13)))}
              </span>
              <span className="text-[9px] text-gray-400 block">10 km total</span>
            </div>

            <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200">
              <span className="text-[10px] text-gray-500 font-bold block">8 km Trip</span>
              <span className="font-black text-sm text-[#FF5A36]">
                {formatPrice(Math.max(profile?.baseFare || 64, 2 * 8 * (profile?.perKmRate || 13)))}
              </span>
              <span className="text-[9px] text-gray-400 block">16 km total</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Settlement & Payout Protection Cards */}
      <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-[#6B6B6B]">Settlement & Payout Schedule</h3>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#171717]">Direct Bank Payout</p>
              <p className="text-[11px] text-[#6B6B6B]">Settled directly to your registered bank account</p>
            </div>
          </div>
          <span className="font-bold text-xs text-[#6B6B6B]">On Request</span>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#171717]">Automatic Invoicing</p>
              <p className="text-[11px] text-[#6B6B6B]">Itemized receipts for store and merchant partners</p>
            </div>
          </div>
          <span className="font-bold text-xs text-emerald-700">Instant</span>
        </div>
      </div>

      {/* Security & OTP Guarantee */}
      <div className="p-4 rounded-3xl bg-white border border-[#E5E2DC] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#171717]">Guaranteed Payout Protection</h4>
            <p className="text-[10px] text-[#6B6B6B]">Every drop is verified via 4-digit customer OTP code</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BOTTOM SHEET 1: Add & Manage Bank Details                    */}
      {/* ============================================================ */}
      <AnimatedBottomSheet
        isOpen={isBankSheetOpen}
        onClose={() => setIsBankSheetOpen(false)}
        title="Delivery Bank Details"
        subtitle="Manage the bank accounts where your earnings will be transferred"
        icon={<Landmark className="w-5 h-5 text-[#FF5A36]" />}
      >
        <div className="space-y-5 pb-6">
          {/* Existing Linked Accounts List */}
          {bankAccounts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Linked Bank Accounts ({bankAccounts.length})
              </h4>
              <div className="space-y-2">
                {bankAccounts.map((account: any) => (
                  <div 
                    key={account.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      account.isPrimary 
                        ? 'border-orange-300 bg-orange-50/50' 
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{account.bankName}</span>
                          {account.isPrimary && (
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FF5A36] text-white">
                              Active Primary
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono font-medium text-gray-700 mt-0.5">
                          A/C: {account.accountNumber}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {account.accountName} • IFSC: <span className="font-mono font-semibold">{account.ifsc}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!account.isPrimary && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetPrimary(account.id)}
                            disabled={isSettingPrimary}
                            className="text-xs font-semibold h-7 px-2.5 rounded-lg border-gray-300 text-gray-700"
                          >
                            Set Primary
                          </Button>
                        )}
                        <button
                          onClick={() => handleDeleteBank(account.id)}
                          disabled={isDeletingBank}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Remove bank account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Bank Account Form */}
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#FF5A36]" />
              <span>Add New Bank Account</span>
            </h4>

            <form onSubmit={handleAddBankSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Account Holder Full Name *
                </label>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={bankFormData.accountName}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountName: e.target.value })}
                  className="rounded-xl border-gray-300 text-sm h-11"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Bank Name *
                </label>
                <Input
                  placeholder="e.g. HDFC Bank, State Bank of India, etc."
                  value={bankFormData.bankName}
                  onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                  className="rounded-xl border-gray-300 text-sm h-11"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Bank Account Number *
                </label>
                <Input
                  placeholder="Enter full account number"
                  type="password"
                  value={bankFormData.accountNumber}
                  onChange={(e) => setBankFormData({ ...bankFormData, accountNumber: e.target.value.trim() })}
                  className="rounded-xl border-gray-300 font-mono text-sm h-11"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Confirm Bank Account Number *
                </label>
                <Input
                  placeholder="Re-enter bank account number"
                  value={bankFormData.confirmAccountNumber}
                  onChange={(e) => setBankFormData({ ...bankFormData, confirmAccountNumber: e.target.value.trim() })}
                  className="rounded-xl border-gray-300 font-mono text-sm h-11"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  IFSC Code *
                </label>
                <Input
                  placeholder="e.g. HDFC0001234"
                  value={bankFormData.ifsc}
                  onChange={(e) => setBankFormData({ ...bankFormData, ifsc: e.target.value.toUpperCase().trim() })}
                  className="rounded-xl border-gray-300 font-mono uppercase text-sm h-11"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isAddingBank}
                className="w-full bg-[#FF5A36] hover:bg-[#e04b2b] text-white font-bold rounded-xl h-11 text-sm shadow-sm mt-2"
              >
                {isAddingBank ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Bank Account...</span>
                  </span>
                ) : (
                  'Save & Link Bank Details'
                )}
              </Button>
            </form>
          </div>
        </div>
      </AnimatedBottomSheet>

      {/* ============================================================ */}
      {/* BOTTOM SHEET 2: Request Payout / Withdrawal                  */}
      {/* ============================================================ */}
      <AnimatedBottomSheet
        isOpen={isWithdrawSheetOpen}
        onClose={() => setIsWithdrawSheetOpen(false)}
        title="Request Earnings Withdrawal"
        subtitle="Transfer your available delivery earnings to your bank"
        icon={<ArrowDownToLine className="w-5 h-5 text-[#FF5A36]" />}
      >
        <form onSubmit={handleWithdrawSubmit} className="space-y-4 pb-6">
          {/* Balance Preview Card */}
          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block">
              Available to Withdraw
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#171717]">
                {formatPrice(availableBalance)}
              </span>
              <button
                type="button"
                onClick={() => setWithdrawAmount(availableBalance.toString())}
                className="text-xs font-black text-[#FF5A36] bg-white border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition-colors"
              >
                USE MAX
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              Minimum withdrawal: {formatPrice(100)}
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">
              Withdrawal Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-base">
                ₹
              </span>
              <Input
                type="number"
                placeholder="100"
                min={100}
                max={availableBalance}
                step="any"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="pl-8 h-12 rounded-xl border-gray-300 text-lg font-bold"
                required
              />
            </div>
          </div>

          {/* Bank Destination Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">
              Deposit to Bank Account *
            </label>

            {bankAccounts.length === 0 ? (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-700">
                No bank account linked. Please add bank details first.
              </div>
            ) : (
              <div className="space-y-2">
                {bankAccounts.map((acc: any) => (
                  <label
                    key={acc.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      (selectedBankId === acc.id || (!selectedBankId && acc.isPrimary))
                        ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-400'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="selectedBank"
                        checked={selectedBankId === acc.id || (!selectedBankId && acc.isPrimary)}
                        onChange={() => setSelectedBankId(acc.id)}
                        className="text-[#FF5A36] focus:ring-[#FF5A36]"
                      />
                      <div>
                        <p className="font-bold text-xs text-gray-900">{acc.bankName}</p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          {acc.accountNumber} • {acc.accountName}
                        </p>
                      </div>
                    </div>
                    {acc.isPrimary && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#FF5A36]">
                        Primary
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Flow Information Banner */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
            <p className="font-bold text-gray-800">How payouts work:</p>
            <p>1. When submitted, the amount will be marked as <strong className="text-amber-700">In Progress</strong>.</p>
            <p>2. The admin panel reviews the request and executes the bank transfer.</p>
            <p>3. Once the admin marks it as completed, your screen will update to <strong className="text-emerald-700">Payment Done</strong>.</p>
          </div>

          <Button
            type="submit"
            disabled={isRequestingPayout || availableBalance < 100}
            className="w-full bg-[#FF5A36] hover:bg-[#e04b2b] text-white font-bold rounded-xl h-12 text-sm shadow-sm"
          >
            {isRequestingPayout ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Request...</span>
              </span>
            ) : (
              `Request Payout of ${formatPrice(Number(withdrawAmount) || 0)}`
            )}
          </Button>
        </form>
      </AnimatedBottomSheet>

    </div>
  );
}
