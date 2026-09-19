'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SingleReelRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    if (resolvedParams.id) {
      router.replace(`/home/reels?id=${resolvedParams.id}`);
    } else {
      router.replace('/home/reels');
    }
  }, [resolvedParams.id, router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      <span className="text-xs font-semibold text-gray-400">Opening Reel...</span>
    </div>
  );
}
