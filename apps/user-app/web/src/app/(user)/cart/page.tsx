'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { updateQuantity, removeFromCart } from '@/lib/features/cartSlice';
import { 
  Heart, 
  Bell, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Minus, 
  Plus, 
  MapPin, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  RotateCcw,
  Ticket,
  Info,
  ChevronUp,
  Check,
  X,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { CartProductCard } from '@/components/cart/CartProductCard';
import { 
  useGetCartQuery, 
  useUpdateCartItemMutation, 
  useRemoveFromCartMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation,
  useGetAddressesQuery
} from '@/lib/api';
import { toast } from 'sonner';

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => (state as any).auth?.user);
  const reduxCart = useSelector((state: RootState) => state.cart);
  const reduxItems = reduxCart.items || [];
  const [couponCode, setCouponCode] = useState('');

  const { data: cartData, isLoading: isCartLoading } = useGetCartQuery(undefined, {
    skip: !user
  });
  
  const { data: addresses = [] } = useGetAddressesQuery(undefined, {
    skip: !user
  });
  const defaultAddress = addresses.find((a: any) => a.isDefault) || addresses[0];

  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeFromCartAPI] = useRemoveFromCartMutation();
  const [applyCoupon, { isLoading: isApplyingCoupon }] = useApplyCouponMutation();
  const [removeCoupon, { isLoading: isRemovingCoupon }] = useRemoveCouponMutation();

  // Unified items resolution: combine or fallback between backend cart and Redux state
  const items = useMemo(() => {
    if (cartData?.items && cartData.items.length > 0) {
      return cartData.items.map((item: any) => {
        const originalPrice = item.product?.mrp || item.product?.originalPrice || item.variant?.price || item.product?.sellingPrice || 0;
        const sellingPrice = item.variant?.price ?? item.product?.sellingPrice ?? item.priceAt ?? 0;
        return {
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.product?.name || item.productName || 'Product',
          price: sellingPrice,
          originalPrice: originalPrice > sellingPrice ? originalPrice : sellingPrice,
          quantity: item.quantity,
          storeId: item.product?.storeId || item.storeId || 'store-main',
          storeName: item.product?.store?.name || 'Partner Store',
          imageUrl: item.product?.media?.[0]?.url || item.product?.imageUrl || item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
          variantInfo: item.variant?.name,
        };
      });
    }

    // Fallback to client-side Redux cart items
    return reduxItems.map((item: any) => {
      const originalPrice = item.originalPrice || item.price;
      return {
        id: item.id,
        productId: item.productId || item.id,
        variantId: item.variantId,
        name: item.name || 'Product',
        price: item.price || 0,
        originalPrice: originalPrice > item.price ? originalPrice : item.price,
        quantity: item.quantity || 1,
        storeId: item.storeId || 'store-main',
        storeName: item.storeName || 'Partner Store',
        imageUrl: item.image || item.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        variantInfo: item.variantName,
      };
    });
  }, [cartData, reduxItems]);

  const handleCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const handleIncrement = async (itemId: string, currentQuantity: number) => {
    const newQty = currentQuantity + 1;
    dispatch(updateQuantity({ id: itemId, quantity: newQty }));
    if (user && cartData?.items?.some((i: any) => i.id === itemId)) {
      try {
        await updateCartItem({ itemId, quantity: newQty }).unwrap();
      } catch (err) {
        // Redux updated optimistically
      }
    }
  };

  const handleDecrement = async (itemId: string, currentQuantity: number) => {
    const newQty = currentQuantity - 1;
    if (newQty <= 0) {
      handleRemove(itemId);
      return;
    }
    dispatch(updateQuantity({ id: itemId, quantity: newQty }));
    if (user && cartData?.items?.some((i: any) => i.id === itemId)) {
      try {
        await updateCartItem({ itemId, quantity: newQty }).unwrap();
      } catch (err) {
        // Redux updated optimistically
      }
    }
  };

  const handleRemove = async (itemId: string) => {
    dispatch(removeFromCart(itemId));
    toast.success('Item removed from bag');
    if (user && cartData?.items?.some((i: any) => i.id === itemId)) {
      try {
        await removeFromCartAPI(itemId).unwrap();
      } catch (err) {
        // Redux updated optimistically
      }
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      await applyCoupon(couponCode).unwrap();
      toast.success('Coupon applied successfully!');
      setCouponCode('');
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to apply coupon');
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon().unwrap();
      toast.success('Coupon removed');
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to remove coupon');
    }
  };

  if (isCartLoading && user && reduxItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-4 border-[#FF5A36] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Loading your bag...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-24 h-24 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <ShoppingBag className="w-10 h-10 text-[#FF5A36]" />
        </div>
        <h2 className="text-xl font-bold text-[#171717] mb-2">Your bag is empty</h2>
        <p className="text-gray-500 text-sm max-w-xs mb-6">Looks like you haven't added anything to your cart yet.</p>
        <button 
          onClick={() => router.push('/search')} 
          className="bg-[#FF5A36] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#e04d2d] transition-all shadow-md shadow-orange-500/20 active:scale-95"
        >
          Explore Trending Products
        </button>
      </div>
    );
  }

  // Group items by store
  const itemsByStore: Record<string, { storeName: string; items: any[] }> = {};
  items.forEach((item: any) => {
    const storeId = item.storeId || 'store-main';
    if (!itemsByStore[storeId]) {
      itemsByStore[storeId] = {
        storeName: item.storeName || `Store ${storeId.substring(0, 6)}`,
        items: []
      };
    }
    itemsByStore[storeId].items.push(item);
  });

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const totalOriginalPrice = items.reduce((sum: number, item: any) => sum + (item.originalPrice * item.quantity), 0);
  const discountAmount = Math.max(0, totalOriginalPrice - subtotal);
  
  let couponDiscount = 0;
  if (cartData?.coupon) {
    if (cartData.coupon.discountType === 'PERCENTAGE') {
      couponDiscount = subtotal * (cartData.coupon.discountValue / 100);
      if (cartData.coupon.maxDiscount && couponDiscount > cartData.coupon.maxDiscount) {
        couponDiscount = cartData.coupon.maxDiscount;
      }
    } else {
      couponDiscount = cartData.coupon.discountValue;
    }
  }

  const freeDeliveryThreshold = 999;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;
  const amountForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const deliveryCharges = isFreeDelivery ? 0 : 49;
  const totalAmount = Math.max(0, subtotal - couponDiscount + deliveryCharges);
  const totalSaved = discountAmount + couponDiscount + (isFreeDelivery ? 49 : 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] pb-32">
      {/* Sticky Cart Header */}
      <div className="bg-white border-b border-[#E5E2DC] sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.back()} 
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors -ml-1"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-extrabold text-base text-gray-900 tracking-tight flex items-center gap-2">
              My Cart <span className="text-[#6B6B6B] font-semibold text-sm">({items.reduce((sum: number, i: any) => sum + i.quantity, 0)})</span>
            </h1>
          </div>
          <button 
            onClick={() => router.push('/wishlist')}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
            title="Wishlist"
          >
            <Heart className="w-4 h-4 text-gray-700 hover:text-rose-500 transition-colors" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column: Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Free Delivery Progress Banner */}
          <div className="bg-white rounded-3xl p-5 border border-[#E5E2DC] shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-sm text-[#171717] font-medium">
                {isFreeDelivery ? (
                  <span className="text-[#16845B] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> You've unlocked FREE Delivery on this order!
                  </span>
                ) : (
                  <>
                    Add <span className="font-bold text-[#FF5A36]">₹{amountForFreeDelivery.toLocaleString('en-IN')}</span> more for <span className="text-[#16845B] font-bold">FREE delivery</span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#6B6B6B]">
                <Truck className="w-3.5 h-3.5 text-[#FF5A36]" />
                <span>₹999 threshold</span>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF5A36] to-[#16845B] rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%` }}
              />
            </div>
          </div>

          {/* Store Groups */}
          {Object.entries(itemsByStore).map(([storeId, storeGroup]) => (
            <div key={storeId} className="bg-white rounded-3xl p-5 shadow-sm border border-[#E5E2DC]">
              {/* Store Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#171717] rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                    {storeGroup.storeName.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#171717] text-sm">{storeGroup.storeName}</h3>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#16845B] mt-0.5">
                      <Check className="w-3 h-3" />
                      Verified Artisan Store
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                  {storeGroup.items.length} {storeGroup.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Cart Items */}
              <div className="space-y-4 divide-y divide-gray-50">
                {storeGroup.items.map((item: any) => {
                  const discountPercent = item.originalPrice > item.price 
                    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                    : 0;
                  return (
                    <div key={item.id} className="pt-3 first:pt-0">
                      <CartProductCard
                        id={item.id}
                        name={item.name}
                        variantInfo={item.variantInfo}
                        price={item.price}
                        originalPrice={item.originalPrice}
                        discount={discountPercent > 0 ? `${discountPercent}% OFF` : undefined}
                        imageUrl={item.imageUrl}
                        quantity={item.quantity}
                        onIncrement={(id) => handleIncrement(id, item.quantity)}
                        onDecrement={(id) => handleDecrement(id, item.quantity)}
                        onRemove={(id) => handleRemove(id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        </div>

        {/* Right Column: Order Summary & Info */}
        <div className="space-y-6">
          
          {/* Coupon Code Section */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E2DC]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#171717]">Apply Coupon</h3>
              <Ticket className="w-5 h-5 text-[#6B6B6B]" />
            </div>
            {cartData?.coupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-green-700 uppercase">{cartData.coupon.code}</p>
                  <p className="text-xs text-green-600 font-medium mt-0.5">Coupon applied successfully</p>
                </div>
                <button 
                  onClick={handleRemoveCoupon} 
                  disabled={isRemovingCoupon}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input 
                  type="text" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code" 
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36] uppercase transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!couponCode.trim() || isApplyingCoupon}
                  className="bg-[#171717] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isApplyingCoupon ? '...' : 'Apply'}
                </button>
              </form>
            )}
          </div>

          {/* Price Details Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E2DC]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#171717]">Price Details</h3>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Subtotal ({items.reduce((sum: number, i: any) => sum + i.quantity, 0)} items)</span>
                <span className="text-[#171717] font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#16845B]">Product Discount</span>
                  <span className="text-[#16845B] font-bold">- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#16845B]">Coupon Discount</span>
                  <span className="text-[#16845B] font-bold">- ₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[#6B6B6B]">
                <span className="flex items-center gap-1">Delivery Charges <Info className="w-3.5 h-3.5" /></span>
                <div className="flex gap-2 items-center">
                  {isFreeDelivery ? (
                    <>
                      <span className="line-through text-xs text-gray-400">₹49</span>
                      <span className="text-[#16845B] font-bold">FREE</span>
                    </>
                  ) : (
                    <span className="text-[#171717] font-bold">₹49</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 my-4 pt-4 flex justify-between items-center">
              <span className="font-bold text-[#171717]">Total Amount</span>
              <span className="font-black text-[#171717] text-xl">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            {totalSaved > 0 && (
              <p className="text-[#16845B] text-xs font-bold text-center bg-green-50 py-2.5 rounded-xl border border-green-100">
                🎉 You will save ₹{totalSaved.toLocaleString('en-IN')} on this order!
              </p>
            )}
          </div>

          {/* Deliver To Card (Live Addresses) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E2DC]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#171717]">Deliver to</h3>
              <button 
                onClick={() => router.push(user ? '/checkout' : '/login?redirect=/checkout')}
                className="text-[#FF5A36] text-xs font-bold hover:underline"
              >
                {defaultAddress ? 'Change' : 'Add Address'}
              </button>
            </div>
            {defaultAddress ? (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#FF5A36] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-[#171717] text-sm">{defaultAddress.name}</h4>
                  <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
                    {defaultAddress.addressLine1}
                    {defaultAddress.addressLine2 ? `, ${defaultAddress.addressLine2}` : ''}
                    <br/>
                    {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}
                  </p>
                  <p className="text-xs text-[#6B6B6B] mt-1 font-medium">{defaultAddress.phone}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-orange-50/60 rounded-2xl border border-orange-100">
                <MapPin className="w-5 h-5 text-[#FF5A36] flex-shrink-0" />
                <div className="text-xs text-gray-600">
                  <span className="font-bold text-[#171717] block">No address selected</span>
                  Address will be confirmed at checkout
                </div>
              </div>
            )}
          </div>
          
          {/* Trust Badges */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E2DC]">
            <h3 className="font-bold text-[#171717] mb-5">Why shop with Lokaya?</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <RotateCcw className="w-5 h-5 text-[#FF5A36] flex-shrink-0" strokeWidth={1.75} />
                <div>
                  <h4 className="text-xs font-bold text-[#171717]">7 Days Easy Returns</h4>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">Hassle-free direct doorstep returns</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-[#16845B] flex-shrink-0" strokeWidth={1.75} />
                <div>
                  <h4 className="text-xs font-bold text-[#171717]">100% Authentic Products</h4>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">Sourced directly from verified local artisans</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CreditCard className="w-5 h-5 text-indigo-600 flex-shrink-0" strokeWidth={1.75} />
                <div>
                  <h4 className="text-xs font-bold text-[#171717]">Secure Razorpay Payments</h4>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">UPI, Cards, NetBanking with 256-bit encryption</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Truck className="w-5 h-5 text-amber-600 flex-shrink-0" strokeWidth={1.75} />
                <div>
                  <h4 className="text-xs font-bold text-[#171717]">Shiprocket 3PL Logistics</h4>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">Real-time live AWB tracking to your doorstep</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E2DC] shadow-[0_-4px_25px_rgba(0,0,0,0.08)] z-20">
        <div className="max-w-6xl mx-auto w-full px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-black text-xl text-[#171717] leading-none">₹{totalAmount.toLocaleString('en-IN')}</span>
              <span className="text-[11px] font-bold text-[#6B6B6B] mt-1">
                {items.reduce((sum: number, i: any) => sum + i.quantity, 0)} items in bag
              </span>
            </div>
            {totalSaved > 0 && (
              <div className="flex flex-col text-[10px] font-bold text-[#16845B] leading-tight mt-0.5 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                <span>Total Savings</span>
                <span>₹{totalSaved.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleCheckout}
            className="bg-[#FF5A36] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-[#e04d2d] transition-all shadow-md shadow-orange-500/20 active:scale-95 min-w-[160px] justify-center"
          >
            <span>Proceed to Checkout</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
