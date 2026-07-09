'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useSelector((state: RootState) => state.cart);
  
  const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 135; // Fallback to 135 for prototype if empty
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0) || 3;

  const handlePlaceOrder = () => {
    router.push('/home/checkout/pay');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-center py-4 relative px-4 sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900">Checkout</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4 pb-40">
        {/* Store & Items Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 text-[15px] mb-1">FreshMart</h2>
          <div className="flex items-center gap-1.5 text-emerald-600 mb-4">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[13px] font-medium">Pick up in 10 mins</span>
          </div>
          
          <div className="w-full h-[1px] bg-gray-100 mb-4" />
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-[15px] font-medium">Items ({totalItems})</span>
            <span className="font-bold text-indigo-600 text-[15px]">₹{totalAmount}</span>
          </div>
        </div>

        {/* Pickup Time Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-[15px]">Pickup Time</h3>
            <Link href="/home/checkout/time" className="text-indigo-600 text-[13px] font-bold hover:underline">
              Change
            </Link>
          </div>
          <p className="text-gray-600 text-[15px] font-medium">ASAP (10-15 mins)</p>
        </div>

        {/* Payment Method Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-[15px]">Payment Method</h3>
            <button className="text-indigo-600 text-[13px] font-bold hover:underline">
              Change
            </button>
          </div>
          <p className="text-gray-600 text-[15px] font-medium">UPI</p>
        </div>
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe-offset-4 z-40">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600 text-[15px] font-medium">Total Amount</span>
          <span className="font-black text-gray-900 text-[20px]">₹{totalAmount}</span>
        </div>
        
        <Button 
          onClick={handlePlaceOrder} 
          className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all active:scale-[0.98] mb-3"
        >
          Place Order
        </Button>
        <p className="text-center text-gray-500 text-[12px] font-medium">
          You will be able to pick up your order after payment.
        </p>
      </div>
    </div>
  );
}
