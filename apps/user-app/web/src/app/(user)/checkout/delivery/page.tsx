'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DeliveryOptionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/checkout');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Redirecting to Unified Checkout...
      </span>
    </div>
  );
}
