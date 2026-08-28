'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface ProductOverlayCardProps {
  product: {
    name: string;
    image: string;
    price: string;
    originalPrice?: string;
    discount?: string;
  };
}

export function ProductOverlayCard({ product }: ProductOverlayCardProps) {
  return (
    <div className="bg-white rounded-[14px] p-2 flex items-center gap-3 shadow-lg cursor-pointer active:scale-[0.98] transition-transform w-full">
      <div className="w-[52px] h-[52px] rounded-[10px] overflow-hidden bg-gray-100 flex-shrink-0">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 flex flex-col justify-center overflow-hidden">
        <span className="text-[13px] font-bold text-[#171717] leading-tight truncate">{product.name}</span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[#171717] font-bold text-[15px] tabular-nums leading-none">{product.price}</span>
          {product.originalPrice && (
            <span className="text-[#999999] text-[11px] line-through font-medium tabular-nums leading-none">{product.originalPrice}</span>
          )}
          {product.discount && (
            <span className="bg-[#FF5A36] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm leading-none ml-1 shrink-0">{product.discount}</span>
          )}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-[#6B6B6B] mr-1 shrink-0" />
    </div>
  );
}
