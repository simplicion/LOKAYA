'use client';

import React from 'react';
import { Heart, Star, BadgeCheck, MoreVertical } from 'lucide-react';

export interface ExploreProductCardProps {
  product: {
    id: string;
    title: string;
    image: string;
    price: string;
    originalPrice?: string;
    discount?: string;
    tag?: { text: string; bg: string };
    store: { name: string; isVerified: boolean };
    rating: string;
    reviews: string;
  };
}

export function ExploreProductCard({ product }: ExploreProductCardProps) {
  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-[#E5E2DC]/60">
      {/* Product Image */}
      <div className="relative aspect-[4/5] bg-[#F9F6F0]">
        <img src={product.image} alt={product.title} className="w-full h-full object-cover mix-blend-multiply" />
        
        {product.tag && (
          <div className={`absolute top-2.5 left-2.5 ${product.tag.bg} text-white text-[10px] font-bold px-2 py-0.5 rounded-md`}>
            {product.tag.text}
          </div>
        )}
        
        <button className="absolute top-2.5 right-2.5 p-1">
          <Heart className="w-[18px] h-[18px] text-[#171717] stroke-[1.5]" />
        </button>
      </div>
      
      {/* Product Details */}
      <div className="p-3 flex flex-col gap-1.5">
        <h3 className="text-[13px] font-medium text-[#171717] leading-tight truncate">{product.title}</h3>
        
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[15px] font-bold text-[#171717] tabular-nums leading-none">₹{product.price}</span>
          {product.originalPrice && (
            <span className="text-[11px] text-[#999999] line-through font-medium tabular-nums leading-none">₹{product.originalPrice}</span>
          )}
          {product.discount && (
            <span className="text-[10px] font-bold text-[#FF5A36] bg-[#FFF0ED] px-1.5 py-0.5 rounded-sm leading-none">
              {product.discount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 mt-0.5">
          <Star className="w-3 h-3 fill-[#FF9800] text-[#FF9800]" />
          <span className="text-[11px] font-bold text-[#171717] leading-none">{product.rating}</span>
          <span className="text-[11px] text-[#999999] leading-none ml-0.5">{product.reviews}</span>
        </div>
        
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-[#E5E2DC]/60">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-[#171717] truncate max-w-[90px]">{product.store.name}</span>
            {product.store.isVerified && <BadgeCheck className="w-[14px] h-[14px] text-[#3B82F6] fill-[#3B82F6] text-white flex-shrink-0" />}
          </div>
          <button>
            <MoreVertical className="w-[14px] h-[14px] text-[#999999]" />
          </button>
        </div>
      </div>
    </div>
  );
}
