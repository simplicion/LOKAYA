'use client';

import React from 'react';
import { MoreHorizontal, Heart, MessageCircle, Send, Music, ChevronRight } from 'lucide-react';
import { ProductOverlayCard } from './ProductOverlayCard';

export interface SocialReelProps {
  id: string;
  storeName: string;
  storeAvatar: string;
  isVerified: boolean;
  timeAgo: string;
  videoUrl: string;
  likes: string;
  comments: string;
  shares: string;
  caption: string;
  hashtags: string[];
  product: {
    name: string;
    image: string;
    price: string;
    originalPrice?: string;
    discount?: string;
  };
  duration: string; // e.g. "0:15"
  currentTime: string; // e.g. "0:08"
  progressPercent: number; // e.g. 50
}

export function SocialReel({
  storeName,
  storeAvatar,
  isVerified,
  timeAgo,
  videoUrl,
  likes,
  comments,
  shares,
  caption,
  hashtags,
  product,
  duration,
  currentTime,
  progressPercent
}: SocialReelProps) {
  return (
    <div className="relative w-full h-full bg-black overflow-hidden snap-start shrink-0">
      {/* Background Video (Mocked as image for now) */}
      <img
        src={videoUrl}
        alt="Reel Content"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient Overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      {/* Top Bar removed per request */}

      {/* Right Sidebar: Social Actions */}
      <div className="absolute bottom-28 right-4 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <button className="text-white drop-shadow-md transition-transform active:scale-95">
            <Heart className="w-8 h-8" />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-md">{likes}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button className="text-white drop-shadow-md transition-transform active:scale-95">
            <MessageCircle className="w-[28px] h-[28px]" />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-md">{comments}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button className="text-white drop-shadow-md transition-transform active:scale-95">
            <Send className="w-[28px] h-[28px]" />
          </button>
          <span className="text-white text-[11px] font-bold drop-shadow-md">{shares}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button className="text-white drop-shadow-md transition-transform active:scale-95">
            <MoreHorizontal className="w-7 h-7" />
          </button>
        </div>

      </div>

      {/* Bottom Area: Product, Caption */}
      <div className="absolute bottom-10 left-4 right-16 flex flex-col gap-3">
        {/* Product Chip */}
        <div className="w-full max-w-[280px]">
          <ProductOverlayCard product={product} />
        </div>

        {/* Caption Row */}
        <div className="flex flex-col pr-2 mt-1">
          {/* Creator Profile, Name, Follow */}
          <div className="flex items-center gap-2 mb-1.5">
            {/* Profile Icon */}
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/40 shadow-sm shrink-0">
              <img src={storeAvatar} alt={storeName} className="w-full h-full object-cover" />
            </div>
            {/* Name & Badge */}
            <div className="flex items-center gap-1">
              <span className="text-white font-bold text-[14px] leading-tight shadow-sm">{storeName}</span>
              {isVerified && (
                <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {/* Follow Button */}
            <button className="text-white border border-white/80 rounded px-2.5 py-0.5 text-[10px] font-bold shadow-sm ml-1 hover:bg-white/10 transition-colors">
              Follow
            </button>
          </div>
          
          <p className="text-white text-[13px] font-medium drop-shadow-md line-clamp-2 leading-tight">
            {caption}
          </p>
          <p className="text-white/90 text-xs font-bold drop-shadow-md mt-1">
            {hashtags.map(tag => `#${tag}`).join(' ')}
          </p>
        </div>
      </div>

      {/* Progress Bar & Time */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        <div className="w-full h-[3px] bg-white/30 rounded-full relative">
          <div 
            className="absolute top-0 left-0 h-full bg-white rounded-full flex items-center justify-end"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="w-2.5 h-2.5 bg-white rounded-full translate-x-1/2 shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
