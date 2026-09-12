'use client';

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { closeCartDrawer, updateQuantity, removeFromCart } from '@/lib/features/cartSlice';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  X, 
  ShoppingBag, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Store as StoreIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FloatingCartModal() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isDrawerOpen, items, lastAddedItem } = useSelector((state: RootState) => state.cart);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  // Active display item: either the last added item or the first cart item
  const displayItem = lastAddedItem || items[items.length - 1];
  const totalItemsCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  const handleClose = () => {
    dispatch(closeCartDrawer());
  };

  const handleViewCart = () => {
    dispatch(closeCartDrawer());
    router.push('/cart');
  };

  const handleProceedToCheckout = () => {
    dispatch(closeCartDrawer());
    router.push('/checkout');
  };

  const handleIncrement = (id: string, currentQty: number) => {
    dispatch(updateQuantity({ id, quantity: currentQty + 1 }));
  };

  const handleDecrement = (id: string, currentQty: number) => {
    if (currentQty <= 1) {
      dispatch(removeFromCart(id));
    } else {
      dispatch(updateQuantity({ id, quantity: currentQty - 1 }));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Slide-up Container */}
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 ease-out border-t border-gray-100 flex flex-col max-h-[88vh]">
        
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab" onClick={handleClose}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm tracking-tight">Added to Bag</h3>
              <p className="text-[11px] font-medium text-gray-500">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in your shopping bag
              </p>
            </div>
          </div>

          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {displayItem ? (
            <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100/80 flex items-center gap-3.5 relative">
              {/* Product Thumbnail */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-gray-200/80 flex-shrink-0 relative shadow-sm">
                {displayItem.image ? (
                  <Image 
                    src={displayItem.image}
                    alt={displayItem.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0 pr-1">
                {displayItem.storeName && (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 mb-0.5 truncate">
                    <StoreIcon className="w-3 h-3 text-[#FF6B00]" />
                    <span className="truncate">{displayItem.storeName}</span>
                  </div>
                )}
                
                <h4 className="text-sm font-bold text-gray-900 truncate leading-snug">
                  {displayItem.name}
                </h4>

                {displayItem.variantName && (
                  <span className="inline-block mt-1 text-[10px] font-semibold text-gray-600 bg-gray-200/70 px-2 py-0.5 rounded-md">
                    {displayItem.variantName}
                  </span>
                )}

                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-sm font-black text-gray-900">
                    ₹{(displayItem.price * displayItem.quantity).toLocaleString('en-IN')}
                    {displayItem.quantity > 1 && (
                      <span className="text-[11px] font-normal text-gray-500 ml-1">
                        (₹{displayItem.price.toLocaleString('en-IN')} each)
                      </span>
                    )}
                  </span>

                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <button
                      onClick={() => handleDecrement(displayItem.id, displayItem.quantity)}
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
                      aria-label="Decrease quantity"
                    >
                      {displayItem.quantity === 1 ? (
                        <Trash2 className="w-3 h-3 text-red-500" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                    </button>
                    <span className="w-7 text-center font-bold text-xs text-gray-900">
                      {displayItem.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrement(displayItem.id, displayItem.quantity)}
                      className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium">Your bag is empty</p>
            </div>
          )}

          {/* Multiple items notice if cart has > 1 item */}
          {items.length > 1 && (
            <div className="px-3 py-2 bg-orange-50/60 rounded-xl border border-orange-100 flex items-center justify-between text-xs">
              <span className="text-gray-700 font-medium">
                + {items.length - 1} other {items.length - 1 === 1 ? 'item' : 'items'} in bag
              </span>
              <button 
                onClick={handleViewCart}
                className="font-bold text-[#FF6B00] hover:underline flex items-center gap-0.5 text-xs"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Free Shipping & Trust Badge */}
          <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 rounded-2xl border border-emerald-500/20 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900">Free Express Delivery</p>
              <p className="text-[10px] text-gray-600">On all prepaid orders with live tracking</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          </div>
        </div>

        {/* Footer & Actions */}
        <div className="p-5 border-t border-gray-100 bg-white space-y-3 shadow-lg">
          {/* Subtotal breakdown */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium">Bag Subtotal</span>
            <div className="text-right">
              <span className="text-base font-black text-gray-900">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
              <span className="block text-[10px] text-emerald-600 font-semibold">Taxes included</span>
            </div>
          </div>

          {/* Dual CTAs */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              variant="outline"
              onClick={handleViewCart}
              className="h-12 rounded-xl font-bold text-gray-800 border-gray-300 hover:bg-gray-50 active:scale-95 transition-all text-xs"
            >
              View Bag ({totalItemsCount})
            </Button>

            <Button
              onClick={handleProceedToCheckout}
              className="h-12 rounded-xl font-bold bg-[#FF6B00] hover:bg-[#ff7a1f] text-white active:scale-95 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 text-xs tracking-wide uppercase"
            >
              <span>Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
