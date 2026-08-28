'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, QrCode, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOCK_ORDERS } from '../page';
import { Html5QrcodeScanner } from 'html5-qrcode';

function OrderDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const initialOrder = MOCK_ORDERS.find(o => o.id === id) || MOCK_ORDERS[0];
  const [order, setOrder] = useState(initialOrder);

  // 'none' | 'otp' | 'qr'
  const [verifyMode, setVerifyMode] = useState<'none' | 'otp' | 'qr'>('none');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const found = MOCK_ORDERS.find(o => o.id === id);
      if (found) setOrder(found);
    }
  }, [id]);

  // Handle QR Scanner
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (verifyMode === 'qr' && order.status === 'Ready') {
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
          (decodedText) => {
            // Success: Simulate valid QR (e.g. if we had a real backend, we'd verify decodedText)
            setOrder({...order, status: 'Completed'});
            setVerifyMode('none');
            if (scanner) {
              scanner.clear().catch(console.error);
            }
          }, 
          (error) => {
            // ignore scan errors (it scans continuously)
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
  }, [verifyMode, order]);

  const handleVerifyOtp = () => {
    if (otp.length === 4) { // Mock valid OTP
      setOrder({...order, status: 'Completed'});
      setVerifyMode('none');
      setError('');
    } else {
      setError('Invalid OTP. Use any 4-digit code (e.g., 1234).');
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
        return null;
    }
  };

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
          <span className="font-bold text-gray-900 text-lg">#{order.id}</span>
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
            {order.items.map((item, idx) => (
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
              onClick={() => setOrder({...order, status: 'Preparing'})}
            >
              Start Preparing Order
            </Button>
          )}
          
          {/* State: Preparing -> Ready */}
          {order.status === 'Preparing' && (
            <Button 
              className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-lg font-medium"
              onClick={() => setOrder({...order, status: 'Ready'})}
            >
              Mark as Ready & Notify Customer
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
                  className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl"
                  onClick={handleVerifyOtp}
                >
                  Verify
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
              
              <div id="qr-reader-order" className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100 bg-black"></div>

              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl text-gray-600"
                  onClick={() => setVerifyMode('none')}
                >
                  Cancel Scan
                </Button>
                <Button 
                  className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl"
                  onClick={() => {
                    // Simulate scan success manually just in case camera is broken
                    setOrder({...order, status: 'Completed'});
                    setVerifyMode('none');
                  }}
                >
                  Simulate Success
                </Button>
              </div>
            </div>
          )}

        </div>
      )}
      
      {order.status === 'Completed' && (
        <div className="bg-white p-4 border-t border-gray-100 fixed bottom-0 left-0 w-full z-20 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          <Button 
            variant="outline"
            className="w-full h-14 border-green-200 text-green-700 bg-green-50 rounded-2xl text-base font-medium"
            disabled
          >
            Order Successfully Handed Over
          </Button>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <OrderDetailsContent />
    </Suspense>
  );
}
