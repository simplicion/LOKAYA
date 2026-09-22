'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PackageCheck, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5A36] mb-4 shadow-sm">
        <PackageCheck className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-black text-[#171717]">Unable to load product</h2>
      <p className="text-xs text-gray-500 max-w-xs mt-1.5 leading-relaxed">
        We encountered an issue loading this item. It may have been temporarily moved or there was a network glitch.
      </p>
      <div className="mt-6 flex gap-3">
        <Button 
          variant="outline"
          onClick={() => reset()}
          className="rounded-full px-5 font-bold flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Try Again
        </Button>
        <Button 
          onClick={() => router.push('/home')}
          className="bg-[#FF5A36] hover:bg-[#E04B28] text-white rounded-full px-5 font-bold shadow-sm"
        >
          Explore Feed
        </Button>
      </div>
    </div>
  );
}
