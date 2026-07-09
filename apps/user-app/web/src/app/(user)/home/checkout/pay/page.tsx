'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { clearCart } from '@/lib/features/cartSlice';

export default function PaymentPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [status, setStatus] = useState<'waiting' | 'success'>('waiting');

  useEffect(() => {
    // Simulate payment webhook / success after 3 seconds
    const timer = setTimeout(() => {
      setStatus('success');
      // Clear the cart when payment succeeds
      dispatch(clearCart());
    }, 3000);

    return () => clearTimeout(timer);
  }, [dispatch]);

  const handleViewOrder = () => {
    router.push('/home/order/ORD12345');
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col min-h-screen bg-white px-4 items-center justify-center pt-10 pb-6 relative">
        <div className="absolute top-4 left-4">
          <button onClick={() => router.push('/home')} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 shadow-sm">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Check className="w-8 h-8 text-white stroke-[3]" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Payment Successful!</h2>
          <p className="text-gray-600 font-medium text-[15px] mb-12">₹135 Paid to FreshMart</p>
          
          <h3 className="text-[17px] font-bold text-gray-900 mb-2">Order Confirmed</h3>
          <p className="text-gray-500 text-sm font-medium text-center">You will receive a QR code for pickup</p>
        </div>

        <div className="w-full mt-auto">
          <Button 
            onClick={handleViewOrder} 
            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all active:scale-[0.98]"
          >
            View Order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white px-4 pt-4 pb-6 items-center">
      <div className="w-full flex items-center justify-start mb-12">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col items-center flex-1 w-full max-w-sm mx-auto">
        <h2 className="text-3xl font-black text-gray-900 mb-2">Pay ₹135</h2>
        <p className="text-gray-600 font-medium text-[15px] mb-12">To FreshMart</p>
        
        {/* Fake QR Code */}
        <div className="bg-white p-6 border-2 border-dashed border-gray-200 rounded-3xl mb-8 flex items-center justify-center relative overflow-hidden">
           <QrCode className="w-48 h-48 text-gray-800" strokeWidth={1} />
           
           {/* Scanning animation line */}
           <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500/50 shadow-[0_0_10px_rgb(99,102,241)] animate-[scan_2s_ease-in-out_infinite]" />
        </div>
        
        <p className="text-gray-500 text-[15px] font-medium mb-1">Scan QR with any UPI app</p>
        <p className="font-bold text-gray-900 text-[15px]">UPI ID: <span className="text-indigo-600">freshmart@upi</span></p>

        <div className="mt-auto flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            <span className="text-gray-500 text-sm font-medium">Waiting for payment...</span>
          </div>
          <p className="text-gray-400 text-xs font-medium text-center">
            Order will be confirmed after payment.
          </p>
        </div>
      </div>
    </div>
  );
}
