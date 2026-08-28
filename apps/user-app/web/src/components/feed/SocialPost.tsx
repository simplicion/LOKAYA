'use client';

import React, { useState } from 'react';
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Play, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductOverlayCard } from './ProductOverlayCard';

export interface SocialPostProps {
  id: string;
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
  comments: string;
  shares: string;
  caption: string;
  hashtags: string[];
  likedByText?: string;
  likedByAvatars?: string[];
  product: {
    name: string;
    image: string;
    price: string;
    originalPrice?: string;
    discount?: string;
  };
}

export function SocialPost({
  storeName,
  storeAvatar,
  isVerified,
  timeAgo,
  media,
  likes,
  comments,
  shares,
  caption,
  hashtags,
  likedByText,
  likedByAvatars,
  product,
}: SocialPostProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  return (
    <div className="flex flex-col w-full bg-white mb-6 border-b border-[#E5E2DC] pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            <img src={storeAvatar} alt={storeName} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-[#171717] font-bold text-[15px] leading-tight">{storeName}</span>
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
        </div>
        <button className="text-[#171717] p-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Media Container */}
      <div className="relative w-full aspect-[4/5] bg-gray-900 overflow-hidden">
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
              <img
                src={m.url}
                alt={`Post Media ${idx + 1}`}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* Video Overlays */}
              {m.type === 'video' && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-8 h-8 text-white ml-1 fill-white" />
                    </div>
                  </div>
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

        {/* Product Overlay Card */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <ProductOverlayCard product={product} />
        </div>

        {/* Multi-image indicators */}
        {media.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/60 rounded-full px-2 py-1 text-white text-[10px] font-bold backdrop-blur-sm pointer-events-none">
            {currentMediaIndex + 1}/{media.length}
          </div>
        )}
      </div>

      {/* Carousel Dots (Optional, depending on design. Hidden for now to match screenshot closely, or placed inside/below media) */}
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
          <button className="flex items-center gap-1.5 group">
            <Heart className="w-6 h-6 text-[#171717] group-active:scale-90 transition-transform" strokeWidth={1.5} />
            <span className="font-bold text-[13px] text-[#171717] tabular-nums">{likes}</span>
          </button>
          <button className="flex items-center gap-1.5 group">
            <MessageCircle className="w-6 h-6 text-[#171717] group-active:scale-90 transition-transform" strokeWidth={1.5} />
            <span className="font-bold text-[13px] text-[#171717] tabular-nums">{comments}</span>
          </button>
          <button className="flex items-center gap-1.5 group">
            <Send className="w-6 h-6 text-[#171717] group-active:scale-90 transition-transform" strokeWidth={1.5} />
            <span className="font-bold text-[13px] text-[#171717] tabular-nums">{shares}</span>
          </button>
        </div>
        <button className="group">
          <Bookmark className="w-6 h-6 text-[#171717] group-active:scale-90 transition-transform" strokeWidth={1.5} />
        </button>
      </div>

      {/* Caption & Likes */}
      <div className="px-4 mt-3 flex flex-col gap-1.5">
        <p className="text-[#171717] text-[13px] font-medium leading-snug">
          {caption}
        </p>
        <p className="text-[#6B6B6B] text-[13px] font-medium">
          {hashtags.map(tag => `#${tag}`).join(' ')}
        </p>
        
        {likedByText && likedByAvatars && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex -space-x-1.5">
              {likedByAvatars.map((av, idx) => (
                <div key={idx} className="w-5 h-5 rounded-full border border-white overflow-hidden">
                  <img src={av} alt="Liked by" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <span className="text-[#171717] text-[12px] font-medium">{likedByText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
