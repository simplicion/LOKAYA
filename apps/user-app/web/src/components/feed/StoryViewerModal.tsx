'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Heart, Eye, ChevronRight, Volume2, VolumeX, ShoppingBag, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useViewStoryMutation, useLikeStoryMutation } from '@/lib/api';
import { cn, getMediaUrl, isVideoMedia } from '@/lib/utils';
import { ShareBottomSheet } from '@/components/ui/ShareBottomSheet';
import { VideoPlayer } from '@/components/media/VideoPlayer';

export interface StoryViewerStory {
  id: string;
  storeId?: string;
  storeName?: string;
  storeAvatar?: string;
  isVerified?: boolean;
  mediaUrl: string;
  mediaType?: 'image' | 'video' | 'IMAGE' | 'VIDEO';
  caption?: string | null;
  product?: {
    id: string;
    name: string;
    image: string;
    price: string;
    originalPrice?: string;
    discount?: string;
  } | null;
  createdAt?: string;
  viewsCount?: number;
  likesCount?: number;
  isLikedByMe?: boolean;
}

export interface StoryViewerStoreGroup {
  storeId: string;
  storeName: string;
  storeAvatar: string;
  isVerified: boolean;
  hasUnseen?: boolean;
  stories: StoryViewerStory[];
}

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Can pass either multiple store groups (from Feed) or a single group (from Profile/Highlight)
  groups?: StoryViewerStoreGroup[];
  initialGroupIndex?: number;
  initialStoryIndex?: number;
  title?: string; // Optional custom header title (e.g. highlight name)
}

const STORY_DURATION_MS = 5000;

