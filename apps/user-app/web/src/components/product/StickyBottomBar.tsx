import { Product } from '@/lib/mock/products';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ShoppingCart } from 'lucide-react';

interface StickyBottomBarProps {
  price: number;
  originalPrice?: number;
  discountLabel?: string;
  inStock: boolean;
}

export function StickyBottomBar({ price, originalPrice, discountLabel, inStock }: StickyBottomBarProps) {
  const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-gray-900">{formatPrice(price)}</span>
        </div>
        {(originalPrice || discountLabel) && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {originalPrice && <span className="text-xs text-gray-400 line-through">{formatPrice(originalPrice)}</span>}
            {discountLabel && <span className="text-[10px] font-bold text-[#FF6B00]">{discountLabel}</span>}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          disabled={!inStock}
          className="h-12 px-4 rounded-xl border-gray-200 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-50"
        >
          <ShoppingCart className="w-5 h-5 mr-1" />
          Add to Cart
        </Button>
        <Button 
          disabled={!inStock}
          className="h-12 px-6 rounded-xl bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold disabled:opacity-50"
        >
          <ShoppingBag className="w-5 h-5 mr-1" />
          {inStock ? 'Buy Now' : 'Out of Stock'}
        </Button>
      </div>
    </div>
  );
}
