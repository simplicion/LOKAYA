'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface StoryItemProps {
  id: string;
  label: string;
  imageUrl: string;
  type: 'live' | 'new' | 'sale' | 'default';
  hasUnseen?: boolean;
}

export function StoryItem({ id, label, imageUrl, type, hasUnseen = true }: StoryItemProps) {
  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer w-full">
      <div className="relative w-full">
        {/* Border Ring */}
        <div className={cn(
          "w-full aspect-square rounded-full flex items-center justify-center p-[2px]",
          hasUnseen ? "bg-gradient-to-b from-[#FF6B00] to-[#FF0000]" : "bg-[#E5E2DC]"
        )}>
          {/* Inner white circle for spacing */}
          <div className="w-full h-full bg-[#FAF9F6] rounded-full p-[2px]">
             {/* Actual Image */}
             <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden relative">
               <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
               {/* Icon overlay for live shopping (shopping bag icon) */}
               {type === 'live' && (
                 <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <span className="text-white text-xl">🛍️</span>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* Badge Overlay */}
        {type !== 'default' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <div className="bg-[#FF5A36] text-white text-[9px] font-bold px-1.5 py-[2px] rounded-sm border border-[#FAF9F6] shadow-sm uppercase whitespace-nowrap tracking-wider">
              {type === 'live' && 'LIVE'}
              {type === 'new' && 'NEW'}
              {type === 'sale' && 'SALE'}
            </div>
          </div>
        )}
      </div>

      <span className="text-[11px] font-medium text-[#171717] mt-1.5 w-full truncate text-center px-0.5">
        {label}
      </span>
    </div>
  );
}
