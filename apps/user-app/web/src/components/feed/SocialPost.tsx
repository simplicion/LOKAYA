'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Play, VolumeX, Volume2, Sparkles, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, getMediaUrl, formatTimeAgo } from '@/lib/utils';
import { ProductOverlayCard } from './ProductOverlayCard';
import { ShareBottomSheet } from '../ui/ShareBottomSheet';
import { LikesBottomSheet } from '../ui/LikesBottomSheet';
import { CommentsBottomSheet } from '../ui/CommentsBottomSheet';
import { ReportBottomSheet } from '../ui/ReportBottomSheet';
import { OptionsBottomSheet } from '../ui/OptionsBottomSheet';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { useLikePostMutation, useSavePostMutation, useDeletePostMutation } from '@/lib/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { toast } from 'sonner';
import { VideoPlayer } from '../media/VideoPlayer';
import { useFeedSound } from '@/context/FeedSoundContext';

export interface SocialPostProps {
  id: string;
  authorId?: string;
  storeId?: string;
  storeName: string;
  storeAvatar: string;
  isVerified: boolean;
  timeAgo?: string;
  createdAt?: string | Date;
  isReel?: boolean;
  contentType?: 'POST' | 'REEL';
  media: {
    type: 'image' | 'video';
    url: string;
    posterUrl?: string;
    duration?: string; // e.g. "0:25"
  }[];
  likes: string;
  likesCount?: number;
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
  comments: string;
  shares: string;
  caption: string;
  hashtags: string[];
  likedByText?: string;
  likedByAvatars?: string[];
  product?: {
    id?: string;
    name: string;
    image: string;
    price: string;
    originalPrice?: string;
    discount?: string;
  };
}

