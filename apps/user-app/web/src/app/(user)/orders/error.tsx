'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Truck, RotateCcw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OrdersModuleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Orders/Tracking page error:', error);
  }, [error]);

  return (
    <div className="min-h-[85vh] bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5A36] mb-4 shadow-xs">
        <Truck className="w-8 h-8 stroke-[1.8]" />
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-1.5">Order Telemetry Error</h2>
      <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-6">
        We could not retrieve telemetry or tracking details for this order. Please try reloading.
      </p>
      <div className="flex gap-3 w-full max-w-xs">
        <Button
          variant="outline"
          onClick={() => reset()}
          className="flex-1 rounded-full font-bold h-11 border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </Button>
        <Button
          onClick={() => router.push('/orders')}
          className="flex-1 rounded-full font-bold h-11 bg-[#FF5A36] hover:bg-[#E04B28] text-white shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          My Orders
        </Button>
      </div>
    </div>
  );
}
