'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, QrCode, Keyboard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetOrderQuery, useUpdateOrderStatusMutation, useVerifyOrderPickupMutation } from '@/lib/api';
import { Html5QrcodeScanner } from 'html5-qrcode';

function OrderDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';

  const { data: order, isLoading, refetch } = useGetOrderQuery(id, { skip: !id });
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();
  const [verifyPickup, { isLoading: isVerifyingPickup }] = useVerifyOrderPickupMutation();

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

  const handleTransitionStatus = async (newStatus: string) => {
    try {
      await updateStatus({ orderId: id, status: newStatus }).unwrap();
      refetch();
    } catch (err: any) {
      console.error('Failed to update order status:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg">New</span>;
      case 'Preparing':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg">Preparing</span>;
      case 'Ready':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">Ready for Pickup</span>;
      case 'Completed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">Completed</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg">{status}</span>;
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

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 pb-36">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Order Details
        </h1>
      </div>

      <div className="p-4 space-y-4 flex-1">
        
        {/* Order ID & Status */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <span className="font-bold text-gray-900 text-lg">#{order.id.slice(0, 8).toUpperCase()}</span>
          {getStatusBadge(order.status)}
        </div>

        {/* Customer Details */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Customer</h3>
          <p className="font-bold text-gray-900 text-base">{order.customerName}</p>
          <p className="text-gray-600 text-sm mt-1">{order.phone}</p>
          {order.status === 'Ready' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 font-medium">
              Customer has been notified that the order is ready for pickup!
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Items</h3>
          <div className="space-y-4">
            {(order.items || []).map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start text-sm">
                <div className="flex-1 pr-4">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                </div>
                <div className="flex items-center gap-6 text-gray-900 font-medium whitespace-nowrap">
                  <span>x {item.qty}</span>
                  <span className="w-12 text-right">₹ {item.price}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="font-bold text-gray-900 text-base">Total</span>
            <span className="font-bold text-gray-900 text-lg">₹ {order.total}</span>
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Payment Method</span>
            <span className="font-medium text-gray-900">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Pickup Time</span>
            <span className="font-medium text-gray-900">{order.pickupTime}</span>
          </div>
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