export function StoryViewerModal({
  isOpen,
  onClose,
  groups = [],
  initialGroupIndex = 0,
  initialStoryIndex = 0,
  title,
}: StoryViewerModalProps) {
  const [currentGroupIdx, setCurrentGroupIdx] = useState(initialGroupIndex);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const [viewStory] = useViewStoryMutation();
  const [likeStory] = useLikeStoryMutation();

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartY = useRef<number>(0);
  const isLikingRef = useRef<boolean>(false);
  const lastTapRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentGroup = groups[currentGroupIdx] || null;
  const currentStories = currentGroup?.stories || [];
  const currentStory = currentStories[currentStoryIdx] || null;
  // Next story for zero-latency sliding pre-buffer
  const nextStory = currentStories[currentStoryIdx + 1] || groups[currentGroupIdx + 1]?.stories?.[0] || null;

  // Sync initial indices when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentGroupIdx(Math.min(initialGroupIndex, Math.max(0, groups.length - 1)));
      setCurrentStoryIdx(initialStoryIndex);
      setProgress(0);
      setIsPaused(false);
      setIsShareOpen(false);
    }
  }, [isOpen, initialGroupIndex, initialStoryIndex, groups.length]);

  // Sync like and view states when current story changes
  useEffect(() => {
    if (currentStory) {
      setIsLiked(!!currentStory.isLikedByMe);
      setLikesCount(currentStory.likesCount || 0);
      setViewsCount(currentStory.viewsCount || 0);
      setProgress(0);

      // Record view
      if (currentStory.id) {
        viewStory(currentStory.id).unwrap().then(res => {
          if (res?.viewsCount) {
            setViewsCount(res.viewsCount);
          }
        }).catch(() => {});
      }
    }
  }, [currentStory?.id, currentStory?.isLikedByMe, currentStory?.likesCount, viewStory]);

  const goToNextStory = useCallback(() => {
    if (currentStoryIdx < currentStories.length - 1) {
      setCurrentStoryIdx(prev => prev + 1);
      setProgress(0);
    } else if (currentGroupIdx < groups.length - 1) {
      // Go to next store group
      setCurrentGroupIdx(prev => prev + 1);
      setCurrentStoryIdx(0);
      setProgress(0);
    } else {
      // Reached the end of all stories
      onClose();
    }
  }, [currentStoryIdx, currentStories.length, currentGroupIdx, groups.length, onClose]);

  const goToPrevStory = useCallback(() => {
    if (currentStoryIdx > 0) {
      setCurrentStoryIdx(prev => prev - 1);
      setProgress(0);
    } else if (currentGroupIdx > 0) {
      // Go to previous store group
      const prevGroup = groups[currentGroupIdx - 1];
      setCurrentGroupIdx(prev => prev - 1);
      setCurrentStoryIdx(Math.max(0, (prevGroup?.stories?.length || 1) - 1));
      setProgress(0);
    }
  }, [currentStoryIdx, currentGroupIdx, groups]);

  // Timer loop for advancing stories progress (for image media)
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused || isShareOpen) return;

    const isVideo = currentStory.mediaType?.toLowerCase() === 'video' || isVideoMedia(currentStory?.mediaUrl);
    if (isVideo) {
      // Video driven progression handled via onTimeUpdate callback in VideoPlayer
      return;
    }

    const stepMs = 50;
    const increment = (stepMs / STORY_DURATION_MS) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          return 100;
        }
        return next;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isOpen, currentStory, isPaused, isShareOpen]);

  // Handle auto-advancing to next story outside of render/updater phase
  useEffect(() => {
    if (progress >= 100) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      goToNextStory();
    }
  }, [progress, goToNextStory]);

  // Handle video playback events
  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video && video.duration > 0) {
      const percent = (video.currentTime / video.duration) * 100;
      setProgress(percent);
    }
  };

  const handleVideoEnded = () => {
    goToNextStory();
  };

  // Toggle story like with race-condition guard
  const handleToggleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentStory?.id || isLikingRef.current) return;

    isLikingRef.current = true;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

    if (nextLiked) {
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 750);
    }

    try {
      const res = await likeStory(currentStory.id).unwrap();
      if (typeof res?.liked === 'boolean') {
        setIsLiked(res.liked);
        if (typeof res.likesCount === 'number') {
          setLikesCount(res.likesCount);
        }
      }
    } catch (err) {
      // Rollback on failure
      setIsLiked(!nextLiked);
      setLikesCount(prev => !nextLiked ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      isLikingRef.current = false;
    }
  };

  // Touch handlers for pause on hold
  const handlePointerDown = () => setIsPaused(true);
  const handlePointerUp = () => setIsPaused(false);

  // Swipe down to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 100) {
      onClose();
    }
  };

  // Screen tap zones with double-tap like detection
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isShareOpen) return;
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      // Double tap -> trigger like
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      if (!isLiked) {
        handleToggleLike();
      } else {
        setShowHeartPop(true);
        setTimeout(() => setShowHeartPop(false), 750);
      }
    } else {
      // Single tap -> navigate left or right
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      clickTimeoutRef.current = setTimeout(() => {
        if (x < width * 0.3) {
          goToPrevStory();
        } else {
          goToNextStory();
        }
      }, 250);
    }
    lastTapRef.current = now;
  };

  if (!isOpen || !currentStory) return null;

  const isVideo = currentStory.mediaType?.toLowerCase() === 'video' || isVideoMedia(currentStory?.mediaUrl);
  const storeAvatar = currentGroup?.storeAvatar || currentStory.storeAvatar || '';
  const storeName = title || currentGroup?.storeName || currentStory.storeName || 'Store';
  const isVerified = currentGroup?.isVerified ?? currentStory.isVerified ?? false;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex flex-col select-none overflow-hidden touch-none animate-in fade-in duration-200"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Segmented Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-3 px-3 flex gap-1.5 pointer-events-none">
        {currentStories.map((_, idx) => {
          let fillWidth = 0;
          if (idx < currentStoryIdx) fillWidth = 100;
          else if (idx === currentStoryIdx) fillWidth = progress;

          return (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
                style={{ width: `${fillWidth}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Header Info */}
      <div className="absolute top-6 left-0 right-0 z-30 px-4 py-2 flex items-center justify-between text-white drop-shadow-md">
        <div className="flex items-center gap-2.5">
          <Link 
            href={currentGroup?.storeId ? `/store/${currentGroup.storeId}` : '#'} 
            onClick={(e) => e.stopPropagation()}
            className="w-9 h-9 rounded-full overflow-hidden border border-white/80 p-0.5 bg-white/10 shrink-0 flex items-center justify-center"
          >
            {storeAvatar ? (
              <img src={getMediaUrl(storeAvatar)} alt={storeName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                {storeName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </Link>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-white drop-shadow">{storeName}</span>
              {isVerified && (
                <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-[11px] text-white/80 font-medium">Active Story</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isVideo && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Media Content Area */}
      <div 
        className="relative w-full h-full flex items-center justify-center cursor-pointer"
        onClick={handleScreenClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {isVideo ? (
          <VideoPlayer
            src={currentStory.mediaUrl}
            autoPlay={!isPaused && !isShareOpen}
            isActive={!isPaused && !isShareOpen}
            muted={isMuted}
            loop={false}
            playsInline={true}
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnded}
            className="w-full h-full object-contain"
          />
        ) : (
          <img 
            src={getMediaUrl(currentStory.mediaUrl)} 
            alt="Story" 
            className="w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Big Heart Animation on Like */}
        {showHeartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 animate-ping duration-500">
            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl" />
          </div>
        )}

        {/* Gradient shadow at bottom for text contrast */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
      </div>

      {/* Hidden Zero-Latency Preloader for Next Story */}
      {nextStory && (
        <div className="hidden" aria-hidden="true">
          {nextStory.mediaType?.toLowerCase() === 'video' || isVideoMedia(nextStory?.mediaUrl) ? (
            <VideoPlayer
              src={nextStory.mediaUrl}
              autoPlay={false}
              isActive={false}
              isPreloadCandidate={true}
              muted={true}
              preload="metadata"
              className="w-0 h-0"
            />
          ) : (
            <img src={getMediaUrl(nextStory.mediaUrl)} alt="" className="w-0 h-0" />
          )}
        </div>
      )}

      {/* Bottom Actions & Overlays */}
      <div 
        className="absolute bottom-6 left-4 right-4 z-30 flex flex-col gap-3 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Caption */}
        {currentStory.caption && (
          <p className="text-white text-sm font-medium drop-shadow-md px-1 line-clamp-2">
            {currentStory.caption}
          </p>
        )}

        {/* Tagged Product Overlay Card */}
        {currentStory.product && (
          <Link
            href={`/product/${currentStory.product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-3 shadow-xl active:scale-[0.98] transition-transform w-full max-w-md mx-auto"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              <img 
                src={getMediaUrl(currentStory.product.image)} 
                alt={currentStory.product.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#FF5A36]" />
                <span className="text-[11px] font-bold text-[#FF5A36] uppercase tracking-wider">Tagged Product</span>
              </div>
              <h4 className="text-xs font-bold text-[#171717] truncate mt-0.5">{currentStory.product.name}</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-black text-[#171717]">{currentStory.product.price}</span>
                {currentStory.product.originalPrice && (
                  <span className="text-[10px] text-gray-400 line-through">{currentStory.product.originalPrice}</span>
                )}
                {currentStory.product.discount && (
                  <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1 rounded">{currentStory.product.discount}</span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
          </Link>
        )}

        {/* Story Action Bar (Views, Likes & Share) */}
        <div className="flex items-center justify-between px-2 pt-1">
          {/* Views count */}
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-white/90 text-xs font-medium">
            <Eye className="w-4 h-4 text-white/80" />
            <span>{viewsCount.toLocaleString()} {viewsCount === 1 ? 'view' : 'views'}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsShareOpen(true);
              }}
              className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white active:scale-95 transition-transform hover:bg-black/60"
              title="Share Story"
            >
              <Share2 className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-bold">Share</span>
            </button>

            {/* Like Button */}
            <button 
              onClick={handleToggleLike}
              className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full active:scale-95 transition-transform hover:bg-black/60"
            >
              <Heart 
                className={cn(
                  "w-5 h-5 transition-colors",
                  isLiked ? "text-red-500 fill-red-500" : "text-white"
                )} 
              />
              <span className="text-white text-xs font-bold tabular-nums">
                {likesCount.toLocaleString()}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Bottom Sheet */}
      <ShareBottomSheet 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        url={typeof window !== 'undefined' ? `${window.location.origin}/store/${currentGroup?.storeId || currentStory?.storeId || ''}` : ''}
        title={storeName ? `Story by ${storeName} on Lokaya` : 'Check out this Story on Lokaya'}
      />
    </div>
  );
}