export function SocialPost({
  id,
  authorId,
  storeId,
  storeName,
  storeAvatar,
  isVerified,
  timeAgo,
  media,
  likes,
  likesCount = 0,
  isLikedByMe = false,
  isSavedByMe = false,
  comments,
  shares,
  caption,
  hashtags,
  likedByText,
  likedByAvatars,
  product,
  createdAt,
  isReel = false,
  contentType = 'POST',
}: SocialPostProps) {
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isAuthor = Boolean(currentUser?.id && authorId && currentUser.id === authorId);

  // Global feed sound state (unmute one -> unmutes all across the feed)
  const { isMuted, toggleMute } = useFeedSound();

  // Scroll visibility observer for automatic video play/pause
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = mediaContainerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Autoplay when at least 45% of the post media is in the active viewport
        setIsInView(entry.isIntersecting && entry.intersectionRatio >= 0.45);
      },
      {
        threshold: [0, 0.25, 0.45, 0.7, 1.0],
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const displayTime = timeAgo && timeAgo !== 'Recently' ? timeAgo : formatTimeAgo(createdAt || timeAgo);

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const width = container.clientWidth;
    container.scrollTo({
      left: index * width,
      behavior: 'smooth',
    });
    setCurrentMediaIndex(index);
  };
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Local optimistic state for likes, saves & comments
  const [isLiked, setIsLiked] = useState(isLikedByMe);
  const [likeTotal, setLikeTotal] = useState(likesCount || parseInt(String(likes).replace(/,/g, '')) || 0);
  const [isSaved, setIsSaved] = useState(isSavedByMe);
  const [commentTotal, setCommentTotal] = useState(() => parseInt(String(comments).replace(/,/g, '')) || 0);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const lastTapRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLikingRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);

  const [likePost] = useLikePostMutation();
  const [savePost] = useSavePostMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  
  const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${id}` : '';

  const handleConfirmDelete = async () => {
    try {
      await deletePost(id).unwrap();
      setIsDismissed(true);
      setIsDeleteModalOpen(false);
      toast.success('Post deleted successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete post');
    }
  };

  const handleReported = () => {
    setIsDismissed(true);
    toast.success('Thank you for reporting. This post has been hidden.');
  };

  // Synchronize when feed refetches or props update
  useEffect(() => {
    setIsLiked(isLikedByMe);
  }, [isLikedByMe]);

  useEffect(() => {
    if (likesCount !== undefined) {
      setLikeTotal(likesCount);
    }
  }, [likesCount]);

  useEffect(() => {
    setCommentTotal(parseInt(String(comments).replace(/,/g, '')) || 0);
  }, [comments]);

  useEffect(() => {
    setLikeTotal(likesCount || parseInt(likes.replace(/,/g, '')) || 0);
  }, [likesCount, likes]);

  useEffect(() => {
    setIsSaved(isSavedByMe);
  }, [isSavedByMe]);

  const triggerLike = async () => {
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 750);

    if (!isLiked && !isLikingRef.current) {
      isLikingRef.current = true;
      setIsLiked(true);
      setLikeTotal(prev => prev + 1);

      try {
        const res = await likePost(id).unwrap();
        if (typeof res?.liked === 'boolean') {
          setIsLiked(res.liked);
          if (res.likesCount !== undefined) setLikeTotal(res.likesCount);
        }
      } catch {
        setIsLiked(false);
        setLikeTotal(prev => Math.max(0, prev - 1));
      } finally {
        isLikingRef.current = false;
      }
    } else {
      isLikingRef.current = false;
    }
  };

  const openReelsView = () => {
    const currentMedia = media[currentMediaIndex] || media[0];
    const vUrl = currentMedia?.url || '';
    const pUrl = currentMedia?.posterUrl || '';
    const params = new URLSearchParams();
    params.set('id', id);
    if (vUrl) params.set('videoUrl', vUrl);
    if (pUrl) params.set('posterUrl', pUrl);
    if (storeName) params.set('storeName', storeName);
    if (caption) params.set('caption', caption);
    router.push(`/home/reels?${params.toString()}`);
  };

  const handleMediaClick = () => {
    const currentMedia = media[currentMediaIndex] || media[0];
    const isVideo = currentMedia?.type === 'video';

    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      triggerLike();
    } else {
      if (isVideo) {
        clickTimeoutRef.current = setTimeout(() => {
          openReelsView();
        }, 180);
      }
    }
    lastTapRef.current = now;
  };

  const handleToggleLike = async () => {
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
      const res = await likePost(id).unwrap();
      if (typeof res?.liked === 'boolean') {
        setIsLiked(res.liked);
        if (res.likesCount !== undefined) setLikeTotal(res.likesCount);
      }
    } catch (err) {
      // Revert on error
      setIsLiked(!next);
      setLikeTotal(prev => !next ? prev + 1 : Math.max(0, prev - 1));
    } finally {
      isLikingRef.current = false;
    }
  };

  const handleToggleSave = async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    const next = !isSaved;
    setIsSaved(next);
    try {
      await savePost(id).unwrap();
    } catch {
      setIsSaved(!next);
    } finally {
      isSavingRef.current = false;
    }
  };

  if (isDismissed) return null;

  return (
    <div className="flex flex-col w-full bg-white mb-6 border-b border-[#E5E2DC] pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link 
          href={storeId ? `/store/${storeId}` : (authorId ? `/user/${authorId}` : '#')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-100 p-0.5 flex items-center justify-center">
            {storeAvatar ? (
              <img src={getMediaUrl(storeAvatar)} alt={storeName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-gray-500 text-xs bg-gray-100">
                {storeName ? storeName.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-[#171717] font-bold text-[15px] leading-tight group-hover:text-[#FF5A36] transition-colors">{storeName}</span>
              {isVerified && (
                <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 text-white shrink-0 animate-in zoom-in duration-300" />
              )}
            </div>
            <span className="text-[#6B6B6B] text-[11px] font-medium mt-0.5">{displayTime}</span>
          </div>
        </Link>
        <button onClick={() => setIsOptionsOpen(true)} className="text-[#171717] p-1 active:bg-gray-100 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Media Container */}
      {media && media.length > 0 && (
        <div 
          ref={mediaContainerRef}
          className="relative w-full aspect-[4/5] bg-gray-900 overflow-hidden cursor-pointer"
          onClick={handleMediaClick}
        >
          {/* Scrollable Media List (1-by-1 Instagram Carousel) */}
          <div 
            ref={scrollContainerRef}
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar hide-scrollbar scroll-smooth touch-pan-x select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onScroll={(e) => {
              const target = e.currentTarget;
              const width = target.clientWidth;
              if (width > 0) {
                const index = Math.round(target.scrollLeft / width);
                if (index !== currentMediaIndex && index >= 0 && index < media.length) {
                  setCurrentMediaIndex(index);
                }
              }
            }}
          >
            {media.map((m, idx) => (
              <div 
                key={idx} 
                className="relative w-full min-w-full h-full shrink-0 snap-center snap-always flex items-center justify-center overflow-hidden bg-black select-none"
              >
                {m.type === 'video' && m.url ? (
                  <VideoPlayer
                    src={m.url}
                    poster={m.posterUrl}
                    autoPlay={true}
                    isActive={isInView && currentMediaIndex === idx}
                    muted={isMuted}
                    loop={true}
                    playsInline={true}
                    className="w-full h-full object-cover"
                  />
                ) : m.url ? (
                  <img
                    src={getMediaUrl(m.url)}
                    alt={`Post Media ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
                    No Media
                  </div>
                )}

                {/* Video Overlays */}
                {m.type === 'video' && (
                  <>
                    {/* Interactive Global Sound Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                      }}
                      aria-label={isMuted ? "Unmute video" : "Mute video"}
                      className={cn(
                        "absolute z-20 p-2.5 rounded-full backdrop-blur-md shadow-lg border border-white/20 transition-all active:scale-90 flex items-center justify-center cursor-pointer",
                        "bg-black/65 hover:bg-black/85 text-white",
                        product ? "bottom-24 right-4" : "bottom-4 right-4"
                      )}
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white animate-pulse" />
                      )}
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Instagram-style Carousel Navigation Arrows */}
          {media.length > 1 && currentMediaIndex > 0 && (
            <button
              type="button"
              aria-label="Previous slide"
              onClick={(e) => {
                e.stopPropagation();
                scrollToIndex(currentMediaIndex - 1);
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/85 hover:bg-white text-gray-900 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 -ml-0.5 text-gray-800 stroke-[2.5]" />
            </button>
          )}

          {media.length > 1 && currentMediaIndex < media.length - 1 && (
            <button
              type="button"
              aria-label="Next slide"
              onClick={(e) => {
                e.stopPropagation();
                scrollToIndex(currentMediaIndex + 1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/85 hover:bg-white text-gray-900 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 -mr-0.5 text-gray-800 stroke-[2.5]" />
            </button>
          )}

          {/* Big Heart Animation on Double Tap */}
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping duration-500">
              <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl opacity-90" />
            </div>
          )}

          {/* Product Overlay Card */}
          {product && (
            <div className="absolute bottom-4 left-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
              <ProductOverlayCard product={product} />
            </div>
          )}

          {/* Multi-image indicators */}
          {media.length > 1 && (
            <div className="absolute top-3.5 right-3.5 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1 text-white text-[11px] font-semibold z-20 pointer-events-none tracking-wide shadow-sm">
              {currentMediaIndex + 1}/{media.length}
            </div>
          )}
        </div>
      )}

      {/* Instagram-style Carousel Dots */}
      {media.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {media.map((_, idx) => (
            <button 
              key={idx} 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollToIndex(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200 cursor-pointer p-0 border-0 outline-none",
                idx === currentMediaIndex 
                  ? "w-4 bg-[#FF5A36]" 
                  : "w-1.5 bg-[#E5E2DC] hover:bg-gray-400"
              )}
            />
          ))}
        </div>
      )}

      {/* Actions Row */}
      <div className="flex items-center justify-between px-4 mt-4">
        <div className="flex items-center gap-5">
          {/* Like button toggles like directly */}
          <button onClick={handleToggleLike} className="flex items-center gap-1.5 group">
            <Heart 
              className={cn(
                "w-6 h-6 group-active:scale-125 transition-all",
                isLiked ? "text-red-500 fill-red-500" : "text-[#171717]"
              )} 
              strokeWidth={isLiked ? 2 : 1.5} 
            />
            <span className="font-bold text-[13px] text-[#171717] tabular-nums">
              {likeTotal.toLocaleString()}
            </span>
          </button>

          {/* Comment button opens comment sheet */}
          <button onClick={() => setIsCommentsOpen(true)} className="flex items-center gap-1.5 group">
            <MessageCircle className="w-6 h-6 text-[#171717] group-active:scale-90 transition-transform" strokeWidth={1.5} />
            <span className="font-bold text-[13px] text-[#171717] tabular-nums">{commentTotal.toLocaleString()}</span>
          </button>

          {/* Share button opens share sheet */}
          <button onClick={() => setIsShareOpen(true)} className="flex items-center gap-1.5 group">
            <Send className="w-6 h-6 text-[#171717] group-active:scale-90 transition-transform" strokeWidth={1.5} />
            <span className="font-bold text-[13px] text-[#171717] tabular-nums">{shares}</span>
          </button>
        </div>

        {/* Bookmark button */}
        <button onClick={handleToggleSave} className="group">
          <Bookmark 
            className={cn(
              "w-6 h-6 group-active:scale-125 transition-all",
              isSaved ? "text-[#171717] fill-[#171717]" : "text-[#171717]"
            )} 
            strokeWidth={1.5} 
          />
        </button>
      </div>

      {/* Caption & Likes List Trigger */}
      <div className="px-4 mt-3 flex flex-col gap-1.5">
        <p className="text-[#171717] text-[13px] font-medium leading-snug">
          {caption}
        </p>
        {hashtags && hashtags.length > 0 && (
          <p className="text-[#6B6B6B] text-[13px] font-medium">
            {hashtags.map(tag => `#${tag}`).join(' ')}
          </p>
        )}
        
        {likedByText && likedByAvatars && likedByAvatars.length > 0 && (
          <button onClick={() => setIsLikesOpen(true)} className="flex items-center gap-2 mt-2 group text-left">
            <div className="flex -space-x-1.5 group-active:scale-95 transition-transform">
              {likedByAvatars.map((av, idx) => (
                <div key={idx} className="w-5 h-5 rounded-full border border-white overflow-hidden">
                  <img src={av} alt="Liked by" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <span className="text-[#171717] text-[12px] font-medium">{likedByText}</span>
          </button>
        )}
      </div>

      {/* Bottom Sheets */}
      <ShareBottomSheet isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} url={postUrl} />
      <LikesBottomSheet isOpen={isLikesOpen} onClose={() => setIsLikesOpen(false)} targetId={id} type="post" />
      <CommentsBottomSheet 
        isOpen={isCommentsOpen} 
        onClose={() => setIsCommentsOpen(false)} 
        targetId={id} 
        type="post" 
        onCommentAdded={() => setCommentTotal(prev => prev + 1)}
      />
      <ReportBottomSheet 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        onReported={handleReported}
        targetId={id} 
        type="post" 
      />
      <OptionsBottomSheet 
        isOpen={isOptionsOpen} 
        onClose={() => setIsOptionsOpen(false)} 
        url={postUrl} 
        isOwner={isAuthor}
        itemType="post"
        onReport={() => setIsReportOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      {/* Universal Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Post?"
        description="Are you sure you want to delete this post? This action cannot be undone and will permanently remove it from your profile and feed."
        confirmText="Delete Post"
        cancelText="Keep Post"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
