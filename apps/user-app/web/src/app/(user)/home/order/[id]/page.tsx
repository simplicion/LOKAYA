'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Clock, MapPin, ShoppingBag, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderStatusPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<'preparing' | 'ready' | 'completed'>('preparing');

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Dev Simulation Controls */}
      <div className="fixed top-16 right-2 bg-white border border-gray-200 p-2 rounded-xl shadow-lg z-50 text-[10px] flex flex-col gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
        <p className="font-bold text-gray-700 mb-0.5 text-center">Simulation</p>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" name="status" checked={status === 'preparing'} onChange={() => setStatus('preparing')} className="w-3 h-3 text-indigo-600" />
          <span className="font-medium">Preparing</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" name="status" checked={status === 'ready'} onChange={() => setStatus('ready')} className="w-3 h-3 text-indigo-600" />
          <span className="font-medium">Ready</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" name="status" checked={status === 'completed'} onChange={() => setStatus('completed')} className="w-3 h-3 text-indigo-600" />
          <span className="font-medium">Completed</span>
        </label>
      </div>

      {/* Header */}
      <div className="flex items-center justify-center py-4 relative px-4 sticky top-0 bg-white z-40">
        <button onClick={() => router.push('/home')} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900">
          {status === 'preparing' && 'Order Preparing'}
          {status === 'ready' && 'Order Ready for Pickup'}
          {status === 'completed' && 'Order Completed'}
        </h1>
      </div>

      <div className="flex flex-col flex-1 px-4 mt-6">
        
        {/* Illustrations */}
        {status === 'preparing' && (
          <div className="relative w-56 h-56 mx-auto mt-6 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-indigo-50/80 rounded-full scale-[1.3] blur-2xl opacity-70"></div>
            <div className="relative z-10 flex flex-col items-center">
              <ShoppingBag className="w-28 h-28 text-indigo-400" strokeWidth={1.5} fill="#e0e7ff" />
              <div className="absolute -bottom-2 -right-4 bg-white rounded-full p-1.5 shadow-xl shadow-indigo-100/50">
                <Clock className="w-12 h-12 text-indigo-500" strokeWidth={2} />
              </div>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div className="relative w-56 h-56 mx-auto mt-6 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-indigo-50/80 rounded-full scale-[1.3] blur-2xl opacity-70"></div>
            <div className="relative z-10 flex flex-col items-center">
              <ShoppingBag className="w-28 h-28 text-indigo-400" strokeWidth={1.5} fill="#e0e7ff" />
              <div className="absolute -bottom-2 -right-4 bg-emerald-400 rounded-full p-2.5 shadow-xl shadow-emerald-200/50 border-4 border-white">
                <Check className="w-8 h-8 text-white" strokeWidth={4} />
              </div>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="relative w-56 h-56 mx-auto mt-6 mb-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-50/80 rounded-full scale-[1.3] blur-2xl opacity-70"></div>
            <div className="relative z-10 flex flex-col items-center mt-4">
              <div className="w-28 h-28 bg-emerald-400 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200/50 z-20 border-[6px] border-white">
                <Check className="w-12 h-12 text-white" strokeWidth={4} />
              </div>
              <div className="absolute -bottom-6 right-0 bg-white p-2.5 rounded-2xl shadow-xl shadow-gray-200/50 z-10">
                <ShoppingBag className="w-12 h-12 text-amber-700" fill="#fcd34d" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        )}

        {/* Text Content */}
        <div className="text-center mb-12 mt-4">
          <h2 className="text-[22px] font-black text-gray-900 tracking-tight mb-2">
            {status === 'preparing' && 'Your order is being prepared'}
            {status === 'ready' && 'Your order is ready!'}
            {status === 'completed' && 'Order Completed!'}
          </h2>
          <p className="text-gray-500 text-[15px] font-medium px-4">
            {status === 'preparing' && 'Store is getting your items ready'}
            {status === 'ready' && 'Head to the store and show your QR code'}
            {status === 'completed' && 'Thank you for shopping with us'}
          </p>
        </div>

        {/* Progress Bar (Only for preparing) */}
        {status === 'preparing' && (
          <div className="flex items-center justify-between w-full max-w-[290px] mx-auto mb-16 relative mt-4">
            {/* Connecting Line Background */}
            <div className="absolute top-4 left-6 right-6 h-[2px] bg-gray-100 -z-10"></div>
            {/* Active Line */}
            <div className="absolute top-4 left-6 w-1/2 h-[2px] bg-emerald-400 -z-10 transition-all duration-500"></div>
            
            {/* Step 1: Confirmed */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-100">
                <Check className="w-4 h-4" strokeWidth={3} />
              </div>
              <span className="text-[11px] text-gray-400 font-semibold">Confirmed</span>
            </div>

            {/* Step 2: Preparing */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-50">
                <Store className="w-4 h-4" />
              </div>
              <span className="text-[11px] text-indigo-600 font-bold">Preparing</span>
            </div>

            {/* Step 3: Ready */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-[11px] text-gray-400 font-semibold">Ready</span>
            </div>
          </div>
        )}

        <div className="flex-1"></div>

        {/* Footers / Actions */}
        <div className="w-full pb-8 pt-4">
          {status === 'preparing' && (
            <p className="text-center text-gray-500 text-[14px] font-medium pb-2">
              We will notify you when it's ready
            </p>
          )}

          {status === 'ready' && (
            <Button 
              onClick={() => router.push(`/home/order/${params.id}/qr`)}
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[16px] shadow-[0_8px_30px_rgb(79,70,229,0.25)] transition-all active:scale-[0.98]"
            >
              View QR Code
            </Button>
          )}

          {status === 'completed' && (
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => router.push(`/home/order/${params.id}/review`)}
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[16px] shadow-[0_8px_30px_rgb(79,70,229,0.25)] transition-all active:scale-[0.98]"
              >
                Review Your Order
              </Button>
              <Button 
                onClick={() => router.push(`/home`)}
                variant="outline"
                className="w-full h-14 rounded-2xl border-2 border-gray-100 text-gray-700 font-bold text-[16px] hover:bg-gray-50 bg-white transition-all active:scale-[0.98]"
              >
                Continue Shopping
              </Button>
              <Button 
                onClick={() => window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                variant="outline"
                className="w-full h-14 rounded-2xl border-2 border-gray-100 text-indigo-600 font-bold text-[16px] hover:bg-gray-50 bg-white transition-all active:scale-[0.98]"
              >
                View Invoice
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
