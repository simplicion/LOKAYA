'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  QrCode, 
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
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  useGetOrderQuery, 
  useUpdateOrderStatusMutation, 
  useVerifyOrderPickupMutation,
  useDispatchShipmentMutation 
} from '@/lib/api';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useCurrency } from '@/context/CurrencyContext';

function OrderDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const { formatPrice } = useCurrency();
  const [copiedId, setCopiedId] = useState(false);

  const { data: order, isLoading, refetch } = useGetOrderQuery(id, { skip: !id });
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();
  const [verifyPickup, { isLoading: isVerifyingPickup }] = useVerifyOrderPickupMutation();
  const [dispatchShipmentMutation, { isLoading: isDispatching }] = useDispatchShipmentMutation();

  // 'none' | 'otp' | 'qr'
  const [verifyMode, setVerifyMode] = useState<'none' | 'otp' | 'qr'>('none');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  // Handle QR Scanner
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (verifyMode === 'qr' && (order?.status === 'Ready' || order?.rawStatus === 'PACKED')) {
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          'qr-reader-order',
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
          },
          false
        );
        
        scanner.render(
          async (decodedText) => {
            try {
              await verifyPickup({ orderId: id, qrToken: decodedText }).unwrap();
              setVerifyMode('none');
              if (scanner) {
                scanner.clear().catch(console.error);
              }
              refetch();
            } catch (err: any) {
              setError(err?.data?.message || 'Invalid QR code. Please try OTP.');
            }
          }, 
          (error) => {
            // scan errors continuously ignored
          }
        );
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(console.error);
        }
      };
    }
  }, [verifyMode, order, id, verifyPickup, refetch]);

  const handleVerifyOtp = async () => {
    if (otp.length === 4) {
      try {
        setError('');
        await verifyPickup({ orderId: id, otp }).unwrap();
        setVerifyMode('none');
        setOtp('');
        refetch();
      } catch (err: any) {
        setError(err?.data?.message || 'Invalid OTP code. Please check with customer.');
      }
    } else {
      setError('Please enter a valid 4-digit OTP code.');
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
        return <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-black rounded-lg uppercase tracking-wider">Ready for Pickup</span>;
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
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-36">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-[#E5E2DC]">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Order Details
        </h1>
      </div>

      <div className="p-4 space-y-4 flex-1">
        
        {/* Order ID & Status Header */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E5E2DC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-gray-900 text-lg">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
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
                    {order.phone}
                  </p>
                )}
              </div>
            </div>

            {order.phone && order.phone !== '+91 Not provided' && (
              <a 
                href={`tel:${order.phone}`}
                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 flex items-center gap-1 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
            )}
          </div>

          {order.status === 'Ready' && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium">
              Customer has been notified that the order is ready for pickup!
            </div>
          )}
        </div>

        {/* Rich Items List Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E2DC] space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#FF5A36]" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Items Ordered ({order.itemsCount || items.length})
              </h3>
            </div>
          </div>

          {/* Product Items Breakdown */}
          <div className="divide-y divide-gray-100">
            {items.map((item: any, idx: number) => {
              const itemImg = item.image || item.product?.imageUrl || item.product?.media?.[0]?.url;
              const itemName = item.name || item.productName || item.title || 'Product Item';
              const itemQty = Number(item.qty || item.quantity || 1);
              const itemPrice = Number(item.price || item.priceAt || 0);
              const itemVariant = item.variantName || item.variant?.name || null;
              const itemSku = item.sku || item.variant?.sku || item.product?.sku || null;

              return (
                <div key={item.id || idx} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5">
                  {/* Thumbnail Image */}
                  <div className="w-16 h-16 rounded-xl bg-gray-50 border border-[#E5E2DC] relative overflow-hidden shrink-0 flex items-center justify-center">
                    {itemImg ? (
                      <Image 
                        src={itemImg} 
                        alt={itemName} 
                        fill 
                        className="object-cover"
                        sizes="64px" 
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-300" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-snug">
                      {itemName}
                    </p>
                    
                    {/* Variant & SKU */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {itemVariant && (
                        <span className="inline-block text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                          Variant: {itemVariant}
                        </span>
                      )}
                      {itemSku && (
                        <span className="inline-block font-mono text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                          SKU: {itemSku}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-gray-500 mt-1.5">
                      Qty: {itemQty} × {formatPrice(itemPrice)}
                    </p>
                  </div>

                  {/* Line Total */}
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-gray-900">
                      {formatPrice(itemPrice * itemQty)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Breakdown */}
          <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between text-gray-500 font-medium">
              <span>Items Subtotal</span>
              <span className="font-semibold text-gray-800">{formatPrice(itemsSubtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500 font-medium">
              <span>Delivery Fee</span>
              <span className="font-semibold text-emerald-600">
                {order.shippingFee ? formatPrice(order.shippingFee) : 'FREE'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 font-bold text-sm">
              <span className="text-gray-900">Total Order Value</span>
              <span className="font-black text-[#FF5A36] text-lg">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Payment Method</span>
            <span className="font-medium text-gray-900">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Pickup / Delivery</span>
            <span className="font-medium text-gray-900">
              {order.deliveryAddress ? 'Doorstep Delivery' : order.pickupTime}
            </span>
          </div>
          {order.deliveryAddress && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-700 block mb-0.5">Shipping Address:</span>
              {order.deliveryAddress}
            </div>
          )}
        </div>

        {/* Shiprocket 3PL Logistics Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Shiprocket 3PL Logistics</h3>
                <p className="text-[11px] text-gray-500">Automated AWB & courier dispatch</p>
              </div>
            </div>

            {order.awbCode && (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Booked
              </span>
            )}
          </div>

          {order.awbCode ? (
            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Courier Partner</span>
                <span className="font-bold text-gray-900">{order.courierName || 'Standard Express'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">AWB Tracking Code</span>
                <span className="font-mono font-bold text-gray-900">{order.awbCode}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                {order.shippingLabelUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(order.shippingLabelUrl, '_blank')}
                    className="h-10 rounded-xl text-xs font-bold border-gray-300 text-gray-800 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Label
                  </Button>
                )}

                {order.trackingUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(order.trackingUrl, '_blank')}
                    className="h-10 rounded-xl text-xs font-bold border-orange-200 text-[#FF6B00] hover:bg-orange-50 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Track AWB
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <p className="text-xs text-gray-500">
                Book automated doorstep courier pickup with 1 click.
              </p>
              <Button
                onClick={handleShiprocketDispatch}
                disabled={isDispatching}
                className="w-full h-11 bg-[#FF6B00] hover:bg-[#ff7a1f] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                {isDispatching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Booking Shiprocket Pickup...
                  </>
                ) : (
                  <>
                    <PackageCheck className="w-4 h-4" />
                    Accept & Dispatch via Shiprocket
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

      </div>

      {/* Fixed Action Area */}
      {order.status !== 'Completed' && (
        <div className="bg-white p-4 border-t border-gray-100 space-y-3 fixed bottom-0 left-0 w-full z-20 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          
          {/* State: New -> Prepare */}
          {order.status === 'New' && (
            <Button 
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-lg font-medium"
              disabled={isUpdatingStatus}
              onClick={() => handleTransitionStatus('Preparing')}
            >
              {isUpdatingStatus ? 'Starting...' : 'Start Preparing Order'}
            </Button>
          )}
          
          {/* State: Preparing -> Ready */}
          {order.status === 'Preparing' && (
            <Button 
              className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-lg font-medium"
              disabled={isUpdatingStatus}
              onClick={() => handleTransitionStatus('Ready')}
            >
              {isUpdatingStatus ? 'Updating...' : 'Mark as Ready & Notify Customer'}
            </Button>
          )}

          {/* State: Ready -> Completed (Verification Options) */}
          {order.status === 'Ready' && verifyMode === 'none' && (
            <div className="flex gap-3">
              <Button 
                className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-base font-medium flex gap-2"
                onClick={() => setVerifyMode('qr')}
              >
                <QrCode className="w-5 h-5" />
                Scan QR
              </Button>
              <Button 
                variant="outline"
                className="flex-1 h-14 border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-2xl text-base font-medium flex gap-2"
                onClick={() => setVerifyMode('otp')}
              >
                <Keyboard className="w-5 h-5" />
                Enter OTP
              </Button>
            </div>
          )}

          {/* OTP Verification UI */}
          {verifyMode === 'otp' && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-gray-900">Enter Customer OTP</h3>
                <p className="text-sm text-gray-500">Ask the customer for their 4-digit pickup code.</p>
              </div>
              <input 
                type="number" 
                placeholder="0000"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl text-center text-2xl tracking-widest font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl text-gray-600"
                  onClick={() => { setVerifyMode('none'); setError(''); setOtp(''); }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold"
                  disabled={isVerifyingPickup || otp.length !== 4}
                  onClick={handleVerifyOtp}
                >
                  {isVerifyingPickup ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>
          )}

          {/* QR Scanner UI */}
          {verifyMode === 'qr' && (
            <div className="space-y-4 flex flex-col items-center">
              <div className="text-center w-full">
                <h3 className="font-bold text-gray-900">Scan Customer QR Code</h3>
                <p className="text-sm text-gray-500">Point your camera at the customer's phone.</p>
              </div>
              
              <div id="qr-reader-order" className="w-full max-w-[280px] overflow-hidden rounded-2xl border border-gray-200" />
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <Button 
                variant="outline"
                className="w-full h-14 rounded-2xl text-gray-600"
                onClick={() => { setVerifyMode('none'); setError(''); }}
              >
                Cancel Scanner
              </Button>
            </div>
          )}

        </div>
      )}
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
