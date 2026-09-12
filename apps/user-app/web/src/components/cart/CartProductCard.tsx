import React from 'react';
import Image from 'next/image';
import { Trash2, Plus, Minus } from 'lucide-react';

interface CartProductCardProps {
  id: string; // Cart item ID
  name: string;
  variantInfo?: string;
  price: number;
  originalPrice: number;
  discount?: string;
  imageUrl: string;
  quantity: number;
  onIncrement: (id: string, quantity: number) => void;
  onDecrement: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartProductCard({
  id,
  name,
  variantInfo,
  price,
  originalPrice,
  discount,
  imageUrl,
  quantity,
  onIncrement,
  onDecrement,
  onRemove
}: CartProductCardProps) {
  const safeImageUrl = imageUrl && imageUrl.trim() !== '' 
    ? imageUrl 
    : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';

  return (
    <div className="flex gap-4">
      <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2 relative">
        <img 
          src={safeImageUrl} 
          alt={name} 
          className="w-full h-full object-contain mix-blend-multiply" 
        />
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-[#171717] text-sm line-clamp-1">{name}</h4>
          {variantInfo && <p className="text-xs text-[#6B6B6B] mt-0.5">{variantInfo}</p>}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-bold text-[#171717]">₹{price.toLocaleString('en-IN')}</span>
            {originalPrice > price && (
              <>
                <span className="text-xs text-[#999999] line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
                {discount && <span className="text-[10px] font-bold text-[#FF5A36] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">{discount}</span>}
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-between mt-3 gap-x-2 gap-y-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center border border-[#E5E2DC] rounded-lg bg-white overflow-hidden flex-shrink-0">
              <button 
                onClick={() => quantity > 1 ? onDecrement(id, quantity - 1) : onRemove(id)}
                className="px-1.5 sm:px-2 py-1 text-[#6B6B6B] hover:bg-gray-50 border-r border-[#E5E2DC] transition-colors"
              >
                {quantity > 1 ? <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />}
              </button>
              <span className="px-2 sm:px-3 py-1 font-bold text-xs sm:text-sm min-w-[32px] text-center">{quantity}</span>
              <button 
                onClick={() => onIncrement(id, quantity + 1)}
                className="px-1.5 sm:px-2 py-1 text-[#6B6B6B] hover:bg-gray-50 border-l border-[#E5E2DC] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
