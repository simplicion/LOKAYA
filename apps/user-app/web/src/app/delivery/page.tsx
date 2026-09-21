'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  useGetDeliveryProfileQuery, 
  useToggleDeliveryOnlineMutation,
  useGetDeliveryIncomingTasksQuery,
  useGetDeliveryActiveTaskQuery,
  useGetDeliveryActiveBatchQuery,
  useUpdateBatchStatusMutation,
  useAcceptDeliveryTaskMutation,
  useUpdateDeliveryTaskStatusMutation,
  useVerifyDeliveryOtpMutation,
  useVerifyBatchDropOtpMutation
} from '@/lib/api';
import { 
  Power, 
  Package, 
  MapPin, 
  Navigation, 
  Phone, 
  DollarSign, 
  TrendingUp, 
  Star, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Store, 
  User,
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  Bike,
  Layers,
  Sparkles,
  ChevronRight,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const { formatPrice, currency } = useCurrency();

  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useGetDeliveryProfileQuery();
  const { data: activeTask, isLoading: isTaskLoading, refetch: refetchTask } = useGetDeliveryActiveTaskQuery(undefined, {
    pollingInterval: 5000
  });
  const { data: incomingTasks = [], isLoading: isIncomingLoading, refetch: refetchIncoming } = useGetDeliveryIncomingTasksQuery(undefined, {
    pollingInterval: 5000
  });
  const { data: activeBatch, isLoading: isBatchLoading, refetch: refetchBatch } = useGetDeliveryActiveBatchQuery(undefined, {
    pollingInterval: 5000
  });

  const [toggleOnline, { isLoading: isTogglingOnline }] = useToggleDeliveryOnlineMutation();
  const [acceptTask, { isLoading: isAccepting }] = useAcceptDeliveryTaskMutation();
  const [updateTaskStatus, { isLoading: isUpdatingStatus }] = useUpdateDeliveryTaskStatusMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyDeliveryOtpMutation();
  const [updateBatchStatus, { isLoading: isUpdatingBatchStatus }] = useUpdateBatchStatusMutation();
  const [verifyBatchDropOtp, { isLoading: isVerifyingBatchDropOtp }] = useVerifyBatchDropOtpMutation();

  // OTP Modal State for single tasks or batch drops
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [activeBatchDrop, setActiveBatchDrop] = useState<{ batchId: string; orderId: string; dropSequence: number; customerName: string } | null>(null);
  const [inputOtp, setInputOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Handle Online/Offline Toggle
  const handleToggleOnline = async () => {
    if (!profile) return;
    try {
      const nextState = !profile.isOnline;
      await toggleOnline(nextState).unwrap();
      toast.success(nextState ? "You are now ONLINE & ready for deliveries!" : "You are now OFFLINE.");
      refetchProfile();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to change online status');
    }
  };

  // Handle Accept single assignment
  const handleAcceptAssignment = async (assignmentId?: string) => {
    const targetId = assignmentId || activeTask?.id;
    if (!targetId) return;
    try {
      await acceptTask(targetId).unwrap();
      toast.success('Delivery task accepted! Navigate to merchant store.');
      refetchTask();
      refetchIncoming();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to accept task');
    }
  };

  // Handle Decline single assignment
  const handleDeclineAssignment = async (assignmentId: string) => {
    try {
      await updateTaskStatus({ assignmentId, status: 'REJECTED' }).unwrap();
      toast.info('Delivery request declined.');
      refetchTask();
      refetchIncoming();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to decline task');
    }
  };

  // Handle Status progression for single task
  const handleProgressStatus = async (nextStatus: string) => {
    if (!activeTask) return;
    try {
      await updateTaskStatus({ assignmentId: activeTask.id, status: nextStatus }).unwrap();
      toast.success(`Status updated to ${nextStatus.replace(/_/g, ' ')}`);
      refetchTask();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  // Handle Status progression for multi-drop batch
  const handleProgressBatchStatus = async (nextStatus: string) => {
    if (!activeBatch) return;
    try {
      await updateBatchStatus({ batchId: activeBatch.id, status: nextStatus }).unwrap();
      toast.success(`Batch status updated to ${nextStatus.replace(/_/g, ' ')}`);
      refetchBatch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update batch status');
    }
  };

  // Handle Single Task OTP Submission
  const handleVerifyDelivery = async () => {
    if (!activeTask || !activeTask.orderId) return;
    if (inputOtp.length !== 4) {
      setOtpError('Please enter the 4-digit OTP provided by the customer.');
      return;
    }

    try {
      setOtpError('');
      await verifyOtp({ orderId: activeTask.orderId, otp: inputOtp }).unwrap();
      toast.success('🎉 Delivery completed successfully! Payout credited.');
      setIsOtpModalOpen(false);
      setInputOtp('');
      refetchTask();
      refetchProfile();
    } catch (err: any) {
      setOtpError(err?.data?.message || 'Invalid OTP code. Please check with customer.');
    }
  };

  // Handle Batch Drop OTP Submission
  const handleVerifyBatchDrop = async () => {
    if (!activeBatchDrop) return;
    if (inputOtp.length !== 4) {
      setOtpError('Please enter the 4-digit OTP provided by the customer.');
      return;
    }

    try {
      setOtpError('');
      const res = await verifyBatchDropOtp({
        batchId: activeBatchDrop.batchId,
        orderId: activeBatchDrop.orderId,
        otp: inputOtp
      }).unwrap();

      if (res.isAllBatchCompleted) {
        toast.success(`🎉 Entire Batch Completed! Total payout credited to your wallet.`);
      } else {
        toast.success(`✅ Drop ${activeBatchDrop.dropSequence} completed! (${res.completedDrops}/${res.totalDrops} Done)`);
      }

      setIsOtpModalOpen(false);
      setActiveBatchDrop(null);
      setInputOtp('');
      refetchBatch();
      refetchProfile();
    } catch (err: any) {
      setOtpError(err?.data?.message || 'Invalid customer OTP code.');
    }
  };

  if (isProfileLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

  // 1. Pending Verification Holding Screen (identical to Seller holding screen)
  if (profile?.status === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-[#E5E2DC] text-center space-y-6">
          {/* Icon Header */}
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              KYC Under Review
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#171717] pt-1">
              Rider Account Pending Verification
            </h1>
            <p className="text-[#6B6B6B] text-sm max-w-md mx-auto">
              Your delivery partner registration and KYC documents have been submitted and are currently being reviewed by our verification team.
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-[#FAF9F6] rounded-2xl p-5 border border-[#E5E2DC] text-left space-y-4 max-w-lg mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">Application & Documents Submitted</h4>
                <p className="text-[11px] text-gray-500">
                  {profile?.user?.name ? `${profile.user.name}'s ` : ''}Identity documents, vehicle ({profile?.vehicleType || 'Vehicle'}) & photo received.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5 animate-pulse">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900">Admin Document Verification</h4>
                <p className="text-[11px] text-amber-700">Verification in progress. Typically takes 1-4 hours.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-50">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-700">Fleet Account Activated</h4>
                <p className="text-[11px] text-gray-500">Start going online, accepting local delivery dispatches, and earning payouts.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => refetchProfile()}
              className="rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold h-12 px-6 gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Check Verification Status
            </Button>
            <Link href="/home">
              <Button variant="outline" className="rounded-2xl h-12 px-6 w-full sm:w-auto">
                Back to Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Rejected Screen
  if (profile?.status === 'REJECTED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-red-200 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
              Verification Unsuccessful
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#171717] pt-1">
              Rider Verification Needs Attention
            </h1>
            <p className="text-[#6B6B6B] text-sm max-w-md mx-auto">
              {profile.rejectionReason || 'Your application could not be approved. Please review your documents and resubmit your KYC verification.'}
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link href="/delivery/onboarding">
              <Button className="rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold h-12 px-8 gap-2">
                Resubmit KYC Documents <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOnline = Boolean(profile?.isOnline);
  const stats = profile?.stats || {
    todayEarnings: 0,
    todayTrips: 0,
    totalDeliveries: profile?.totalDeliveries || 0,
    rating: profile?.rating || 5.0,
    partnerStoresCount: 0
  };

  const currentOrder = activeTask?.order;

  return (
    <div className="p-4 space-y-4">
      
      {/* 1. Rider Availability & Duty Banner */}
      <div className={`p-5 rounded-3xl border transition-all duration-300 shadow-sm ${
        isOnline 
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-500 text-emerald-950' 
          : 'bg-white border border-[#E5E2DC] text-[#171717]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
              <h2 className="text-lg font-black tracking-tight">
                {isOnline ? 'Online • Ready for Orders' : 'Offline • Off Duty'}
              </h2>
            </div>
            <p className={`text-xs ${isOnline ? 'text-emerald-700 font-medium' : 'text-[#6B6B6B]'}`}>
              {isOnline 
                ? 'Your live GPS location is broadcasting to nearby stores.' 
                : 'Toggle online to receive dispatch alerts.'}
            </p>
          </div>

          <button
            onClick={handleToggleOnline}
            disabled={isTogglingOnline}
            className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 shadow-md ${
              isOnline
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/25 ring-4 ring-emerald-500/20'
                : 'bg-[#FAF9F6] text-[#6B6B6B] border border-[#E5E2DC] hover:bg-gray-100'
            }`}
            title="Toggle Online Duty"
          >
            {isTogglingOnline ? (
              <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
            ) : (
              <Power className="w-6 h-6 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Today's Key Performance Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Earnings Card */}
        <div className="bg-white rounded-3xl p-4.5 border border-[#E5E2DC] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Earnings</span>
            <div className="p-1.5 rounded-xl bg-orange-50 text-[#FF5A36]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#171717] pt-0.5">
            {formatPrice(stats.todayEarnings)}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 pt-0.5">
            <TrendingUp className="w-3 h-3" />
            <span>Instant wallet payout</span>
          </p>
        </div>

        {/* Trips Completed */}
        <div className="bg-white rounded-3xl p-4.5 border border-[#E5E2DC] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#6B6B6B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Trips Completed</span>
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#171717] pt-0.5">
            {stats.todayTrips} <span className="text-xs font-semibold text-[#6B6B6B]">drops</span>
          </p>
          <p className="text-[10px] text-[#6B6B6B] font-medium pt-0.5">
            Total {stats.totalDeliveries} all time
          </p>
        </div>
      </div>

      {/* 2.5 INCOMING QUEUED DELIVERY REQUESTS (Works Online & Offline) */}
      {incomingTasks.length > 0 && (!activeTask || activeTask.status === 'ASSIGNED') && !activeBatch && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#FF5A36] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Incoming Delivery Requests ({incomingTasks.length})</span>
            </span>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              Queued in Inbox
            </span>
          </div>

          {incomingTasks.map((task: any) => (
            <div key={task.id} className="bg-white rounded-3xl p-5 border-2 border-orange-300 shadow-md space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5A36] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                    New Assignment
                  </span>
                  <h3 className="font-black text-base text-[#171717] mt-1.5">
                    Order #{task.order?.id?.slice(0, 8).toUpperCase()}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#6B6B6B]">Trip Payout</span>
                  <p className="text-lg font-black text-emerald-600">{formatPrice(task.deliveryFee || 50)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] text-[#6B6B6B] font-bold block uppercase flex items-center gap-1">
                    <Store className="w-3 h-3 text-[#FF5A36]" /> Pickup
                  </span>
                  <span className="font-bold text-[#171717] truncate block">{task.order?.store?.name}</span>
                  <span className="text-[11px] text-gray-500 truncate block">{task.order?.store?.address}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B6B6B] font-bold block uppercase flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-600" /> Drop-Off
                  </span>
                  <span className="font-bold text-[#171717] truncate block">{task.order?.buyer?.name || 'Customer'}</span>
                  <span className="text-[11px] text-gray-500 truncate block">{task.order?.deliveryAddress || 'Local Area'}</span>
                </div>
              </div>

              {/* Real-time Petrol & Labor Economics Strip */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-700 font-bold flex-wrap gap-1">
                  <span className="flex items-center gap-1 text-[11px]">
                    <span>⛽ Live Petrol:</span>
                    <span className="text-[#FF5A36] font-black">{formatPrice(task.economics?.fuelPricePerLiter || (currency === 'NPR' ? 175 : 102))}/L</span>
                    <span className="text-gray-400 font-normal">({task.economics?.standardBikeMileage || (currency === 'NPR' ? 45 : 50)} km/L)</span>
                  </span>
                  <span className="text-slate-600 text-[11px] font-mono">
                    📍 {task.economics?.distanceKm || 5} km ({task.economics?.twoWayDistanceKm || 10} km round trip)
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 font-mono text-[11px] flex-wrap">
                  <span className="bg-orange-100/70 text-orange-900 px-2 py-0.5 rounded-md font-bold">
                    Fuel: ~{formatPrice(task.economics?.estimatedFuelCost || 35)}
                  </span>
                  <span className="bg-emerald-100/70 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
                    Rider Labor: {formatPrice(task.economics?.estimatedLaborPayout || 29)} ({task.economics?.laborPercentage || 50}%)
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => handleDeclineAssignment(task.id)}
                  disabled={isUpdatingStatus}
                  className="flex-1 h-12 rounded-xl text-xs font-bold border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-1"
                >
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>Decline</span>
                </Button>
                <Button
                  onClick={() => handleAcceptAssignment(task.id)}
                  disabled={isAccepting}
                  className="flex-1 h-12 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1"
                >
                  {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept & Start</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. MULTI-DROP BATCH TASK CARD (If Active Batch Exists) */}
      {activeBatch ? (
        <div className="bg-white rounded-3xl p-5 border-2 border-[#FF5A36] shadow-md space-y-4 relative overflow-hidden animate-in fade-in duration-300">
          {/* Header & Earnings Breakdown */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A36] animate-ping" />
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#FF5A36]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#FF5A36]">
                  Multi-Drop Batch Run
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Payout: {formatPrice(activeBatch.totalRiderPayout)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-[#171717]">
              <span>Delivery Progress</span>
              <span>{activeBatch.completedDrops} of {activeBatch.totalDrops} Drops Complete</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF5A36] to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${(activeBatch.completedDrops / activeBatch.totalDrops) * 100}%` }}
              />
            </div>
          </div>

          {/* Pickup Store Card */}
          <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-[#E5E2DC] space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#171717] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#171717]">{activeBatch.store?.name || 'Merchant Store'}</h4>
                  <p className="text-[11px] text-[#6B6B6B] truncate max-w-[200px] mt-0.5">
                    {activeBatch.store?.address || 'Pickup all packages here'}
                  </p>
                </div>
              </div>

              {activeBatch.store?.latitude && activeBatch.store?.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activeBatch.store.latitude},${activeBatch.store.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-orange-100 text-[#FF5A36] hover:bg-orange-200 transition-colors shrink-0"
                  title="Navigate to Store"
                >
                  <Navigation className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Batch Status Buttons */}
          {activeBatch.status === 'PENDING' && (
            <Button
              onClick={() => handleProgressBatchStatus('ACCEPTED')}
              disabled={isUpdatingBatchStatus}
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
            >
              {isUpdatingBatchStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : `Accept Batch (${activeBatch.totalDrops} Orders)`}
            </Button>
          )}

          {activeBatch.status === 'ACCEPTED' && (
            <Button
              onClick={() => handleProgressBatchStatus('IN_TRANSIT')}
              disabled={isUpdatingBatchStatus}
              className="w-full h-12 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-sm shadow-md"
            >
              {isUpdatingBatchStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'All Packages Picked Up • Start Route'}
            </Button>
          )}

          {/* Sequential Drops List */}
          <div className="space-y-2 pt-2">
            <h4 className="font-black text-xs text-[#171717] uppercase tracking-wider">
              Customer Drops Route ({activeBatch.drops.length})
            </h4>

            <div className="space-y-2.5">
              {activeBatch.drops.map((drop: any, idx: number) => {
                const isNextActive = !drop.isCompleted && (idx === 0 || activeBatch.drops[idx - 1]?.isCompleted);

                return (
                  <div
                    key={drop.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      drop.isCompleted 
                        ? 'bg-gray-50/80 border-gray-200 opacity-60'
                        : isNextActive
                          ? 'bg-orange-50/80 border-orange-300 ring-2 ring-orange-400/20 shadow-xs'
                          : 'bg-white border-[#E5E2DC]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          drop.isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isNextActive
                              ? 'bg-[#FF5A36] text-white'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {drop.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : drop.dropSequence}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#171717] truncate">{drop.customerName}</span>
                            <span className="text-[10px] font-mono text-gray-500 font-semibold">
                              #{drop.orderId.slice(0, 6).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-tight mt-0.5 line-clamp-2">
                            {drop.deliveryAddress}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                              Payout: {formatPrice(drop.riderShare)} {drop.isFirstDrop ? '(100%)' : '(50% Bonus)'}
                            </span>
                            {drop.customerPhone && !drop.isCompleted && (
                              <a
                                href={`tel:${drop.customerPhone}`}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100"
                              >
                                <Phone className="w-2.5 h-2.5" />
                                Call
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button for Next Active Stop */}
                      {isNextActive && activeBatch.status === 'IN_TRANSIT' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveBatchDrop({
                              batchId: activeBatch.id,
                              orderId: drop.orderId,
                              dropSequence: drop.dropSequence,
                              customerName: drop.customerName
                            });
                            setIsOtpModalOpen(true);
                          }}
                          className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shrink-0 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify OTP</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : activeTask && currentOrder && activeTask.status !== 'ASSIGNED' ? (
        /* 4. SINGLE ACTIVE DELIVERY TASK CARD */
        <div className="bg-white rounded-3xl p-5 border-2 border-[#FF5A36] shadow-md space-y-4 relative overflow-hidden animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A36] animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider text-[#FF5A36]">
                Active Delivery Task
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#6B6B6B] bg-gray-100 px-2 py-0.5 rounded-md">
              #{currentOrder.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {/* STORE PICKUP OTP CARD (Handshake #1: Rider -> Merchant) */}
          {['ACCEPTED', 'ARRIVED_AT_STORE'].includes(activeTask.status) && (
            <div className="bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-2xl p-4 border border-slate-800 shadow-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" />
                  <span>Store Pickup Verification</span>
                </span>
                <span className="text-[11px] text-slate-400">Share with Merchant</span>
              </div>

              <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
                <span className="text-3xl sm:text-4xl font-mono font-black tracking-[0.4em] text-white">
                  {currentOrder.pickupOtp?.otpCode || '1234'}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 text-center leading-relaxed">
                Show this 4-digit code to the store merchant to collect the parcel.
              </p>
            </div>
          )}

          {/* Pickup Store Card */}
          <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-[#E5E2DC] space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#171717] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#171717]">{currentOrder.store?.name || 'Merchant Store'}</h4>
                  <p className="text-[11px] text-[#6B6B6B] truncate max-w-[200px] mt-0.5">
                    {currentOrder.store?.address || 'Local Merchant Address'}
                  </p>
                </div>
              </div>

              {currentOrder.store?.latitude && currentOrder.store?.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${currentOrder.store.latitude},${currentOrder.store.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-orange-100 text-[#FF5A36] hover:bg-orange-200 transition-colors shrink-0"
                  title="Navigate to Store"
                >
                  <Navigation className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Customer Drop-off Card */}
          <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-200/70 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF5A36] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#171717]">{currentOrder.buyer?.name || 'Customer'}</h4>
                  <p className="text-[11px] text-[#6B6B6B] leading-tight mt-0.5">
                    {currentOrder.deliveryAddress || 'Customer Delivery Address'}
                  </p>
                </div>
              </div>

              {currentOrder.buyer?.phone && (
                <a
                  href={`tel:${currentOrder.buyer.phone}`}
                  className="p-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors shrink-0"
                  title="Call Customer"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Real-time Petrol & Labor Economics Strip */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-700 font-bold flex-wrap gap-1">
              <span className="flex items-center gap-1 text-[11px]">
                <span>⛽ Live Petrol:</span>
                <span className="text-[#FF5A36] font-black">{formatPrice(activeTask.economics?.fuelPricePerLiter || (currency === 'NPR' ? 175 : 102))}/L</span>
                <span className="text-gray-400 font-normal">({activeTask.economics?.standardBikeMileage || (currency === 'NPR' ? 45 : 50)} km/L)</span>
              </span>
              <span className="text-slate-600 text-[11px] font-mono">
                📍 {activeTask.economics?.distanceKm || 5} km ({activeTask.economics?.twoWayDistanceKm || 10} km round trip)
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 font-mono text-[11px] flex-wrap">
              <span className="bg-orange-100/70 text-orange-900 px-2 py-0.5 rounded-md font-bold">
                Fuel: ~{formatPrice(activeTask.economics?.estimatedFuelCost || 35)}
              </span>
              <span className="bg-emerald-100/70 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
                Rider Labor: {formatPrice(activeTask.economics?.estimatedLaborPayout || 29)} ({activeTask.economics?.laborPercentage || 50}%)
              </span>
            </div>
          </div>

          {/* Dynamic Task Progression CTA Button */}
          <div className="pt-1">
            {activeTask.status === 'ACCEPTED' && (
              <Button
                onClick={() => handleProgressStatus('ARRIVED_AT_STORE')}
                disabled={isUpdatingStatus}
                className="w-full h-13 rounded-2xl bg-[#171717] hover:bg-black text-white font-bold text-sm shadow-md"
              >
                {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'I Have Arrived at Merchant Store'}
              </Button>
            )}

            {activeTask.status === 'ARRIVED_AT_STORE' && (
              <Button
                onClick={() => handleProgressStatus('PICKED_UP')}
                disabled={isUpdatingStatus}
                className="w-full h-13 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-sm shadow-md"
              >
                {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Parcel Picked Up & Sealed'}
              </Button>
            )}

            {activeTask.status === 'PICKED_UP' && (
              <Button
                onClick={() => handleProgressStatus('OUT_FOR_DELIVERY')}
                disabled={isUpdatingStatus}
                className="w-full h-13 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-sm shadow-md"
              >
                {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Driving (Out for Delivery)'}
              </Button>
            )}

            {activeTask.status === 'OUT_FOR_DELIVERY' && (
              <Button
                onClick={() => handleProgressStatus('ARRIVED_AT_CUSTOMER')}
                disabled={isUpdatingStatus}
                className="w-full h-13 rounded-2xl bg-[#171717] hover:bg-black text-white font-bold text-sm shadow-md"
              >
                {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Arrived at Customer Doorstep'}
              </Button>
            )}

            {activeTask.status === 'ARRIVED_AT_CUSTOMER' && (
              <Button
                onClick={() => {
                  setActiveBatchDrop(null);
                  setIsOtpModalOpen(true);
                }}
                className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 animate-bounce"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Enter Customer OTP & Complete Delivery</span>
              </Button>
            )}
          </div>
        </div>
      ) : incomingTasks.length > 0 ? null : (
        /* Idle Waiting Card */
        <div className="bg-white rounded-3xl p-6 border border-[#E5E2DC] text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5A36] flex items-center justify-center mx-auto border border-orange-100">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#171717]">No Active Tasks</h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {isOnline 
                ? 'You are in the queue. New orders from nearby stores will ping you instantly.' 
                : 'Turn your status Online above to receive local delivery jobs.'}
            </p>
          </div>
        </div>
      )}

      {/* 4. Quick Portal Navigation Hub */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/delivery/partner-stores"
          className="p-4.5 rounded-3xl bg-white border border-[#E5E2DC] hover:border-orange-300 transition-all shadow-xs space-y-1 block"
        >
          <div className="p-2 rounded-xl bg-orange-50 text-[#FF5A36] w-fit mb-2">
            <Store className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-[#171717]">Partner Stores</h4>
          <p className="text-[10px] text-[#6B6B6B]">Connect with nearby merchants</p>
        </Link>

        <Link
          href="/delivery/earnings"
          className="p-4.5 rounded-3xl bg-white border border-[#E5E2DC] hover:border-orange-300 transition-all shadow-xs space-y-1 block"
        >
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 w-fit mb-2">
            <DollarSign className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-[#171717]">Earnings & Payouts</h4>
          <p className="text-[10px] text-[#6B6B6B]">View trip history & revenue</p>
        </Link>
      </div>

      {/* 5. Customer OTP Verification Modal (Unified for Single Task & Batch Drops) */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-[#E5E2DC] text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-[#171717]">
                {activeBatchDrop ? `Verify Drop #${activeBatchDrop.dropSequence}` : 'Enter Delivery OTP'}
              </h3>
              <p className="text-xs text-[#6B6B6B]">
                {activeBatchDrop 
                  ? `Ask ${activeBatchDrop.customerName} for their 4-digit handover code.`
                  : 'Ask the customer for their unique 4-digit handover code to verify delivery.'}
              </p>
            </div>

            <input
              type="number"
              placeholder="0000"
              maxLength={4}
              value={inputOtp}
              onChange={(e) => setInputOtp(e.target.value)}
              className="w-full p-3.5 border-2 border-[#E5E2DC] focus:border-emerald-500 rounded-2xl text-center text-3xl tracking-[0.5em] font-mono font-black outline-none"
              autoFocus
            />

            {otpError && (
              <p className="text-xs font-bold text-red-500">{otpError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOtpModalOpen(false);
                  setActiveBatchDrop(null);
                  setInputOtp('');
                  setOtpError('');
                }}
                className="flex-1 h-12 rounded-xl text-[#6B6B6B] font-bold text-xs border-[#E5E2DC]"
              >
                Cancel
              </Button>
              <Button
                onClick={activeBatchDrop ? handleVerifyBatchDrop : handleVerifyDelivery}
                disabled={isVerifyingOtp || isVerifyingBatchDropOtp || inputOtp.length !== 4}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                {(isVerifyingOtp || isVerifyingBatchDropOtp) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Complete'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

