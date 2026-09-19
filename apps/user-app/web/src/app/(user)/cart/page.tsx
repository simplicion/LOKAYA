'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { updateQuantity, removeFromCart, mergeCart, setCart, clearCart } from '@/lib/features/cartSlice';
import { 
  Heart, 
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
  Check, 
  X, 
  ShoppingBag, 
  Sparkles, 
  AlertTriangle,
  ArrowRight,
  Store,
  Tag
} from 'lucide-react';
import { CartProductCard } from '@/components/cart/CartProductCard';
import { 
  useGetCartQuery, 
  useAddToCartMutation,
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

  const [addToCartAPI] = useAddToCartMutation();
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeFromCartAPI] = useRemoveFromCartMutation();
  const [applyCoupon, { isLoading: isApplyingCoupon }] = useApplyCouponMutation();
  const [removeCoupon, { isLoading: isRemovingCoupon }] = useRemoveCouponMutation();

  // Sync backend cart items into Redux state so badges, bars, and persistence stay in exact synchronization
  useEffect(() => {
    if (!user) return;
    if (cartData) {
      if (cartData.items && cartData.items.length > 0) {
        const validItems = cartData.items
          .filter((item: any) => item.product != null && item.product.id && item.product.isActive !== false)
          .map((item: any) => {
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
              stockCount: item.product?.stockCount ?? item.variant?.stockCount,
              storeId: item.product?.storeId || item.storeId || '',
              storeName: item.product?.store?.name || 'Partner Store',
              image: item.product?.media?.[0]?.url || item.product?.imageUrl || item.image || '',
              variantName: item.variant?.name,
            };
          });
        dispatch(setCart(validItems));
      } else if (cartData.items && cartData.items.length === 0) {
        // Backend cart is empty (e.g. database wipe or checkout) -> clear Redux cart immediately
        dispatch(setCart([]));
      }
    }
  }, [user, cartData, dispatch]);

  // Auto-sync any unsynced Redux items to backend cart when logged in, automatically purging unavailable products
  const syncingRef = React.useRef(false);
  useEffect(() => {
    if (!user || isCartLoading || syncingRef.current || reduxItems.length === 0) return;
    const unsyncedItems = reduxItems.filter((rItem: any) => {
      const pId = rItem.productId || rItem.id;
      return !cartData?.items?.some((bItem: any) => bItem.productId === pId);
    });

    if (unsyncedItems.length > 0) {
      syncingRef.current = true;
      Promise.all(
        unsyncedItems.map((item: any) => 
          addToCartAPI({
            productId: item.productId || item.id,
            variantId: item.variantId,
            quantity: item.quantity || 1
          }).unwrap().catch((e) => {
            console.warn('[Cart] sync item error (purging dead/unavailable product):', e);
            // Product unavailable or deleted from database -> automatically purge from Redux cart
            dispatch(removeFromCart(item.id));
            if (item.productId) dispatch(removeFromCart(item.productId));
            toast.info(`"${item.name || 'Product'}" is no longer available and was removed from your bag.`);
          })
        )
      ).finally(() => {
        syncingRef.current = false;
      });
    }
  }, [user, isCartLoading, cartData, reduxItems, addToCartAPI, dispatch]);

  // Unified items resolution:
  // For logged in users: authoritative backend cart data is used.
  // For guest users: client-side Redux cart is used.
  const items = useMemo(() => {
    if (user) {
      if (!isCartLoading && cartData) {
        return (cartData.items || [])
          .filter((item: any) => item.product != null && item.product.id && item.product.isActive !== false)
          .map((item: any) => {
            const originalPrice = item.product?.mrp || item.product?.originalPrice || item.variant?.price || item.product?.sellingPrice || 0;
            const sellingPrice = item.variant?.price ?? item.product?.sellingPrice ?? item.priceAt ?? 0;
            return {
              id: item.id,
              cartItemId: item.id,
              productId: item.productId,
              variantId: item.variantId,
              name: item.product?.name || item.productName || 'Product',
              price: sellingPrice,
              originalPrice: originalPrice > sellingPrice ? originalPrice : sellingPrice,
              quantity: item.quantity,
              stockCount: item.product?.stockCount ?? item.variant?.stockCount,
              storeId: item.product?.storeId || item.storeId || '',
              storeName: item.product?.store?.name || 'Partner Store',
              imageUrl: item.product?.media?.[0]?.url || item.product?.imageUrl || item.image || '',
              variantInfo: item.variant?.name,
            };
          });
      }
    }

    // Guest users (or initial render before cartData arrives)
    return reduxItems.map((item: any) => {
      const originalPrice = item.originalPrice || item.price;
      return {
        id: item.id,
        cartItemId: (item as any).cartItemId || undefined,
        productId: item.productId || item.id,
        variantId: item.variantId,
        name: item.name || 'Product',
        price: item.price || 0,
        originalPrice: originalPrice > item.price ? originalPrice : item.price,
        quantity: item.quantity || 1,
        stockCount: item.stockCount,
        storeId: item.storeId || '',
        storeName: item.storeName || 'Partner Store',
        imageUrl: item.image || (item as any).imageUrl || '',
        variantInfo: item.variantName,
      };
    });
  }, [user, isCartLoading, cartData, reduxItems]);

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
    const backendItem = cartData?.items?.find((i: any) => i.id === itemId || i.productId === itemId);
    if (user && backendItem) {
      try {
        await updateCartItem({ itemId: backendItem.id, quantity: newQty }).unwrap();
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
    const backendItem = cartData?.items?.find((i: any) => i.id === itemId || i.productId === itemId);
    if (user && backendItem) {
      try {
        await updateCartItem({ itemId: backendItem.id, quantity: newQty }).unwrap();
      } catch (err) {
        // Redux updated optimistically
      }
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemove(itemId);
      return;
    }
    dispatch(updateQuantity({ id: itemId, quantity: newQty }));
    const backendItem = cartData?.items?.find((i: any) => i.id === itemId || i.productId === itemId);
    if (user && backendItem) {
      try {
        await updateCartItem({ itemId: backendItem.id, quantity: newQty }).unwrap();
      } catch (err) {
        // Redux updated optimistically
      }
    }
  };

  const handleRemove = async (itemId: string) => {
    dispatch(removeFromCart(itemId));
    toast.success('Item removed from bag');
    const backendItem = cartData?.items?.find((i: any) => i.id === itemId || i.productId === itemId);
    if (user && backendItem) {
      try {
        await removeFromCartAPI(backendItem.id).unwrap();
      } catch (err) {
        // Redux updated optimistically
      }
    }
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    toast.success('Cart cleared');
  };

  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = (codeToApply || couponCode).trim().toUpperCase();
    if (!targetCode) return;
    try {
      await applyCoupon(targetCode).unwrap();
      toast.success(`Coupon ${targetCode} applied successfully!`);
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

  // Check for any invalid inventory items (out of stock OR quantity exceeds stock)
  const invalidStockItems = useMemo(() => {
    return items.filter((i: any) => i.stockCount !== undefined && (i.stockCount <= 0 || i.quantity > i.stockCount));
  }, [items]);

  const outOfStockCount = items.filter((i: any) => i.stockCount !== undefined && i.stockCount <= 0).length;
  const overAllocatedCount = items.filter((i: any) => i.stockCount !== undefined && i.stockCount > 0 && i.quantity > i.stockCount).length;

  const handleAutoAdjustStock = () => {
    invalidStockItems.forEach((item: any) => {
      if (item.stockCount <= 0) {
        handleRemove(item.id);
      } else if (item.quantity > item.stockCount) {
        handleUpdateQuantity(item.id, item.stockCount);
      }
    });
    toast.success('Bag automatically adjusted to available stock');
  };

  if (isCartLoading && user && reduxItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-[#FAF9F6]">
        <div className="w-10 h-10 border-4 border-[#FF5A36] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">Loading your bag...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 text-center bg-[#FAF9F6]">
        <div className="w-24 h-24 bg-white border border-[#E5E2DC] rounded-3xl flex items-center justify-center mb-5 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-[#FF5A36]" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#171717] mb-2 tracking-tight">Your bag is empty</h2>
        <p className="text-[#6B6B6B] text-sm max-w-sm mb-8 leading-relaxed">
          Discover unique handcrafted apparel, pottery, and jewelry sourced directly from verified local artisans across India.
        </p>
        <button 
          onClick={() => router.push('/explore')} 
          className="bg-[#FF5A36] text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-[#e04d2d] transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2 text-sm"
        >
          <span>Explore Artisan Collections</span>
          <ArrowRight className="w-4 h-4" />
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
        storeName: item.storeName || 'Verified Artisan Store',
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

  // Popular Promo Codes for 1-Tap Apply
  const curatedCoupons = [
    { code: 'FIRST50', title: '50% OFF', desc: 'First time buyer special' },
    { code: 'ARTISAN20', title: '₹200 FLAT OFF', desc: 'On orders above ₹999' },
    { code: 'FESTIVE10', title: '10% OFF', desc: 'Instant sitewide savings' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] pb-32">
      {/* 1. Sticky Glassmorphic Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[#E5E2DC] sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors -ml-1 border border-gray-200/60 active:scale-95"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="font-extrabold text-base text-[#171717] tracking-tight flex items-center gap-2">
              My Bag 
              <span className="text-xs font-bold text-[#FF5A36] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 tabular-nums">
                {items.reduce((sum: number, i: any) => sum + i.quantity, 0)} items
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push('/wishlist')}
              className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors border border-gray-200/60 active:scale-95"
              title="Saved Wishlist"
            >
              <Heart className="w-4 h-4 text-gray-700 hover:text-rose-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 py-5 grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
        
        {/* Left Column: Cart Items & Groups */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Inventory Warning Banner (if any item has 0 stock or exceeds available inventory) */}
          {invalidStockItems.length > 0 && (
            <div className="bg-red-50/90 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 text-xs text-red-900 font-semibold">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <p className="font-bold text-red-950 text-xs">Inventory attention needed</p>
                  <p className="text-[11px] text-red-800/90 mt-0.5">
                    {outOfStockCount > 0 && `${outOfStockCount} item(s) out of stock. `}
                    {overAllocatedCount > 0 && `${overAllocatedCount} item(s) exceed available inventory.`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAutoAdjustStock}
                className="bg-[#171717] hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl shrink-0 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Auto-Adjust Bag</span>
              </button>
            </div>
          )}

          {/* Free Delivery Gamified Progress Banner */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[#E5E2DC] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-[#171717] font-semibold flex items-center gap-1.5">
                {isFreeDelivery ? (
                  <span className="text-[#16845B] font-extrabold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#16845B]" /> 
                    You've unlocked FREE Express Delivery!
                  </span>
                ) : (
                  <>
                    Add <span className="font-extrabold text-[#FF5A36]">₹{amountForFreeDelivery.toLocaleString('en-IN')}</span> more for <span className="text-[#16845B] font-extrabold">FREE Delivery</span>
                  </>
                )}
              </p>
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#6B6B6B] bg-[#FAF9F6] px-2 py-0.5 rounded-lg border border-[#E5E2DC]">
                <Truck className="w-3.5 h-3.5 text-[#FF5A36]" />
                <span>₹999 threshold</span>
              </div>
            </div>
            
            <div className="w-full h-2 bg-[#F2EFE9] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF5A36] to-[#16845B] rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%` }}
              />
            </div>
          </div>

          {/* Store Groups */}
          {Object.entries(itemsByStore).map(([storeId, storeGroup]) => (
            <div key={storeId} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] border border-[#E5E2DC]">
              {/* Store Header */}
              <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-[#171717] rounded-xl flex items-center justify-center text-white font-black text-[11px] uppercase shadow-sm">
                    {storeGroup.storeName.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#171717] text-sm tracking-tight">{storeGroup.storeName}</h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#16845B]">
                      <Check className="w-3 h-3" />
                      Verified Artisan Partner
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-gray-500 bg-[#FAF9F6] px-2.5 py-1 rounded-full border border-[#E5E2DC]">
                  {storeGroup.items.length} {storeGroup.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3">
                {storeGroup.items.map((item: any) => {
                  const discountPercent = item.originalPrice > item.price 
                    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                    : 0;
                  return (
                    <CartProductCard
                      key={item.id}
                      id={item.id}
                      productId={item.productId}
                      name={item.name}
                      variantInfo={item.variantInfo}
                      price={item.price}
                      originalPrice={item.originalPrice}
                      discount={discountPercent > 0 ? `${discountPercent}% OFF` : undefined}
                      imageUrl={item.imageUrl}
                      quantity={item.quantity}
                      stockCount={item.stockCount}
                      storeName={item.storeName}
                      onIncrement={(id) => handleIncrement(id, item.quantity)}
                      onDecrement={(id) => handleDecrement(id, item.quantity)}
                      onRemove={(id) => handleRemove(id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick-Action Deliver to Preview */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] border border-[#E5E2DC]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF5A36]" />
                <h3 className="font-extrabold text-sm text-[#171717]">Delivery Address</h3>
              </div>
              <button 
                onClick={() => router.push(user ? '/checkout' : '/login?redirect=/checkout')}
                className="text-[#FF5A36] text-xs font-bold hover:underline"
              >
                {defaultAddress ? 'Change' : '+ Add Address'}
              </button>
            </div>
            {defaultAddress ? (
              <div className="flex items-start justify-between bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E5E2DC]">
                <div className="text-xs text-[#6B6B6B] leading-relaxed">
                  <span className="font-extrabold text-[#171717] block text-sm mb-0.5">{defaultAddress.name}</span>
                  {defaultAddress.addressLine1}
                  {defaultAddress.addressLine2 ? `, ${defaultAddress.addressLine2}` : ''}, {defaultAddress.city} - {defaultAddress.pincode}
                  <span className="block font-semibold text-gray-700 mt-1">Ph: {defaultAddress.phone}</span>
                </div>
                <span className="bg-emerald-50 text-[#16845B] border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">
                  Default
                </span>
              </div>
            ) : (
              <div className="p-3 bg-orange-50/70 border border-orange-100 rounded-2xl text-xs text-orange-900 font-medium">
                No delivery address selected. You can select or add a new address at checkout.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Order Summary, Coupons & Security */}
        <div className="space-y-5">
          
          {/* 1. Interactive Coupons & Promo Codes */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] border border-[#E5E2DC]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#FF5A36]" />
                <h3 className="font-extrabold text-sm text-[#171717]">Coupons & Offers</h3>
              </div>
            </div>

            {cartData?.coupon ? (
              <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-900 tracking-wider uppercase font-mono">
                      {cartData.coupon.code}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      {cartData.coupon.discountType === 'PERCENTAGE'
                        ? `${cartData.coupon.discountValue}% discount applied`
                        : `₹${cartData.coupon.discountValue} flat discount applied`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleRemoveCoupon} 
                  disabled={isRemovingCoupon}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                  title="Remove coupon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <form onSubmit={(e) => { e.preventDefault(); handleApplyCoupon(); }} className="flex gap-2">
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code" 
                    className="flex-1 bg-[#FAF9F6] border border-[#E5E2DC] rounded-xl px-3.5 py-2 text-xs font-bold text-[#171717] focus:outline-none focus:border-[#FF5A36] focus:bg-white uppercase transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={!couponCode.trim() || isApplyingCoupon}
                    className="bg-[#171717] hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shrink-0"
                  >
                    {isApplyingCoupon ? '...' : 'Apply'}
                  </button>
                </form>

                {/* Curated 1-Tap Promo Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Available Offers
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {curatedCoupons.map((c) => (
                      <div 
                        key={c.code}
                        className="flex items-center justify-between p-2.5 bg-[#FAF9F6] border border-[#E5E2DC] rounded-xl text-xs hover:border-[#FF5A36]/40 transition-colors"
                      >
                        <div>
                          <span className="font-mono font-extrabold text-[#171717] text-[11px] block">{c.code}</span>
                          <span className="text-[10px] text-[#6B6B6B]">{c.desc}</span>
                        </div>
                        <button
                          onClick={() => handleApplyCoupon(c.code)}
                          disabled={isApplyingCoupon}
                          className="text-[#FF5A36] font-extrabold text-xs hover:underline shrink-0"
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Detailed Bill Breakdown */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] border border-[#E5E2DC]">
            <h3 className="font-extrabold text-sm text-[#171717] mb-4">Price Breakdown</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Items Subtotal ({items.reduce((sum: number, i: any) => sum + i.quantity, 0)} items)</span>
                <span className="text-[#171717] font-bold tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-[#16845B]">
                  <span>Product Savings</span>
                  <span className="font-bold tabular-nums">- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between text-[#16845B]">
                  <span>Coupon Discount</span>
                  <span className="font-bold tabular-nums">- ₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#6B6B6B]">
                <span className="flex items-center gap-1">
                  Delivery Fee <Info className="w-3 h-3 text-gray-400" />
                </span>
                <div className="flex gap-1.5 items-center">
                  {isFreeDelivery ? (
                    <>
                      <span className="line-through text-[11px] text-gray-400 tabular-nums">₹49</span>
                      <span className="text-[#16845B] font-extrabold">FREE</span>
                    </>
                  ) : (
                    <span className="text-[#171717] font-bold tabular-nums">₹49</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-[#E5E2DC] my-3.5 pt-3.5 flex justify-between items-center">
              <span className="font-extrabold text-sm text-[#171717]">Total Payable</span>
              <span className="font-black text-[#171717] text-xl tabular-nums">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            {totalSaved > 0 && (
              <div className="text-[#16845B] text-xs font-extrabold text-center bg-emerald-50/80 py-2.5 rounded-xl border border-emerald-200/80 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#16845B]" />
                <span>You are saving ₹{totalSaved.toLocaleString('en-IN')} on this order!</span>
              </div>
            )}
          </div>
          
          {/* 3. Trust & Authenticity Badges */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] border border-[#E5E2DC]">
            <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider mb-3.5">
              Lokaya Buyer Protection
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2 bg-[#FAF9F6] rounded-xl border border-[#E5E2DC]">
                <RotateCcw className="w-4 h-4 text-[#FF5A36] shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-[#171717]">7-Day Returns</h4>
                  <p className="text-[9px] text-[#6B6B6B]">Doorstep pickup</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#FAF9F6] rounded-xl border border-[#E5E2DC]">
                <ShieldCheck className="w-4 h-4 text-[#16845B] shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-[#171717]">100% Genuine</h4>
                  <p className="text-[9px] text-[#6B6B6B]">Direct from artisan</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#FAF9F6] rounded-xl border border-[#E5E2DC]">
                <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-[#171717]">Secure UPI</h4>
                  <p className="text-[9px] text-[#6B6B6B]">256-bit encrypted</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#FAF9F6] rounded-xl border border-[#E5E2DC]">
                <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-bold text-[#171717]">Live Tracking</h4>
                  <p className="text-[9px] text-[#6B6B6B]">Shiprocket 3PL</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Thumb-Friendly Floating / Docked Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E5E2DC] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-30">
        <div className="max-w-6xl mx-auto w-full px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-xl sm:text-2xl text-[#171717] tabular-nums leading-none">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#6B6B6B] mt-0.5">
              {items.reduce((sum: number, i: any) => sum + i.quantity, 0)} items in bag
            </span>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={invalidStockItems.length > 0}
            className={`px-6 sm:px-8 py-3.5 rounded-2xl font-extrabold text-sm text-white flex items-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
              invalidStockItems.length > 0
                ? 'bg-gray-400 cursor-not-allowed shadow-none'
                : 'bg-[#FF5A36] hover:bg-[#e04d2d] shadow-orange-500/25'
            }`}
          >
            <span>{invalidStockItems.length > 0 ? 'Fix Inventory to Checkout' : 'Proceed to Checkout'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
