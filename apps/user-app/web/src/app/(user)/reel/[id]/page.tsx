'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SingleReelRedirectPage({ params }: { params?: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const routeId = routeParams?.id as string | undefined;
  const pathId = typeof window !== 'undefined' 
    ? window.location.pathname.split('/reel/')[1]?.split('/')[0]?.split('?')[0] 
    : undefined;

  const reelId = (routeId && routeId !== '1') 
    ? routeId 
    : (pathId && pathId !== '1') 
      ? pathId 
      : (routeId || pathId || '');

  useEffect(() => {
    if (reelId) {
      router.replace(`/home/reels?id=${reelId}`);
    } else {
      router.replace('/home/reels');
    }
  }, [reelId, router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      <span className="text-xs font-semibold text-gray-400">Opening Reel...</span>
    </div>
  );
}
