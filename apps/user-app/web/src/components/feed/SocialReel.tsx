'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Heart, MessageCircle, Send, Play, Volume2, VolumeX, Check } from 'lucide-react';
import { ProductOverlayCard } from './ProductOverlayCard';
import { CommentsBottomSheet } from '../ui/CommentsBottomSheet';
import { ShareBottomSheet } from '../ui/ShareBottomSheet';
import { useLikeReelMutation, useFollowUserMutation } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface SocialReelProps {
  id: string;
  authorId?: string;
  storeId?: string;
  storeName: string;
  storeAvatar: string;
  isVerified: boolean;
  timeAgo: string;
  videoUrl: string;
  likes: string;
  likesCount?: number;
  isLikedByMe?: boolean;
  comments: string;
  shares: string;
  caption: string;
  hashtags: string[];
  product?: {
    id?: string;
    name: string;
    image: string;
    price: string;
    originalPrice?: string;
    discount?: string;
  };
  duration?: string;
  currentTime?: string;
  progressPercent?: number;
}

export function SocialReel({
  id,
  authorId,
  storeId,
  storeName,
  storeAvatar,
  isVerified,
  timeAgo,
  videoUrl,
  likes,
  likesCount = 0,
  isLikedByMe = false,
  comments,
  shares,
  caption,
  hashtags,
  product,
  duration = '0:15',
  progressPercent = 0
}: SocialReelProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(progressPercent);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);

  // Optimistic like state
  const [isLiked, setIsLiked] = useState(isLikedByMe);
  const [likeTotal, setLikeTotal] = useState(likesCount || parseInt(likes.replace(/,/g, '')) || 0);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);

  const [likeReel] = useLikeReelMutation();
  const [followUser] = useFollowUserMutation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTapRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLikingRef = useRef<boolean>(false);

  const reelUrl = typeof window !== 'undefined' ? `${window.location.origin}/home/reels?id=${id}` : '';

  const isVideo = videoUrl.includes('.mp4') || videoUrl.includes('.webm') || videoUrl.includes('video') || videoUrl.includes('upload');

  // Synchronize with parent state / refetch
  useEffect(() => {
    setIsLiked(isLikedByMe);
  }, [isLikedByMe]);

  useEffect(() => {
    setLikeTotal(likesCount || parseInt(likes.replace(/,/g, '')) || 0);
  }, [likesCount, likes]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowPlayIcon(true);
      setTimeout(() => setShowPlayIcon(false), 800);
    }
  };

  const handleScreenTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 750);

      if (!isLiked && !isLikingRef.current) {
        isLikingRef.current = true;
        setIsLiked(true);
        setLikeTotal(prev => prev + 1);
        likeReel(id).unwrap().then(res => {
          if (typeof res?.liked === 'boolean') {
            setIsLiked(res.liked);
            if (res.likesCount !== undefined) setLikeTotal(res.likesCount);
          }
        }).catch(() => {
          setIsLiked(false);
          setLikeTotal(prev => Math.max(0, prev - 1));
        }).finally(() => {
          isLikingRef.current = false;
        });
      }
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        togglePlayPause();
      }, 250);
    }
    lastTapRef.current = now;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration > 0) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLikingRef.current) return;
    isLikingRef.current = true;

    const next = !isLiked;
    setIsLiked(next);
    setLikeTotal(prev => next ? prev + 1 : Math.max(0, prev - 1));
    if (next) {
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 750);
    }

    try {
      const res = await likeReel(id).unwrap();
      if (typeof res?.liked === 'boolean') {
        setIsLiked(res.liked);
        if (res.likesCount !== undefined) setLikeTotal(res.likesCount);
      }
    } catch {
      setIsLiked(!next);
      setLikeTotal(prev => !next ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      isLikingRef.current = false;
    }
  };

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authorId) {
      setIsFollowing(!isFollowing);
      return;
    }

    const next = !isFollowing;
    setIsFollowing(next);
    toast.success(next ? `Now following ${storeName}` : `Unfollowed ${storeName}`);

    try {
      await followUser(authorId).unwrap();
    } catch {
      setIsFollowing(!next);
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden snap-start shrink-0">
      {/* Background Media */}
      <div 
        className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center"
        onClick={handleScreenTap}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={videoUrl}
            alt="Reel Content"
            className="w-full h-full object-cover"
          />
        )}

        {/* Big Heart Animation on Double Tap */}
        {showHeartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping duration-500">
            <Heart className="w-28 h-28 text-red-500 fill-red-500 drop-shadow-2xl opacity-95" />
          </div>
        )}

        {/* Play Icon overlay on pause */}
        {showPlayIcon && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
              <Play className="w-8 h-8 fill-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Gradient Overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

      {/* Top Controls: Sound toggle */}
      <div className="absolute top-safe right-4 mt-4 z-30">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Right Sidebar: Social Actions */}
      <div className="absolute bottom-24 right-4 flex flex-col items-center gap-5 z-30 pointer-events-auto">
        {/* Like Button */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={handleToggleLike}
            className="text-white drop-shadow-md transition-transform active:scale-125"
          >
            <Heart 
              className={cn(
                "w-8 h-8 transition-colors",
                isLiked ? "text-red-500 fill-red-500" : "text-white"
              )} 
            />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-md tabular-nums">
            {likeTotal.toLocaleString()}
          </span>
        </div>

        {/* Comment Button */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => setIsCommentsOpen(true)}
            className="text-white drop-shadow-md transition-transform active:scale-95"
          >
            <MessageCircle className="w-[28px] h-[28px]" />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-md">{comments}</span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => setIsShareOpen(true)}
            className="text-white drop-shadow-md transition-transform active:scale-95"
          >
            <Send className="w-[28px] h-[28px]" />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-md">{shares}</span>
        </div>

        {/* Options */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => setIsShareOpen(true)}
            className="text-white drop-shadow-md transition-transform active:scale-95"
          >
            <MoreHorizontal className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Bottom Area: Tagged Product & Caption */}
      <div className="absolute bottom-6 left-4 right-16 flex flex-col gap-2.5 z-30 pointer-events-auto">
        {/* Tagged Product Chip */}
        {product && (
          <div className="w-full max-w-[280px]">
            <ProductOverlayCard product={product} />
          </div>
        )}

        {/* Caption Row */}
        <div className="flex flex-col pr-2">
          {/* Creator Profile, Name, Follow */}
          <div className="flex items-center gap-2 mb-1">
            <Link 
              href={storeId ? `/store/${storeId}` : '#'}
              className="w-8 h-8 rounded-full overflow-hidden border border-white/60 shadow-sm shrink-0"
            >
              <img src={storeAvatar} alt={storeName} className="w-full h-full object-cover" />
            </Link>
            
            <Link 
              href={storeId ? `/store/${storeId}` : '#'}
              className="flex items-center gap-1"
            >
              <span className="text-white font-bold text-[14px] leading-tight shadow-sm hover:underline">{storeName}</span>
              {isVerified && (
                <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </Link>

            {/* Follow Button */}
            <button 
              onClick={handleToggleFollow}
              className={cn(
                "border rounded px-2.5 py-0.5 text-[10px] font-bold shadow-sm ml-1 transition-all flex items-center gap-1",
                isFollowing 
                  ? "bg-white text-black border-white" 
                  : "text-white border-white/80 hover:bg-white/10"
              )}
            >
              {isFollowing && <Check className="w-3 h-3 stroke-[3]" />}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
          
          <p className="text-white text-[13px] font-medium drop-shadow-md line-clamp-2 leading-tight">
            {caption}
          </p>
          {hashtags && hashtags.length > 0 && (
            <p className="text-white/90 text-xs font-bold drop-shadow-md mt-0.5">
              {hashtags.map(tag => `#${tag}`).join(' ')}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-2 z-30">
        <div className="w-full h-[2.5px] bg-white/30 rounded-full relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Bottom Sheets */}
      <CommentsBottomSheet 
        isOpen={isCommentsOpen} 
        onClose={() => setIsCommentsOpen(false)} 
        targetId={id} 
        type="reel" 
      />
      <ShareBottomSheet 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        url={reelUrl} 
      />
    </div>
  );
}
