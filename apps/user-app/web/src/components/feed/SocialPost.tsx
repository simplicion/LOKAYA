'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Play, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductOverlayCard } from './ProductOverlayCard';
import { ShareBottomSheet } from '../ui/ShareBottomSheet';
import { LikesBottomSheet } from '../ui/LikesBottomSheet';
import { CommentsBottomSheet } from '../ui/CommentsBottomSheet';
import { ReportBottomSheet } from '../ui/ReportBottomSheet';
import { OptionsBottomSheet } from '../ui/OptionsBottomSheet';
import { useLikePostMutation, useSavePostMutation } from '@/lib/api';

export interface SocialPostProps {
  id: string;
  storeId?: string;
  storeName: string;
  storeAvatar: string;
  isVerified: boolean;
  timeAgo: string;
  media: {
    type: 'image' | 'video';
    url: string;
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
}: SocialPostProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // Local optimistic state for likes & saves
  const [isLiked, setIsLiked] = useState(isLikedByMe);
  const [likeTotal, setLikeTotal] = useState(likesCount || parseInt(likes.replace(/,/g, '')) || 0);
  const [isSaved, setIsSaved] = useState(isSavedByMe);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const lastTapRef = useRef<number>(0);
  const isLikingRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);

  const [likePost] = useLikePostMutation();
  const [savePost] = useSavePostMutation();
  
  const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${id}` : '';

  // Synchronize when feed refetches or props update
  useEffect(() => {
    setIsLiked(isLikedByMe);
  }, [isLikedByMe]);

  useEffect(() => {
    setLikeTotal(likesCount || parseInt(likes.replace(/,/g, '')) || 0);
  }, [likesCount, likes]);

  useEffect(() => {
    setIsSaved(isSavedByMe);
  }, [isSavedByMe]);

  const triggerLike = async () => {
    if (isLikingRef.current) return;
    isLikingRef.current = true;
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 750);

    if (!isLiked) {
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

  const handleMediaClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      triggerLike();
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

  return (
    <div className="flex flex-col w-full bg-white mb-6 border-b border-[#E5E2DC] pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link 
          href={storeId ? `/store/${storeId}` : '#'}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-100 p-0.5">
            <img src={storeAvatar} alt={storeName} className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-[#171717] font-bold text-[15px] leading-tight group-hover:text-[#FF5A36] transition-colors">{storeName}</span>
              {isVerified && (
                <div className="w-3.5 h-3.5 bg-[#171717] rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-[#6B6B6B] text-[11px] font-medium mt-0.5">{timeAgo}</span>
          </div>
        </Link>
        <button onClick={() => setIsOptionsOpen(true)} className="text-[#171717] p-1 active:bg-gray-100 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Media Container */}
      <div 
        className="relative w-full aspect-[4/5] bg-gray-900 overflow-hidden cursor-pointer"
        onClick={handleMediaClick}
      >
        {/* Scrollable Media List */}
        <div 
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
          onScroll={(e) => {
            const target = e.target as HTMLElement;
            const index = Math.round(target.scrollLeft / target.clientWidth);
            if (index !== currentMediaIndex) {
              setCurrentMediaIndex(index);
            }
          }}
        >
          {media.map((m, idx) => (
            <div key={idx} className="relative w-full h-full flex-shrink-0 snap-center">
              {m.type === 'video' ? (
                <video src={m.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img
                  src={m.url}
                  alt={`Post Media ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}

              {/* Video Overlays */}
              {m.type === 'video' && (
                <>
                  <div className="absolute top-4 right-4 bg-black/60 rounded-full p-1.5 backdrop-blur-sm pointer-events-none">
                    <VolumeX className="w-4 h-4 text-white" />
                  </div>
                  {m.duration && (
                    <div className="absolute bottom-[88px] left-4 bg-black/60 rounded-md px-2 py-0.5 text-white text-[10px] font-bold backdrop-blur-sm pointer-events-none">
                      {m.duration}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

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
          <div className="absolute top-4 right-4 bg-black/60 rounded-full px-2 py-1 text-white text-[10px] font-bold backdrop-blur-sm pointer-events-none">
            {currentMediaIndex + 1}/{media.length}
          </div>
        )}
      </div>

      {/* Carousel Dots */}
      {media.length > 1 && (
        <div className="flex items-center justify-center gap-1 mt-3">
          {media.map((_, idx) => (
            <div 
              key={idx} 
              className={cn("h-1.5 rounded-full transition-all", idx === currentMediaIndex ? "w-4 bg-[#FF5A36]" : "w-1.5 bg-[#E5E2DC]")}
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
            <span className="font-bold text-[13px] text-[#171717] tabular-nums">{comments}</span>
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
      <CommentsBottomSheet isOpen={isCommentsOpen} onClose={() => setIsCommentsOpen(false)} targetId={id} type="post" />
      <ReportBottomSheet isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} targetId={id} type="post" />
      <OptionsBottomSheet isOpen={isOptionsOpen} onClose={() => setIsOptionsOpen(false)} url={postUrl} onReport={() => setIsReportOpen(true)} />
    </div>
  );
}
