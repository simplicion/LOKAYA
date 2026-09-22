'use client';

import React, { Suspense, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SocialReel, SocialReelProps } from '@/components/feed/SocialReel';
import { ChevronLeft, PlaySquare, PlusCircle, ChevronDown, Users, MapPin, Check, Compass } from 'lucide-react';
import { useGetReelsQuery, useGetMyStoreQuery } from '@/lib/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { cn, formatTimeAgo, getMediaUrl } from '@/lib/utils';
import Link from 'next/link';

type FeedTab = 'for-you' | 'following' | 'nearby';

function ReelsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams?.get('id');
  const targetVideoUrl = searchParams?.get('videoUrl');
  const targetPosterUrl = searchParams?.get('posterUrl');
  const targetStoreName = searchParams?.get('storeName');
  const targetCaption = searchParams?.get('caption');

  const user = useSelector((state: RootState) => state.auth.user);
  const { data: myStore } = useGetMyStoreQuery(undefined, { skip: !user });
  const { data: serverReels = [], isLoading } = useGetReelsQuery();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Feed tabs state: For You, Following, Nearby
  const [feedTab, setFeedTab] = useState<FeedTab>('for-you');
  const [followingSubTab, setFollowingSubTab] = useState<'following' | 'nearby'>('following');
  const [isFollowingDropdownOpen, setIsFollowingDropdownOpen] = useState(false);

  // Track locally followed creators for instantaneous updates across feeds
  const [followedAuthorIds, setFollowedAuthorIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lokaya_followed_authors');
        return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  const handleToggleFollowAuthor = (authorId: string, isNowFollowing: boolean) => {
    setFollowedAuthorIds(prev => {
      const next = new Set(prev);
      if (isNowFollowing) next.add(authorId);
      else next.delete(authorId);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('lokaya_followed_authors', JSON.stringify(Array.from(next)));
        } catch {}
      }
      return next;
    });
  };

  // 1. Synthesize immediate target reel if clicked from Feed or Profile (0ms instant playback)
  const initialTargetReel: SocialReelProps | null = useMemo(() => {
    if (!targetVideoUrl && !targetId) return null;
    return {
      id: targetId || 'target-reel',
      storeName: targetStoreName || 'Creator',
      storeAvatar: '',
      isVerified: false,
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

  // 2. Map server reels into standardized props and apply feed filters
  const reelsToRender: SocialReelProps[] = useMemo(() => {
    const formattedServerReels: SocialReelProps[] = (serverReels && serverReels.length > 0)
      ? serverReels.map((r: any) => ({
          id: r.id,
          authorId: r.authorId,
          storeId: r.storeId,
          storeName: r.storeName,
          storeAvatar: r.storeAvatar,
          isVerified: r.isVerified,
          createdAt: r.createdAt,
          timeAgo: formatTimeAgo(r.createdAt),
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
          isFollowing: Boolean(r.authorId && followedAuthorIds.has(r.authorId)),
          onToggleFollow: handleToggleFollowAuthor,
          feedType: feedTab,
        }))
      : [];

    // If server hasn't returned yet, render the instant target reel immediately
    if (formattedServerReels.length === 0) {
      return initialTargetReel ? [{
        ...initialTargetReel,
        isFollowing: Boolean(initialTargetReel.authorId && followedAuthorIds.has(initialTargetReel.authorId)),
        onToggleFollow: handleToggleFollowAuthor,
        feedType: feedTab,
      }] : [];
    }

    // Apply feed filter (For You / Following / Nearby)
    let filteredList = formattedServerReels;
    if (feedTab === 'following') {
      filteredList = formattedServerReels.filter(r => 
        (r.authorId && followedAuthorIds.has(r.authorId)) || r.isFollowing
      );
    } else if (feedTab === 'nearby') {
      // Prioritize local verified stores and creator posts
      const nearbyReels = formattedServerReels.filter(r => Boolean(r.storeId || r.isVerified));
      filteredList = nearbyReels.length > 0 ? nearbyReels : formattedServerReels;
    }

    // If targetId is specified, place that reel at index 0 for instant playback
    if (targetId) {
      const foundIdx = filteredList.findIndex(r => r.id === targetId);
      if (foundIdx >= 0) {
        const targetItem = filteredList[foundIdx];
        const rest = filteredList.filter((_, idx) => idx !== foundIdx);
        return [targetItem, ...rest];
      } else if (initialTargetReel) {
        return [{
          ...initialTargetReel,
          isFollowing: Boolean(initialTargetReel.authorId && followedAuthorIds.has(initialTargetReel.authorId)),
          onToggleFollow: handleToggleFollowAuthor,
          feedType: feedTab,
        }, ...filteredList];
      }
    }

    return filteredList;
  }, [serverReels, initialTargetReel, targetId, feedTab, followedAuthorIds]);

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

  const switchTab = (tab: FeedTab) => {
    setFeedTab(tab);
    if (tab === 'following' || tab === 'nearby') {
      setFollowingSubTab(tab);
    }
    setIsFollowingDropdownOpen(false);
    setActiveIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="w-full h-[100dvh] bg-black overflow-y-scroll snap-y snap-mandatory no-scrollbar relative"
    >
      {/* Top Header: Back Button, For You / Following (with Nearby Dropdown), Right Spacer */}
      <div className="fixed top-safe left-0 right-0 z-50 px-4 pt-3 flex items-center justify-between pointer-events-none">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="pointer-events-auto w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-md text-white border border-white/10 shadow-lg hover:bg-black/60 active:scale-95 transition-all"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {/* Center Tabs: For You & Following (with Nearby Dropdown) */}
        <div className="pointer-events-auto relative flex items-center gap-5">
          {/* For You Tab */}
          <button
            onClick={() => switchTab('for-you')}
            className="flex flex-col items-center py-1 transition-all group"
          >
            <span className={cn(
              "text-[15px] font-bold tracking-wide drop-shadow-md transition-colors",
              feedTab === 'for-you' ? "text-white" : "text-white/60 group-hover:text-white/80"
            )}>
              For You
            </span>
            <span className={cn(
              "h-[2.5px] rounded-full transition-all duration-200 mt-0.5",
              feedTab === 'for-you' ? "w-5 bg-[#FF5A36] shadow-[0_0_8px_rgba(255,90,54,0.8)]" : "w-0 bg-transparent"
            )} />
          </button>

          {/* Following Tab with Dropdown for Following & Nearby */}
          <div className="relative">
            <button
              onClick={() => {
                if (feedTab === 'for-you') {
                  switchTab(followingSubTab);
                } else {
                  setIsFollowingDropdownOpen(!isFollowingDropdownOpen);
                }
              }}
              className="flex flex-col items-center py-1 transition-all group"
            >
              <div className="flex items-center gap-1">
                <span className={cn(
                  "text-[15px] font-bold tracking-wide drop-shadow-md transition-colors capitalize",
                  feedTab !== 'for-you' ? "text-white" : "text-white/60 group-hover:text-white/80"
                )}>
                  {followingSubTab === 'nearby' && feedTab === 'nearby' ? 'Nearby' : 'Following'}
                </span>
                <ChevronDown 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFollowingDropdownOpen(!isFollowingDropdownOpen);
                  }}
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isFollowingDropdownOpen ? "rotate-180" : "",
                    feedTab !== 'for-you' ? "text-white" : "text-white/60 group-hover:text-white/80"
                  )} 
                />
              </div>
              <span className={cn(
                "h-[2.5px] rounded-full transition-all duration-200 mt-0.5",
                feedTab !== 'for-you' ? "w-5 bg-[#FF5A36] shadow-[0_0_8px_rgba(255,90,54,0.8)]" : "w-0 bg-transparent"
              )} />
            </button>

            {/* Dropdown Menu for Following & Nearby */}
            {isFollowingDropdownOpen && (
              <>
                {/* Click-away backdrop */}
                <div 
                  className="fixed inset-0 z-40 pointer-events-auto" 
                  onClick={() => setIsFollowingDropdownOpen(false)} 
                />
                
                {/* Floating Dropdown Card */}
                <div className="absolute top-full right-0 mt-2 bg-black/85 backdrop-blur-xl border border-white/20 rounded-2xl p-1.5 shadow-2xl min-w-[155px] flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto">
                  <button
                    onClick={() => switchTab('following')}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left",
                      feedTab === 'following' 
                        ? "bg-white/20 text-white font-bold" 
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-white/90" />
                      <span>Following</span>
                    </div>
                    {feedTab === 'following' && <Check className="w-3.5 h-3.5 text-[#FF5A36] stroke-[2.5]" />}
                  </button>

                  <button
                    onClick={() => switchTab('nearby')}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left",
                      feedTab === 'nearby' 
                        ? "bg-white/20 text-white font-bold" 
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#FF5A36]" />
                      <span>Nearby</span>
                    </div>
                    {feedTab === 'nearby' && <Check className="w-3.5 h-3.5 text-[#FF5A36] stroke-[2.5]" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side spacer to keep center tabs perfectly centered (allows clicks to pass through to reel's audio button) */}
        <div className="w-10 h-10 pointer-events-none" />
      </div>

      {/* Instant Skeleton Shell when cache is cold and no initial reel is known */}
      {isLoading && reelsToRender.length === 0 && (
        <div className="w-full h-[100dvh] bg-black flex flex-col justify-between p-4 relative overflow-hidden animate-pulse">
          <div className="w-full h-full absolute inset-0 bg-gradient-to-b from-neutral-900 via-black to-neutral-950" />
          
          {/* Top spacer */}
          <div className="h-14" />

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
              <div className="w-56 h-12 rounded-xl bg-white/10 mt-1" />
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

      {/* Empty State: Following Tab */}
      {!isLoading && reelsToRender.length === 0 && feedTab === 'following' && (
        <div className="w-full h-full flex flex-col items-center justify-center text-white px-6 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-[#FF5A36] border border-white/10">
            <Users className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold">No Following Reels Yet</h2>
          <p className="text-xs text-white/70 max-w-xs leading-relaxed">
            Follow creators and stores you love to see their latest reels appear here.
          </p>
          <button 
            onClick={() => switchTab('for-you')}
            className="mt-2 inline-flex items-center gap-2 bg-[#FF5A36] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-lg hover:bg-[#E04B28] active:scale-95 transition"
          >
            Explore For You
          </button>
        </div>
      )}

      {/* Empty State: Nearby Tab */}
      {!isLoading && reelsToRender.length === 0 && feedTab === 'nearby' && (
        <div className="w-full h-full flex flex-col items-center justify-center text-white px-6 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-[#FF5A36] border border-white/10">
            <MapPin className="w-10 h-10 text-[#FF5A36]" />
          </div>
          <h2 className="text-xl font-bold">No Nearby Reels Found</h2>
          <p className="text-xs text-white/70 max-w-xs leading-relaxed">
            Discover trending reels and products from verified local sellers around your neighborhood.
          </p>
          <button 
            onClick={() => switchTab('for-you')}
            className="mt-2 inline-flex items-center gap-2 bg-[#FF5A36] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-lg hover:bg-[#E04B28] active:scale-95 transition"
          >
            Explore For You
          </button>
        </div>
      )}

      {/* Empty State: For You Tab */}
      {!isLoading && reelsToRender.length === 0 && feedTab === 'for-you' && (
        <div className="w-full h-full flex flex-col items-center justify-center text-white px-6 text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-[#FF5A36] border border-white/10">
            <PlaySquare className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold">No Reels Yet</h2>
          <p className="text-xs text-white/70 max-w-xs leading-relaxed">
            {myStore
              ? 'Be the first seller to showcase your products with short video reels!'
              : 'Short-form video reels from your favorite creators and stores will appear here.'}
          </p>
          {myStore ? (
            <Link 
              href="/profile/create/post" 
              className="mt-2 inline-flex items-center gap-2 bg-[#FF5A36] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-lg hover:bg-[#E04B28] active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Upload First Reel
            </Link>
          ) : (
            <Link 
              href="/explore" 
              className="mt-2 inline-flex items-center gap-2 bg-[#FF5A36] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-lg hover:bg-[#E04B28] active:scale-95 transition"
            >
              <Compass className="w-4 h-4" />
              Explore Stores
            </Link>
          )}
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
              <SocialReel {...reel} isActive={isActive} isPreloadCandidate={!isActive} />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                {reel.posterUrl && (
                  <img 
                    src={getMediaUrl(reel.posterUrl)} 
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
