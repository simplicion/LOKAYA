'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useGetDeliveryActiveTaskQuery, 
  useGetDeliveryIncomingTasksQuery,
  useGetDeliveryProfileQuery, 
  useGetDeliveryHistoryQuery,
  useUpdateDeliveryTaskStatusMutation,
  useVerifyDeliveryOtpMutation,
  useAcceptDeliveryTaskMutation
} from '@/lib/api';
import { 
  Package, 
  MapPin, 
  Navigation, 
  Phone, 
  Clock, 
  CheckCircle2, 
  ShoppingBag, 
  Store, 
  User, 
  Loader2, 
  ExternalLink,
  DollarSign,
  ShieldCheck,
  Bike,
  Sparkles,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

export default function DeliveryOrdersPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const { data: activeTask, isLoading: isTaskLoading, refetch: refetchTask } = useGetDeliveryActiveTaskQuery(undefined, {
    pollingInterval: 5000
  });
  const { data: incomingTasks = [], isLoading: isIncomingLoading, refetch: refetchIncoming } = useGetDeliveryIncomingTasksQuery(undefined, {
    pollingInterval: 5000
  });
  const { data: history = [], isLoading: isHistoryLoading } = useGetDeliveryHistoryQuery(undefined, {
    skip: activeTab !== 'history'
  });
  const { data: profile } = useGetDeliveryProfileQuery();

  const [acceptTask, { isLoading: isAccepting }] = useAcceptDeliveryTaskMutation();
  const [updateTaskStatus, { isLoading: isUpdating }] = useUpdateDeliveryTaskStatusMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyDeliveryOtpMutation();

  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const currentOrder = activeTask?.order;

  const formatTimeAgoOrDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Today, ${time}` : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
  };

  const handleAccept = async (assignmentId: string) => {
    try {
      await acceptTask(assignmentId).unwrap();
      toast.success('🎉 Delivery task accepted! Navigate to merchant store.');
      refetchTask();
      refetchIncoming();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to accept task');
    }
  };

  const handleDecline = async (assignmentId: string) => {
    try {
      await updateTaskStatus({ assignmentId, status: 'REJECTED' }).unwrap();
      toast.info('Delivery request declined.');
      refetchTask();
      refetchIncoming();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to decline task');
    }
  };

  const handleProgress = async (newStatus: string) => {
    if (!activeTask) return;
    try {
      await updateTaskStatus({ assignmentId: activeTask.id, status: newStatus }).unwrap();
      toast.success(`Task status: ${newStatus.replace(/_/g, ' ')}`);
      refetchTask();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update status');
    }
  };

  const handleVerify = async () => {
    if (!activeTask || !activeTask.orderId) return;
    if (otp.length !== 4) {
      setOtpError('Please enter a 4-digit code.');
      return;
    }
    try {
      setOtpError('');
      await verifyOtp({ orderId: activeTask.orderId, otp }).unwrap();
      toast.success('🎉 Delivery completed successfully!');
      setIsOtpOpen(false);
      setOtp('');
      refetchTask();
    } catch (err: any) {
      setOtpError(err?.data?.message || 'Invalid OTP code.');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header & Tab Switcher */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-[#171717]">Delivery Tasks</h1>
        <div className="flex bg-[#FAF9F6] border border-[#E5E2DC] p-1 rounded-2xl text-xs font-bold shadow-xs">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'active' ? 'bg-[#171717] text-white shadow-xs' : 'text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            Active Task {incomingTasks.length > 0 && `(${incomingTasks.length})`}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === 'history' ? 'bg-[#171717] text-white shadow-xs' : 'text-[#6B6B6B] hover:text-[#171717]'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === 'active' ? (
        <div className="space-y-4">
          
          {/* 1. INCOMING QUEUED ASSIGNMENTS SECTION (Works Online & Offline) */}
          {incomingTasks.length > 0 && (!activeTask || activeTask.status === 'ASSIGNED') && (
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
                <div key={task.id} className="bg-white rounded-3xl p-5 border-2 border-orange-300 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5A36] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                          New Assignment
                        </span>
                        {task.economics?.distanceKm && (
                          <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200 flex items-center gap-1">
                            <Navigation className="w-2.5 h-2.5 text-blue-600" />
                            <span>{task.economics.distanceKm} km ({task.economics.twoWayDistanceKm || Math.round(task.economics.distanceKm * 2 * 10) / 10} km round trip)</span>
                          </span>
                        )}
                        {(task.assignedAt || task.createdAt) && (
                          <span className="text-[10px] text-gray-500 font-semibold">
                            {formatTimeAgoOrDate(task.assignedAt || task.createdAt)}
                          </span>
                        )}
                      </div>
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

                  <div className="flex items-center justify-between px-1 text-[11px] text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FF5A36]" />
                      Total Trip Distance: <strong className="text-gray-900 font-bold">{task.economics?.distanceKm ? `${task.economics.distanceKm} km (${task.economics.twoWayDistanceKm} km round trip)` : 'Local delivery'}</strong>
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      onClick={() => handleDecline(task.id)}
                      disabled={isUpdating}
                      className="flex-1 h-12 rounded-xl text-xs font-bold border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>Decline</span>
                    </Button>
                    <Button
                      onClick={() => handleAccept(task.id)}
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

          {/* 2. ACTIVE ONGOING TASK CARD (ACCEPTED -> IN PROGRESS) */}
          {activeTask && activeTask.status !== 'ASSIGNED' && currentOrder ? (
            <div className="space-y-4">
              
              {/* Order Identity Card */}
              <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5A36] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                        {activeTask.status.replace(/_/g, ' ')}
                      </span>
                      {activeTask.acceptedAt && (
                        <span className="text-[10px] text-gray-500 font-semibold">
                          Accepted {formatTimeAgoOrDate(activeTask.acceptedAt)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-base text-[#171717] mt-2">
                      Order #{currentOrder.id.slice(0, 8).toUpperCase()}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#6B6B6B]">Trip Payout</span>
                    <p className="text-lg font-black text-emerald-600">{formatPrice(activeTask.deliveryFee || 50)}</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider">
                    Items to Deliver ({currentOrder.items?.length || 0})
                  </span>
                  <div className="space-y-1.5">
                    {(currentOrder.items || []).map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-xs py-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-gray-100 text-[#171717] font-bold flex items-center justify-center text-[10px]">
                            {item.quantity}x
                          </span>
                          <span className="font-semibold text-[#171717]">{item.productName || item.sku}</span>
                        </div>
                        <span className="font-bold text-[#171717]">{formatPrice(item.priceAt * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* STORE PICKUP OTP CARD (Handshake #1: Rider -> Merchant) */}
              {['ACCEPTED', 'ARRIVED_AT_STORE'].includes(activeTask.status) && (
                <div className="bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white rounded-3xl p-5 border border-slate-800 shadow-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <Store className="w-3.5 h-3.5" />
                      <span>Store Pickup Verification</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Share with Merchant</span>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-3 text-center border border-white/10">
                    <span className="text-3xl sm:text-4xl font-mono font-black tracking-[0.4em] text-white">
                      {currentOrder.pickupOtp?.otpCode || '1234'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 text-center leading-relaxed">
                    Show this 4-digit code to the store owner. Once they enter this code, your parcel pickup is verified.
                  </p>
                </div>
              )}

              {/* Merchant Store Pickup Card */}
              <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-[#FF5A36]" />
                    <span>Pickup Location (Merchant)</span>
                  </span>
                  {currentOrder.store?.contactPhone && (
                    <a
                      href={`tel:${currentOrder.store.contactPhone}`}
                      className="p-1.5 px-2.5 rounded-xl bg-orange-50 text-[#FF5A36] hover:bg-orange-100 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Store</span>
                    </a>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-[#171717]">{currentOrder.store?.name}</h4>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{currentOrder.store?.address}</p>
                </div>

                {currentOrder.store?.latitude && currentOrder.store?.longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${currentOrder.store.latitude},${currentOrder.store.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF5A36] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-orange-100 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Open Maps Directions to Store</span>
                  </a>
                )}
              </div>

              {/* Customer Delivery Destination Card */}
              <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6B6B6B] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>Drop-Off Destination (Customer)</span>
                  </span>
                  {currentOrder.buyer?.phone && (
                    <a
                      href={`tel:${currentOrder.buyer.phone}`}
                      className="p-1.5 px-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Customer</span>
                    </a>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-[#171717]">{currentOrder.buyer?.name || 'Customer'}</h4>
                  <p className="text-xs text-[#6B6B6B] mt-0.5 leading-relaxed">
                    {currentOrder.deliveryAddress || 'Customer Address'}
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <span>🔒 Handover Security Notice</span>
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Ask customer for their unique 4-digit Delivery OTP before handing over the parcel.
                  </p>
                </div>
              </div>

              {/* Sticky Action Bar */}
              <div className="sticky bottom-20 z-20">
                {activeTask.status === 'ACCEPTED' && (
                  <Button
                    onClick={() => handleProgress('ARRIVED_AT_STORE')}
                    disabled={isUpdating}
                    className="w-full h-14 rounded-2xl bg-[#171717] hover:bg-black text-white font-bold text-base shadow-xl"
                  >
                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Arrived at Store'}
                  </Button>
                )}

                {activeTask.status === 'ARRIVED_AT_STORE' && (
                  <Button
                    onClick={() => handleProgress('PICKED_UP')}
                    disabled={isUpdating}
                    className="w-full h-14 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-base shadow-xl shadow-orange-500/20"
                  >
                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Order Picked Up'}
                  </Button>
                )}

              {activeTask.status === 'PICKED_UP' && (
                <Button
                  onClick={() => handleProgress('OUT_FOR_DELIVERY')}
                  disabled={isUpdating}
                  className="w-full h-14 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-base shadow-xl shadow-orange-500/20"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Driving (Out for Delivery)'}
                </Button>
              )}

              {activeTask.status === 'OUT_FOR_DELIVERY' && (
                <Button
                  onClick={() => handleProgress('ARRIVED_AT_CUSTOMER')}
                  disabled={isUpdating}
                  className="w-full h-14 rounded-2xl bg-[#171717] hover:bg-black text-white font-bold text-base shadow-xl"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Arrived at Customer Doorstep'}
                </Button>
              )}

              {activeTask.status === 'ARRIVED_AT_CUSTOMER' && (
                <Button
                  onClick={() => setIsOtpOpen(true)}
                  className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 animate-bounce"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Enter Customer OTP & Deliver</span>
                </Button>
              )}
              </div>
            </div>
          ) : null}

          {/* 3. Empty State when NO Active Task AND NO Incoming Requests */}
          {incomingTasks.length === 0 && (!activeTask || activeTask.status === 'ASSIGNED' || !currentOrder) && (
            <div className="bg-white rounded-3xl p-8 border border-[#E5E2DC] text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 text-[#6B6B6B] flex items-center justify-center mx-auto border border-gray-100">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-sm text-[#171717]">No In-Progress Deliveries</h3>
              <p className="text-xs text-[#6B6B6B]">
                When stores assign an order or when you accept an incoming request, trip navigation and customer details will appear here.
              </p>
            </div>
          )}

        </div>
      ) : (
        /* History Tab */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-sm text-[#171717]">Completed Trip Records</h3>
            <span className="text-xs font-bold text-[#6B6B6B]">{(history || []).length} Deliveries</span>
          </div>

          {isHistoryLoading ? (
            <div className="flex h-40 items-center justify-center bg-white rounded-3xl border border-[#E5E2DC]">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF5A36]" />
            </div>
          ) : (history || []).length > 0 ? (
            <div className="space-y-3">
              {history.map((trip: any) => (
                <div key={trip.id} className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {trip.status}
                      </span>
                      <h4 className="font-black text-sm text-[#171717] mt-1">
                        Order #{trip.orderId.slice(0, 8).toUpperCase()}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#6B6B6B] uppercase">Payout</span>
                      <p className="text-base font-black text-emerald-600">{formatPrice(trip.deliveryFee || 40)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] font-bold block uppercase">Merchant</span>
                      <span className="font-bold text-[#171717] truncate block">{trip.storeName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B6B6B] font-bold block uppercase">Customer</span>
                      <span className="font-bold text-[#171717] truncate block">{trip.buyerName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{trip.deliveredAt ? formatTimeAgoOrDate(trip.deliveredAt) : 'Completed'}</span>
                    </span>
                    <span className="font-semibold text-[#171717]">{trip.itemsCount} items</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-[#E5E2DC] text-center space-y-2 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 text-[#6B6B6B] flex items-center justify-center mx-auto border border-gray-100">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[#171717]">No Past Deliveries Yet</h4>
              <p className="text-xs text-[#6B6B6B]">Your completed drops and payout ledger will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* OTP Modal */}
      {isOtpOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl border border-[#E5E2DC]">
            <h3 className="text-lg font-black text-[#171717]">Enter Customer OTP</h3>
            <p className="text-xs text-[#6B6B6B]">Ask the customer for their 4-digit code.</p>

            <input
              type="number"
              placeholder="0000"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3.5 border-2 border-[#E5E2DC] focus:border-emerald-500 rounded-2xl text-center text-3xl font-mono font-black tracking-[0.5em] outline-none"
              autoFocus
            />

            {otpError && <p className="text-xs font-bold text-red-500">{otpError}</p>}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => { setIsOtpOpen(false); setOtp(''); setOtpError(''); }}
                className="flex-1 h-12 rounded-xl text-xs font-bold border-[#E5E2DC]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isVerifyingOtp || otp.length !== 4}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Complete'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
