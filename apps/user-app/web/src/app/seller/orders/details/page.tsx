'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Keyboard, 
  Loader2, 
  Truck, 
  Printer, 
  Download, 
  ExternalLink, 
  PackageCheck, 
  CheckCircle2, 
  Package, 
  Phone, 
  User, 
  Tag, 
  Copy, 
  Check, 
  ShoppingBag,
  CreditCard,
  Banknote,
  Store,
  Bike,
  Sparkles,
  UserCheck,
  ChevronRight,
  Send,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  useGetOrderQuery, 
  useUpdateOrderStatusMutation, 
  useVerifyOrderPickupMutation,
  useVerifyStorePickupMutation,
  useDispatchShipmentMutation,
  useDispatchOrderWithFulfillmentMutation,
  useGetStoreConnectedPartnersQuery,
  useGetOrderDeliveryEconomicsQuery
} from '@/lib/api';
import { PartnerSelectionBottomSheet } from '@/components/seller/PartnerSelectionBottomSheet';
import { ParcelRecognitionSlipModal } from '@/components/seller/ParcelRecognitionSlip';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { isIndianStore } from '@/lib/utils';

function OrderDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const { formatPrice } = useCurrency();
  const [copiedId, setCopiedId] = useState(false);
  const [isParcelSlipOpen, setIsParcelSlipOpen] = useState(false);

  const formatDateTime = (dateStr?: string | Date | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const { data: order, isLoading, refetch } = useGetOrderQuery(id, { skip: !id });
  const { data: orderEconomics } = useGetOrderDeliveryEconomicsQuery(id, { skip: !id });
  const { data: connectedPartners = [] } = useGetStoreConnectedPartnersQuery(
    order?.storeId || '',
    { skip: !order?.storeId }
  );

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();
  const [verifyPickup, { isLoading: isVerifyingPickup }] = useVerifyOrderPickupMutation();
  const [verifyStorePickup, { isLoading: isVerifyingStorePickup }] = useVerifyStorePickupMutation();
  const [dispatchFulfillment, { isLoading: isDispatchingFulfillment }] = useDispatchOrderWithFulfillmentMutation();
  const [dispatchShipmentMutation, { isLoading: isDispatching }] = useDispatchShipmentMutation();

  // Verification & Dispatch Modal States
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isStorePickupOtpModalOpen, setIsStorePickupOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [storePickupOtp, setStorePickupOtp] = useState('');
  const [error, setError] = useState('');
  const [storePickupError, setStorePickupError] = useState('');

  // 3-Option Fulfillment Modal & Partner Selection Sheet States
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isPartnerSelectModalOpen, setIsPartnerSelectModalOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  const handleVerifyOtp = async () => {
    if (otp.length === 4) {
      try {
        setError('');
        await verifyPickup({ orderId: id, otp }).unwrap();
        setIsOtpModalOpen(false);
        setOtp('');
        toast.success('Order pickup verified successfully!');
        refetch();
      } catch (err: any) {
        setError(err?.data?.message || 'Invalid OTP code. Please check with customer.');
      }
    } else {
      setError('Please enter a valid 4-digit OTP code.');
    }
  };

  const handleVerifyStorePickup = async () => {
    if (storePickupOtp.length === 4) {
      try {
        setStorePickupError('');
        await verifyStorePickup({ orderId: id, otp: storePickupOtp }).unwrap();
        setIsStorePickupOtpModalOpen(false);
        setStorePickupOtp('');
        toast.success('🎉 Store pickup verified! Package handed over to delivery partner.');
        refetch();
      } catch (err: any) {
        setStorePickupError(err?.data?.message || 'Invalid Store Pickup OTP. Please check with rider.');
      }
    } else {
      setStorePickupError('Please enter the 4-digit OTP provided by the delivery partner.');
    }
  };

  const handleFulfillDispatch = async (type: 'LOKAYA_AUTO' | 'LOKAYA_PARTNER' | 'SELF_DELIVERY', partnerId?: string) => {
    const pId = partnerId || selectedPartnerId;
    if (type === 'LOKAYA_PARTNER' && !pId) {
      toast.error('Please select one of your connected partner riders.');
      return;
    }

    try {
      const res = await dispatchFulfillment({
        orderId: id,
        fulfillmentType: type,
        deliveryPartnerId: pId || undefined
      }).unwrap();

      if (type === 'LOKAYA_AUTO') {
        if (res.assigned) {
          toast.success(`Rider ${res.rider?.name || 'Partner'} assigned via Smart Assigning Engine!`);
        } else {
          toast.info(res.message || 'No riders online. Order queued for assignment.');
        }
      } else if (type === 'LOKAYA_PARTNER') {
        toast.success('Order assigned to your partner delivery rider!');
      } else {
        toast.success('Order marked for self-delivery fulfillment.');
      }

      setIsDispatchModalOpen(false);
      setIsPartnerSelectModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to dispatch order');
    }
  };

  const handleShiprocketDispatch = async () => {
    try {
      await dispatchShipmentMutation(id).unwrap();
      toast.success('Shipment booked with Shiprocket! AWB & Shipping Label generated.');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to dispatch with Shiprocket');
    }
  };

  const handleTransitionStatus = async (newStatus: string) => {
    try {
      await updateStatus({ orderId: id, status: newStatus }).unwrap();
      refetch();
    } catch (err: any) {
      console.error('Failed to update order status:', err);
    }
  };

  const handleCopyOrderId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(order?.id || id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      toast.success('Order ID copied to clipboard');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black rounded-lg uppercase tracking-wider">New</span>;
      case 'Preparing':
        return <span className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-black rounded-lg uppercase tracking-wider">Preparing</span>;
      case 'Ready':
        return <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-black rounded-lg uppercase tracking-wider">Packed & Ready</span>;
      case 'Completed':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-lg uppercase tracking-wider">Completed</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 text-xs font-black rounded-lg uppercase tracking-wider">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6 text-center bg-gray-50">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-4">This order could not be located in your store records.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const items = order.items || [];
  const itemsSubtotal = items.reduce((acc: number, it: any) => {
    const p = Number(it.price || it.priceAt || 0);
    const q = Number(it.qty || it.quantity || 1);
    return acc + (p * q);
  }, 0);
  const totalAmount = Number(order.totalAmount || order.total || itemsSubtotal);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col max-w-xl mx-auto border-x border-[#E5E2DC]">
      {/* Top Bar Navigation */}
      <div className="bg-white border-b border-[#E5E2DC] sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/seller/orders')}
            className="rounded-full w-9 h-9 hover:bg-gray-100 -ml-1 text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-base font-black text-gray-900 leading-none">Order Management</h1>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">ID: {order.id.slice(0, 12)}...</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsParcelSlipOpen(true)}
            className="h-9 px-3 rounded-xl text-xs font-bold border-orange-200 text-[#FF5A36] bg-orange-50/50 hover:bg-orange-100/70 flex items-center gap-1.5 shadow-xs"
          >
            <Tag className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>Parcel Slip</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/seller/orders/invoice?id=${order.id}`)}
            className="h-9 px-3.5 rounded-xl text-xs font-bold border-[#E5E2DC] text-gray-800 hover:bg-gray-100 flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>Tax Invoice</span>
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        
        {/* Order ID & Status Header */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5E2DC] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-gray-900 text-lg">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            {order.isManualBooking && (
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-black rounded-md uppercase tracking-wider">
                POS Manual
              </span>
            )}
            <button
              onClick={handleCopyOrderId}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              title="Copy Order ID"
            >
              {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {getStatusBadge(order.status)}
        </div>

        {/* Order Milestones & Timestamps Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5E2DC] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order Milestones & Timestamps</span>
            <span className="text-[10px] font-mono font-semibold text-gray-400">Activity Log</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-[#FAF9F6] border border-[#E5E2DC] rounded-xl p-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">1. Order Placed</span>
              <p className="text-xs font-bold text-gray-900 mt-1">
                {formatDateTime(order.createdAt) || order.timeLabel || 'Recent'}
              </p>
            </div>

            <div className="bg-[#FAF9F6] border border-[#E5E2DC] rounded-xl p-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">2. Store Pickup & Handover</span>
              <p className="text-xs font-bold text-gray-900 mt-1">
                {order.pickedUpAt ? (
                  formatDateTime(order.pickedUpAt)
                ) : ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.rawStatus) ? (
                  formatDateTime(order.updatedAt) || 'Handed Over'
                ) : (
                  <span className="text-gray-400 font-medium italic">Pending Pickup</span>
                )}
              </p>
            </div>

            <div className="bg-[#FAF9F6] border border-[#E5E2DC] rounded-xl p-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">3. Customer Delivery</span>
              <p className="text-xs font-bold text-gray-900 mt-1">
                {order.deliveredAt ? (
                  <span className="text-emerald-700 font-bold">{formatDateTime(order.deliveredAt)}</span>
                ) : order.rawStatus === 'DELIVERED' ? (
                  <span className="text-emerald-700 font-bold">{formatDateTime(order.updatedAt) || 'Delivered'}</span>
                ) : (
                  <span className="text-amber-600 font-medium italic">In Transit / Processing</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Assigned Delivery Rider Banner (if assigned) */}
        {order.deliveryPartner && (
          <div className="bg-gradient-to-tr from-[#0F172A] to-[#1E293B] text-white p-4 rounded-2xl shadow-sm space-y-2 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                <Bike className="w-3 h-3" />
                <span>Assigned Delivery Rider</span>
              </span>
              <span className="text-xs text-slate-400">
                {order.rawStatus === 'SHIPPED' ? 'Picked Up & En Route' : 'Assigned for Pickup'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="font-bold text-sm text-white">{order.deliveryPartner.name}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {order.deliveryPartner.vehicleType} • {order.deliveryPartner.vehicleNumber}
                </p>
              </div>

              {order.deliveryPartner.phone && (
                <a
                  href={`tel:${order.deliveryPartner.phone}`}
                  className="p-2 rounded-xl bg-orange-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm hover:bg-orange-600 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Rider</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Customer Details Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E2DC] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Details</span>
            <span className="text-xs font-semibold text-gray-400">{order.timeLabel}</span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#171717] text-white font-black text-sm flex items-center justify-center shrink-0">
                {(order.customerName || 'C').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base leading-tight">{order.customerName}</p>
                {order.phone && (
                  <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{order.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {order.phone && (
              <a
                href={`tel:${order.phone}`}
                className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0"
                title="Call Customer"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>

          {order.deliveryAddress && (
            <div className="pt-2 border-t border-[#E5E2DC] text-xs text-gray-600">
              <span className="font-bold text-gray-700">Delivery Address: </span>
              <span>{order.deliveryAddress}</span>
            </div>
          )}
        </div>

        {/* Items Ordered */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E2DC] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Items Ordered ({items.length})
            </span>
          </div>

          <div className="divide-y divide-[#E5E2DC]">
            {items.map((it: any) => (
              <div key={it.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-gray-900 truncate">{it.name || it.productName}</h4>
                    <p className="text-[11px] text-gray-500 font-mono">SKU: {it.sku || 'N/A'}</p>
                    <p className="text-[11px] text-gray-600 font-bold">Qty: {it.qty || it.quantity} × {formatPrice(it.price || it.priceAt)}</p>
                  </div>
                </div>
                <span className="font-black text-xs text-gray-900 shrink-0">
                  {formatPrice((it.price || it.priceAt) * (it.qty || it.quantity))}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E5E2DC] pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Items Subtotal</span>
              <span>{formatPrice(itemsSubtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery Fee (Customer Paid)</span>
              <span className="text-emerald-600">{formatPrice(order.shippingFee || 0)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-gray-900 pt-1 border-t border-gray-100">
              <span>Total Order Value</span>
              <span className="text-[#FF5A36]">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Merchant Financial Settlement Breakdown Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E2DC] space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-gray-700">
              Merchant Payout Settlement
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Direct Payout
            </span>
          </div>

          <div className="space-y-1.5 text-gray-600">
            <div className="flex justify-between">
              <span>Gross Product Sales</span>
              <span className="font-semibold text-gray-900">{formatPrice(itemsSubtotal)}</span>
            </div>
            
            <div className="flex justify-between items-center text-amber-700">
              <span className="flex items-center gap-1">
                <span>Platform Margin Fee (5% Profit Margin)</span>
              </span>
              <span className="font-bold">
                -{formatPrice(order.subOrders?.[0]?.platformMarginCommission ?? items.reduce((acc: number, it: any) => {
                  const sp = Number(it.price || it.priceAt || 0);
                  const cp = it.product?.costPrice !== undefined && it.product?.costPrice !== null ? Number(it.product.costPrice) : sp * 0.8;
                  const margin = Math.max(0, sp - cp);
                  return acc + (margin * 0.05 * (Number(it.qty || it.quantity || 1)));
                }, 0))}
              </span>
            </div>

            {order.subOrders?.[0]?.shippingMerchantProfit !== undefined && (
              <div className="flex justify-between items-center text-emerald-700">
                <span>Shipping Margin Settlement</span>
                <span className="font-bold">
                  {order.subOrders[0].shippingMerchantProfit >= 0 ? '+' : ''}
                  {formatPrice(order.subOrders[0].shippingMerchantProfit)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-gray-100 font-black text-sm text-gray-900">
              <span>Est. Store Net Payout</span>
              <span className="text-emerald-700">
                {formatPrice(
                  Math.max(0, itemsSubtotal - (order.subOrders?.[0]?.platformMarginCommission ?? items.reduce((acc: number, it: any) => {
                    const sp = Number(it.price || it.priceAt || 0);
                    const cp = it.product?.costPrice !== undefined && it.product?.costPrice !== null ? Number(it.product.costPrice) : sp * 0.8;
                    const margin = Math.max(0, sp - cp);
                    return acc + (margin * 0.05 * (Number(it.qty || it.quantity || 1)));
                  }, 0)) + (order.subOrders?.[0]?.shippingMerchantProfit || 0))
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Payment & Fulfillment Summary */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E2DC] space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Payment Method</span>
            <span className="font-bold text-gray-900">{order.paymentMethod || 'Cash on Delivery'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Fulfillment Type</span>
            <span className="font-bold text-gray-900">
              {order.deliveryAddress ? 'Doorstep Delivery' : 'In-Store Pickup'}
            </span>
          </div>
          {orderEconomics?.distanceKm && (
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Estimated Delivery Distance</span>
              <span className="font-bold text-gray-900">{orderEconomics.distanceKm} km ({orderEconomics.twoWayDistanceKm} km round-trip)</span>
            </div>
          )}
        </div>

      </div>

      {/* Fixed Action Area at Bottom */}
      {order.status !== 'Completed' && (
        <div className="bg-white p-4 border-t border-gray-100 space-y-3 fixed bottom-0 left-0 w-full z-20 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          
          {/* State: New -> Prepare */}
          {order.status === 'New' && (
            <Button 
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-bold shadow-md"
              disabled={isUpdatingStatus}
              onClick={() => handleTransitionStatus('Preparing')}
            >
              {isUpdatingStatus ? 'Starting...' : 'Accept Order & Start Preparing'}
            </Button>
          )}
          
          {/* State: Preparing -> Ready */}
          {order.status === 'Preparing' && (
            <Button 
              className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-base font-bold shadow-md"
              disabled={isUpdatingStatus}
              onClick={() => handleTransitionStatus('Ready')}
            >
              {isUpdatingStatus ? 'Updating...' : 'Mark as Packed & Ready for Handover'}
            </Button>
          )}

          {/* State: Ready -> Dispatch Fulfillment or Verify Rider Pickup */}
          {order.status === 'Ready' && (
            <div className="space-y-2">
              {order.deliveryPartner ? (
                <>
                  <Button 
                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-base font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                    onClick={() => setIsStorePickupOtpModalOpen(true)}
                  >
                    <Bike className="w-5 h-5" />
                    <span>Verify Rider Pickup OTP & Dispatch</span>
                  </Button>

                  <div className="flex items-center justify-between text-xs font-bold px-1">
                    <button
                      type="button"
                      onClick={() => setIsDispatchModalOpen(true)}
                      className="text-slate-500 hover:text-slate-800 py-1"
                    >
                      Change / Re-assign Rider
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOtpModalOpen(true)}
                      className="text-slate-500 hover:text-slate-800 py-1"
                    >
                      Customer Direct Pickup?
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Button 
                    className="w-full h-14 bg-[#FF6B00] hover:bg-[#ff7a1f] text-white rounded-2xl text-base font-black shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                    onClick={() => setIsDispatchModalOpen(true)}
                  >
                    <Bike className="w-5 h-5" />
                    <span>Dispatch Order (Choose Rider / Delivery)</span>
                  </Button>

                  {/* In-Store Customer Pickup Fallback OTP verification */}
                  <button
                    type="button"
                    onClick={() => setIsOtpModalOpen(true)}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-1"
                  >
                    Customer Picked Up in Person? Enter Customer Pickup OTP
                  </button>
                </>
              )}
            </div>
          )}

          {/* State: Shipped / Out for Delivery */}
          {order.status === 'Shipped' && (
            <div className="space-y-2">
              {order.fulfillmentType === 'SELF_DELIVERY' ? (
                <Button 
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-base font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  onClick={() => setIsOtpModalOpen(true)}
                >
                  <Check className="w-5 h-5" />
                  <span>Complete Self-Delivery (Verify Customer OTP)</span>
                </Button>
              ) : (
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl text-center space-y-1">
                  <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                    <Bike className="w-4 h-4 animate-bounce" />
                    <span>In Transit with {order.deliveryPartner?.name || 'Assigned Courier'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Delivery partner will enter the customer OTP upon doorstep arrival.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* 3-TIER DISPATCH FULFILLMENT MODAL (PRIMARY BOTTOM SHEET) */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-100 text-[#FF6B00]">
                  <Bike className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-gray-900">Dispatch Order</h3>
                  <p className="text-xs text-gray-500">Select how to fulfill this parcel</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDispatchModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Lokaya Auto-Assign Engine */}
              <button
                type="button"
                onClick={() => handleFulfillDispatch('LOKAYA_AUTO')}
                disabled={isDispatchingFulfillment}
                className="w-full p-4 rounded-2xl border-2 border-[#FF6B00] bg-orange-50/50 hover:bg-orange-50 text-left transition-all space-y-1 block shadow-xs active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-[#FF6B00] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Lokaya Delivery (Smart Auto-Assign)</span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#FF6B00] text-white px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Our smart engine finds the nearest active online rider based on your store's GPS location.
                </p>
              </button>

              {/* Option 2: Store's Connected Partner Delivery Boys (Opens 2nd Bottom Sheet) */}
              <button
                type="button"
                onClick={() => {
                  setIsDispatchModalOpen(false);
                  setIsPartnerSelectModalOpen(true);
                }}
                className="w-full p-4 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/40 hover:bg-emerald-50 text-left transition-all space-y-1 block shadow-xs active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-emerald-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Lokaya Delivery Partners</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      {connectedPartners.length} {connectedPartners.length === 1 ? 'Rider' : 'Riders'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-emerald-700 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Select from your store's connected partner riders & delivery boys.
                </p>
              </button>

              {/* Option 3: Custom / Self Delivery */}
              <button
                type="button"
                onClick={() => handleFulfillDispatch('SELF_DELIVERY')}
                disabled={isDispatchingFulfillment}
                className="w-full p-4 rounded-2xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-slate-50 text-left transition-all space-y-1 block shadow-xs active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-gray-600" />
                    <span>Custom / Self Delivery</span>
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    Store Staff
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Fulfill directly using your own in-house store delivery boy or courier.
                </p>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SECONDARY BOTTOM SHEET: DELIVERY PARTNER SELECTION DRAWER */}
      <PartnerSelectionBottomSheet
        isOpen={isPartnerSelectModalOpen}
        onClose={() => setIsPartnerSelectModalOpen(false)}
        onBack={() => {
          setIsPartnerSelectModalOpen(false);
          setIsDispatchModalOpen(true);
        }}
        partners={connectedPartners}
        selectedPartnerId={selectedPartnerId}
        onSelectPartner={(riderId) => setSelectedPartnerId(riderId)}
        onConfirmAssign={() => handleFulfillDispatch('LOKAYA_PARTNER')}
        isSubmitting={isDispatchingFulfillment}
        customerPaidShipping={order.shippingFee || orderEconomics?.customerPaidShippingFee || 50}
        orderDistanceKm={orderEconomics?.distanceKm || 5}
      />

      {/* STORE PICKUP OTP MODAL (Handshake #1: Rider -> Merchant Verification) */}
      {isStorePickupOtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-200 border border-emerald-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Verify Rider Store Pickup OTP</h3>
              <p className="text-xs text-gray-500 mt-1">
                Ask delivery rider <span className="font-bold text-gray-800">{order.deliveryPartner?.name || 'Partner'}</span> for their 4-digit pickup code before handing over the parcel.
              </p>
            </div>

            <input 
              type="number" 
              placeholder="0000"
              maxLength={4}
              value={storePickupOtp}
              onChange={(e) => setStorePickupOtp(e.target.value)}
              className="w-full p-4 border-2 border-emerald-200 focus:border-emerald-500 rounded-2xl text-center text-3xl font-mono font-black tracking-[0.4em] outline-none"
              autoFocus
            />
            
            {storePickupError && <p className="text-xs text-red-500 font-bold">{storePickupError}</p>}

            <div className="flex gap-3 pt-1">
              <Button 
                variant="outline"
                className="flex-1 h-12 rounded-xl text-gray-600 font-bold text-xs"
                onClick={() => { setIsStorePickupOtpModalOpen(false); setStorePickupError(''); setStorePickupOtp(''); }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
                disabled={isVerifyingStorePickup || storePickupOtp.length !== 4}
                onClick={handleVerifyStorePickup}
              >
                {isVerifyingStorePickup ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Dispatch'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER PICKUP OTP MODAL (In-Store Handover) */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-gray-900">Enter Customer Pickup OTP</h3>
            <p className="text-xs text-gray-500">Ask the customer for their 4-digit pickup code.</p>

            <input 
              type="number" 
              placeholder="0000"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-xl text-center text-2xl tracking-widest font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1 h-12 rounded-xl text-gray-600 font-bold text-xs"
                onClick={() => { setIsOtpModalOpen(false); setError(''); setOtp(''); }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
                disabled={isVerifyingPickup || otp.length !== 4}
                onClick={handleVerifyOtp}
              >
                {isVerifyingPickup ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Parcel Recognition Slip Modal */}
      <ParcelRecognitionSlipModal
        isOpen={isParcelSlipOpen}
        onClose={() => setIsParcelSlipOpen(false)}
        order={{
          id: order.id,
          createdAt: order.createdAt,
          timeLabel: order.timeLabel,
          paymentMethod: order.paymentMethod,
          isPaid: order.isPaid,
          totalAmount: totalAmount,
          customerName: order.customerName,
          phone: order.phone,
          deliveryAddress: order.deliveryAddress,
          deliveryLandmark: order.deliveryLandmark,
          storeName: order.store?.name,
          storePhone: order.store?.contactPhone,
          items: items.map((it: any) => ({
            id: it.id,
            name: it.name || it.productName,
            variantName: it.variantName || it.variant?.name,
            sku: it.sku,
            quantity: it.qty || it.quantity,
            price: it.price || it.priceAt,
            image: it.image || it.product?.imageUrl
          }))
        }}
      />

    </div>
  );
}

export default function OrderDetailsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <OrderDetailsContent />
    </Suspense>
  );
}
