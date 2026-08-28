'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2 } from 'lucide-react';

export default function ProcessingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');

  useEffect(() => {
    // Simulate payment gateway delay
    const timer = setTimeout(() => {
      setStatus('success'); // Change to failed to test error state
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        router.push('/checkout/success');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center max-w-md mx-auto relative px-4">
      <div className="flex flex-col items-center text-center space-y-6">
        {status === 'processing' && (
          <>
            <div className="relative">
              <Loader2 className="w-20 h-20 text-[#FF6B00] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-[#FF6B00]/10 rounded-full" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Processing Payment</h2>
              <p className="text-gray-500 mt-2 font-medium">Please do not close this window or press back</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
              <p className="text-gray-500 mt-2 font-medium">Redirecting to your order details...</p>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Failed</h2>
              <p className="text-gray-500 mt-2 font-medium">Something went wrong with your transaction.</p>
              <button 
                onClick={() => router.push('/checkout/payment')}
                className="mt-6 w-full py-3 bg-[#FF6B00] text-white rounded-xl font-bold"
              >
                Retry Payment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
