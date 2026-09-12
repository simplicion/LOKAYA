'use client';

import React, { Suspense, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SocialReel, SocialReelProps } from '@/components/feed/SocialReel';
import { ChevronLeft, PlaySquare, PlusCircle } from 'lucide-react';
import { useGetReelsQuery } from '@/lib/api';
import Link from 'next/link';

function ReelsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams?.get('id');
  const targetVideoUrl = searchParams?.get('videoUrl');
  const targetPosterUrl = searchParams?.get('posterUrl');
  const targetStoreName = searchParams?.get('storeName');
  const targetCaption = searchParams?.get('caption');

  const { data: serverReels = [], isLoading } = useGetReelsQuery();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 1. Synthesize immediate target reel if clicked from Feed or Profile (0ms instant playback)
  const initialTargetReel: SocialReelProps | null = useMemo(() => {
    if (!targetVideoUrl && !targetId) return null;
    return {
      id: targetId || 'target-reel',
      storeName: targetStoreName || 'Creator',
      storeAvatar: '',
      isVerified: true,
      timeAgo: 'Recently',
      videoUrl: targetVideoUrl || '',
      posterUrl: targetPosterUrl || '',
      status: 'READY',
      isOptimizing: false,
      likes: '0',
      likesCount: 0,
      isLikedByMe: false,
      comments: '0',
      shares: '0',
      caption: targetCaption || '',
      hashtags: [],
      duration: '0:15',
      currentTime: '0:00',
      progressPercent: 0,
    };
  }, [targetId, targetVideoUrl, targetPosterUrl, targetStoreName, targetCaption]);

  // 2. Map server reels into standardized props
  const reelsToRender: SocialReelProps[] = useMemo(() => {
    const formattedServerReels: SocialReelProps[] = (serverReels && serverReels.length > 0)
      ? serverReels.map((r: any) => ({
          id: r.id,
          authorId: r.authorId,
          storeId: r.storeId,
          storeName: r.storeName,
          storeAvatar: r.storeAvatar,
          isVerified: r.isVerified,
          timeAgo: 'Recently',
          videoUrl: r.videoUrl || r.media?.[0]?.url || '',
          posterUrl: r.posterUrl || r.media?.[0]?.posterUrl || '',
          status: r.status || r.media?.[0]?.status || 'READY',
          isOptimizing: r.isOptimizing !== undefined ? r.isOptimizing : (r.status !== 'READY'),
          likes: r.likes || '0',
          likesCount: r.likesCount || 0,
          isLikedByMe: r.isLikedByMe,
          comments: r.comments || '0',
          shares: r.shares || '0',
          caption: r.caption || '',
          hashtags: r.hashtags || [],
          product: r.product,
          duration: r.duration || '0:15',
          currentTime: r.currentTime || '0:00',
          progressPercent: r.progressPercent || 0,
        }))
      : [];

    // If server hasn't returned yet, render the instant target reel immediately
    if (formattedServerReels.length === 0) {
      return initialTargetReel ? [initialTargetReel] : [];
    }

    // If targetId is specified, place that reel at index 0 for instant playback
    if (targetId) {
      const foundIdx = formattedServerReels.findIndex(r => r.id === targetId);
      if (foundIdx >= 0) {
        const targetItem = formattedServerReels[foundIdx];
        const rest = formattedServerReels.filter((_, idx) => idx !== foundIdx);
        return [targetItem, ...rest];
      } else if (initialTargetReel) {
        return [initialTargetReel, ...formattedServerReels];
      }
    }

    return formattedServerReels;
  }, [serverReels, initialTargetReel, targetId]);

  // Track active visible reel on scroll (3-Reel Sliding Window Engine)
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const itemHeight = containerRef.current.clientHeight || window.innerHeight;
    const currentIndex = Math.round(scrollTop / itemHeight);
    if (currentIndex !== activeIndex && currentIndex >= 0 && currentIndex < reelsToRender.length) {
      setActiveIndex(currentIndex);
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="w-full h-[100dvh] bg-black overflow-y-scroll snap-y snap-mandatory no-scrollbar relative"
    >
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="fixed top-safe left-4 mt-4 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-md z-50 text-white border border-white/10 shadow-lg hover:bg-black/60 active:scale-95 transition-all"
        aria-label="Back"
      >
        <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* Instant Skeleton Shell when cache is cold and no initial reel is known */}
      {isLoading && reelsToRender.length === 0 && (
        <div className="w-full h-[100dvh] bg-black flex flex-col justify-between p-4 relative overflow-hidden animate-pulse">
          <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-neutral-900 via-black to-neutral-950" />
          
          {/* Top spacer */}
          <div className="h-12" />

          {/* Bottom & Side Skeleton Controls (matching Instagram Reels) */}
          <div className="relative z-10 flex items-end justify-between pb-8">
            {/* Bottom-left username & caption skeleton */}
            <div className="flex flex-col gap-2.5 max-w-[70%]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20" />
                <div className="w-24 h-3.5 rounded bg-white/20" />
              </div>
              <div className="w-48 h-3 rounded bg-white/10" />
              <div className="w-32 h-3 rounded bg-white/10" />
            </div>

            {/* Right side actions skeleton */}
            <div className="flex flex-col items-center gap-5">
              <div className="w-10 h-10 rounded-full bg-white/20" />
              <div className="w-10 h-10 rounded-full bg-white/20" />
              <div className="w-10 h-10 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && reelsToRender.length === 0 && (
        <div className="w-full h-full flex flex-col items-center justify-center text-white px-6 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-[#FF5A36] border border-white/10">
            <PlaySquare className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold">No Reels Yet</h2>
          <p className="text-xs text-white/70 max-w-xs leading-relaxed">
            Short-form video reels from your favorite creators and stores will appear here.
          </p>
          <Link 
            href="/profile/create/post" 
            className="mt-2 inline-flex items-center gap-2 bg-[#FF5A36] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-lg hover:bg-[#E04B28] active:scale-95 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Upload First Reel
          </Link>
        </div>
      )}

      {/* 3-Reel Sliding Window Reels List (Zero blocking delay) */}
      {reelsToRender.map((reel, index) => {
        // Sliding window: only mount DOM players for active - 1, active, active + 1
        const isWithinWindow = Math.abs(index - activeIndex) <= 1;
        const isActive = index === activeIndex;

        return (
          <div key={reel.id} className="w-full h-[100dvh] snap-start relative">
            {isWithinWindow ? (
              <SocialReel {...reel} isActive={isActive} />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                {reel.posterUrl && (
                  <img 
                    src={reel.posterUrl} 
                    alt="" 
                    className="w-full h-full object-cover opacity-60 pointer-events-none" 
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ReelsPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-[100dvh] bg-black" />
    }>
      <ReelsContent />
    </Suspense>
  );
}
