import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Trash2, Plus, Minus, Heart, Sparkles, Check, AlertCircle, Package } from 'lucide-react';
import { useToggleWishlistMutation, useGetWishlistQuery } from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

interface CartProductCardProps {
  id: string; // Cart item ID
  productId?: string;
  name: string;
  variantInfo?: string;
  price: number;
  originalPrice: number;
  discount?: string;
  imageUrl: string;
  quantity: number;
  stockCount?: number;
  storeName?: string;
  onIncrement: (id: string, quantity: number) => void;
  onDecrement: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartProductCard({
  id,
  productId,
  name,
  variantInfo,
  price,
  originalPrice,
  discount,
  imageUrl,
  quantity,
  stockCount,
  storeName,
  onIncrement,
  onDecrement,
  onRemove
}: CartProductCardProps) {
  const router = useRouter();
  const user = useSelector((state: RootState) => (state as any).auth?.user);
  const { formatPrice } = useCurrency();
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !user });
  const [toggleWishlist, { isLoading: isWishlisting }] = useToggleWishlistMutation();

  const isServerSaved = React.useMemo(() => {
    if (!wishlistData?.data || !productId) return false;
    return wishlistData.data.some((item: any) => item.productId === productId || item.product?.id === productId);
  }, [wishlistData, productId]);

  const [isSaved, setIsSaved] = useState(isServerSaved);

  useEffect(() => {
    setIsSaved(isServerSaved);
  }, [isServerSaved]);

  const safeImageUrl = imageUrl && imageUrl.trim() !== '' ? imageUrl : '';

  const isOutOfStock = stockCount !== undefined && stockCount <= 0;
  const isLowStock = stockCount !== undefined && stockCount > 0 && stockCount <= 5;

  const handleSaveForLater = async () => {
    if (!user) {
      toast.error('Please sign in to save items to your wishlist');
      router.push('/login');
      return;
    }

    if (!productId) {
      toast.info('Item saved to wishlist');
      setIsSaved(prev => !prev);
      return;
    }

    // Instant Optimistic Update
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    toast.success(nextSaved ? 'Saved to wishlist for later' : 'Removed from wishlist');

    try {
      await toggleWishlist({ productId }).unwrap();
    } catch {
      // Revert if API failed
      setIsSaved(!nextSaved);
      toast.error('Failed to sync wishlist. Please try again.');
    }
  };

  return (
    <div className={`flex gap-3.5 sm:gap-4 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all duration-200 ${
      isOutOfStock 
        ? 'bg-red-50/40 border-red-200/80 shadow-sm' 
        : 'bg-white border-[#E5E2DC]/80 hover:border-gray-300 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]'
    }`}>
      {/* 1. Thumbnail Container */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#F8F7F4] rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden flex-shrink-0 relative flex items-center justify-center group">
        {safeImageUrl ? (
          <img 
            src={safeImageUrl} 
            alt={name} 
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isOutOfStock ? 'opacity-60 grayscale' : ''
            }`}
          />
        ) : (
          <Package className="w-8 h-8 text-gray-300 stroke-[1.5]" />
        )}

        {/* Stock Badge Overlay */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-[#171717]/75 backdrop-blur-[2px] flex items-center justify-center p-1">
            <span className="bg-[#171717] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm tracking-wider text-center leading-tight border border-white/20">
              OUT OF STOCK
            </span>
          </div>
        ) : isLowStock ? (
          <span className="absolute bottom-1 left-1 bg-[#FF5A36] text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
            Only {stockCount} left
          </span>
        ) : null}
      </div>

      {/* 2. Item Info & Controls */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link 
              href={productId ? `/product/${productId}` : '#'} 
              className="font-bold text-[#171717] text-sm line-clamp-1 hover:text-[#FF5A36] transition-colors leading-snug"
            >
              {name}
            </Link>

            {/* Remove Cross Button on top right */}
            <button
              onClick={() => onRemove(id)}
              className="p-1 -mr-1 -mt-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              aria-label="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Variant, SKU, Store Information */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {variantInfo && (
              <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                {variantInfo}
              </span>
            )}
            {storeName && (
              <span className="text-[11px] text-[#6B6B6B]">
                Sold by <span className="font-semibold text-gray-800">{storeName}</span>
              </span>
            )}
          </div>

          {/* Price Row */}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-black text-sm sm:text-base text-[#171717] tabular-nums">
              {formatPrice(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-[#999999] line-through tabular-nums font-medium">
                {formatPrice(originalPrice)}
              </span>
            )}
            {discount && (
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase">
                {discount}
              </span>
            )}
          </div>

          {/* Over-allocation warning if user quantity exceeds available inventory */}
          {stockCount !== undefined && stockCount > 0 && quantity > stockCount && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 w-fit">
              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Only {stockCount} available (Current: {quantity})</span>
            </div>
          )}
        </div>

        {/* 3. Action Row: Stepper + Save for Later */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100/80 gap-2 flex-wrap">
          {/* Tactile Quantity Stepper */}
          <div className="flex items-center border border-[#E5E2DC] rounded-xl bg-[#FAF9F6] overflow-hidden shadow-sm">
            <button 
              onClick={() => quantity > 1 ? onDecrement(id, quantity - 1) : onRemove(id)}
              className="px-2 sm:px-2.5 py-1 text-[#6B6B6B] hover:bg-white hover:text-[#171717] border-r border-[#E5E2DC] transition-colors active:bg-gray-100"
              aria-label={quantity > 1 ? "Decrease quantity" : "Remove from cart"}
            >
              {quantity > 1 ? (
                <Minus className="w-3.5 h-3.5" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              )}
            </button>
            <span className="px-3 sm:px-4 py-1 font-extrabold text-xs sm:text-sm min-w-[36px] text-center text-[#171717] tabular-nums bg-white select-none">
              {quantity}
            </span>
            <button 
              onClick={() => {
                if (isOutOfStock || (stockCount !== undefined && quantity >= stockCount)) {
                  toast.info(`Maximum available stock reached (${stockCount})`);
                  return;
                }
                onIncrement(id, quantity + 1);
              }}
              disabled={isOutOfStock || (stockCount !== undefined && quantity >= stockCount)}
              className={`px-2 sm:px-2.5 py-1 border-l border-[#E5E2DC] transition-colors ${
                isOutOfStock || (stockCount !== undefined && quantity >= stockCount)
                  ? 'opacity-25 cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'text-[#6B6B6B] hover:bg-white hover:text-[#171717] active:bg-gray-100'
              }`}
              title={stockCount !== undefined && quantity >= stockCount ? `Maximum available stock reached (${stockCount})` : 'Increase quantity'}
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save to Wishlist Toggle */}
          <button
            onClick={handleSaveForLater}
            disabled={isWishlisting}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl transition-all ${
              isSaved 
                ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                : 'text-[#6B6B6B] hover:text-[#171717] hover:bg-gray-100'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save for later'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
