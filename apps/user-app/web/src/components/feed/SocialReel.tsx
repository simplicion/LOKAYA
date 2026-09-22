'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Heart, MessageCircle, Send, Play, Volume2, VolumeX, Check, CheckCircle2 } from 'lucide-react';
import { ProductOverlayCard } from './ProductOverlayCard';
import { CommentsBottomSheet } from '../ui/CommentsBottomSheet';
import { ShareBottomSheet } from '../ui/ShareBottomSheet';
import { OptionsBottomSheet } from '../ui/OptionsBottomSheet';
import { ReportBottomSheet } from '../ui/ReportBottomSheet';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { useLikeReelMutation, useFollowUserMutation, useDeleteReelMutation } from '@/lib/api';
import { cn, getMediaUrl, formatTimeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

import { VideoPlayer } from '../media/VideoPlayer';

export interface SocialReelProps {
  id: string;
  authorId?: string;
  storeId?: string;
  storeName: string;
  storeAvatar: string;
  isVerified: boolean;
  timeAgo?: string;
  createdAt?: string | Date;
  videoUrl: string;
  posterUrl?: string;
  status?: string;
  isOptimizing?: boolean;
  isActive?: boolean;
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
  isFollowing?: boolean;
  onToggleFollow?: (authorId: string, isNowFollowing: boolean) => void;
  feedType?: 'for-you' | 'following' | 'nearby';
  isPreloadCandidate?: boolean;
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
  posterUrl,
  status = 'READY',
  isOptimizing = false,
  isActive = true,
  isPreloadCandidate = false,
  likes,
  likesCount = 0,
  isLikedByMe = false,
  comments,
  shares,
  caption,
  hashtags,
  product,
  duration = '0:15',
  progressPercent = 0,
  isFollowing: initialIsFollowing = false,
  onToggleFollow,
  feedType,
}: SocialReelProps) {
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isAuthor = Boolean(currentUser?.id && authorId && currentUser.id === authorId);
  const showOptimizingBadge = isAuthor && (status === 'PROCESSING' || status === 'PENDING' || isOptimizing);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(progressPercent);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);

  // Optimistic like state & comments
  const [isLiked, setIsLiked] = useState(isLikedByMe);
  const [likeTotal, setLikeTotal] = useState(likesCount || parseInt(String(likes).replace(/,/g, '')) || 0);
  const [commentTotal, setCommentTotal] = useState(() => parseInt(String(comments).replace(/,/g, '')) || 0);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const [likeReel] = useLikeReelMutation();
  const [followUser] = useFollowUserMutation();
  const [deleteReel, { isLoading: isDeleting }] = useDeleteReelMutation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTapRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLikingRef = useRef<boolean>(false);

  const reelUrl = typeof window !== 'undefined' ? `${window.location.origin}/home/reels?id=${id}` : '';

  const isVideo = Boolean(
    videoUrl && (
      videoUrl.includes('.mp4') || 
      videoUrl.includes('.webm') || 
      videoUrl.includes('video') || 
      videoUrl.includes('upload') ||
      videoUrl.startsWith('blob:') ||
      videoUrl.startsWith('data:video') ||
      !videoUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)
    )
  );

  // Synchronize with parent state / refetch
  useEffect(() => {
    setIsLiked(isLikedByMe);
  }, [isLikedByMe]);

  useEffect(() => {
    setLikeTotal(likesCount || parseInt(String(likes).replace(/,/g, '')) || 0);
  }, [likesCount, likes]);

  useEffect(() => {
    setCommentTotal(parseInt(String(comments).replace(/,/g, '')) || 0);
  }, [comments]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
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

      if (!currentUser) {
        toast.error('Please sign in to like this reel');
        router.push('/login');
        return;
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

    if (!currentUser) {
      toast.error('Please sign in to like this reel');
      router.push('/login');
      return;
    }

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

    if (!currentUser) {
      toast.error('Please sign in to follow');
      router.push('/login');
      return;
    }

    const next = !isFollowing;
    setIsFollowing(next);
    if (authorId && onToggleFollow) {
      onToggleFollow(authorId, next);
    }
    toast.success(next ? `Now following ${storeName}` : `Unfollowed ${storeName}`);

    if (authorId) {
      try {
        await followUser(authorId).unwrap();
      } catch {
        setIsFollowing(!next);
        if (onToggleFollow) {
          onToggleFollow(authorId, !next);
        }
      }
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteReel(id).unwrap();
      setIsDismissed(true);
      setIsDeleteModalOpen(false);
      toast.success('Reel deleted successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete reel');
    }
  };

  const handleReported = () => {
    setIsDismissed(true);
    toast.success('Thank you for reporting. This reel will no longer appear in your feed.');
  };

  if (isDismissed) return null;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden snap-start shrink-0">
      {/* Background Media */}
      <div 
        className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center bg-black"
        onClick={handleScreenTap}
      >
        {isVideo && videoUrl ? (
          <VideoPlayer
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            autoPlay={isPlaying}
            isActive={isActive}
            isPreloadCandidate={isPreloadCandidate}
            muted={isMuted}
            loop
            playsInline
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-cover"
          />
        ) : posterUrl ? (
          <img
            src={getMediaUrl(posterUrl)}
            alt={caption || "Reel Content"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-2 bg-gradient-to-b from-neutral-900 to-black">
            <Play className="w-12 h-12 text-white/20" />
            <span className="text-xs font-medium">Media unavailable</span>
          </div>
        )}

        {/* Author-only Optimizing Video Status Badge */}
        {showOptimizingBadge && (
          <div className="absolute top-16 left-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Optimizing Video...</span>
          </div>
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

      {/* Top Bar: Audio Toggle */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-3 pointer-events-auto">
        {isVideo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-95 transition-transform"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Right Side Action Bar */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-30 pointer-events-auto">
        {/* Like Button */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={handleToggleLike}
            className="text-white drop-shadow-md transition-transform active:scale-125"
          >
            <Heart 
              className={cn("w-[30px] h-[30px] transition-colors", isLiked ? "text-red-500 fill-red-500" : "text-white")} 
              strokeWidth={isLiked ? 2 : 1.75} 
            />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-md tabular-nums">{likeTotal.toLocaleString()}</span>
        </div>

        {/* Comment Button */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => setIsCommentsOpen(true)}
            className="text-white drop-shadow-md transition-transform active:scale-95"
            aria-label="Comments"
          >
            <MessageCircle className="w-[28px] h-[28px]" />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-md tabular-nums">
            {commentTotal.toLocaleString()}
          </span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => setIsShareOpen(true)}
            className="text-white drop-shadow-md transition-transform active:scale-95"
            aria-label="Share"
          >
            <Send className="w-[28px] h-[28px]" />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-md">{shares}</span>
        </div>

        {/* Options (3-dot) Button */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => setIsOptionsOpen(true)}
            className="text-white drop-shadow-md transition-transform active:scale-95"
            aria-label="More options"
          >
            <MoreHorizontal className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Bottom Area: Creator Info, Caption & Tagged Product */}
      <div className="absolute bottom-6 left-4 right-16 flex flex-col gap-2 z-30 pointer-events-auto">
        {/* Caption & Creator Row */}
        <div className="flex flex-col pr-2">
          {/* Creator Profile, Name, Follow */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Link 
              href={storeId ? `/store/${storeId}` : (authorId ? `/user/${authorId}` : '#')}
              className="w-8 h-8 rounded-full overflow-hidden border border-white/60 shadow-sm shrink-0 flex items-center justify-center bg-gray-700 active:scale-95 transition-transform"
            >
              {storeAvatar ? (
                <img src={getMediaUrl(storeAvatar)} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">
                  {storeName ? storeName.charAt(0).toUpperCase() : 'S'}
                </span>
              )}
            </Link>
            
            <Link 
              href={storeId ? `/store/${storeId}` : (authorId ? `/user/${authorId}` : '#')}
              className="flex items-center gap-1 max-w-[150px]"
            >
              <span className="text-white font-bold text-[14px] leading-tight shadow-sm hover:underline truncate">{storeName}</span>
              {isVerified && (
                <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 text-white shrink-0 animate-in zoom-in duration-300" />
              )}
            </Link>

            {/* Follow Button */}
            <button 
              onClick={handleToggleFollow}
              className={cn(
                "border rounded px-2.5 py-0.5 text-[10px] font-bold shadow-sm ml-1 transition-all flex items-center gap-1 active:scale-95",
                isFollowing 
                  ? "bg-white text-black border-white" 
                  : "text-white border-white/80 hover:bg-white/10"
              )}
            >
              {isFollowing && <Check className="w-3 h-3 stroke-[3]" />}
              {isFollowing ? 'Following' : 'Follow'}
            </button>

            {feedType === 'nearby' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Nearby
              </span>
            )}
          </div>
          
          {caption && (
            <p className="text-white text-[13px] font-medium drop-shadow-md line-clamp-2 leading-tight">
              {caption}
            </p>
          )}
          {hashtags && hashtags.length > 0 && (
            <p className="text-white/90 text-xs font-bold drop-shadow-md mt-0.5">
              {hashtags.map(tag => `#${tag}`).join(' ')}
            </p>
          )}
        </div>

        {/* Tagged Product Chip (Now placed below user info, profile pic & caption) */}
        {product && (
          <div className="w-full max-w-[280px] mt-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <ProductOverlayCard product={product} />
          </div>
        )}
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
        onCommentAdded={() => setCommentTotal(prev => prev + 1)}
      />
      <ShareBottomSheet 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        url={reelUrl} 
      />
      <OptionsBottomSheet 
        isOpen={isOptionsOpen} 
        onClose={() => setIsOptionsOpen(false)} 
        url={reelUrl}
        isOwner={isAuthor}
        itemType="reel"
        onReport={() => setIsReportOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
      />
      <ReportBottomSheet 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        onReported={handleReported}
        targetId={id} 
        type="reel" 
      />

      {/* Universal Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Reel?"
        description="Are you sure you want to delete this reel? This action cannot be undone and will permanently remove it from your profile and feed."
        confirmText="Delete Reel"
        cancelText="Keep Reel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
