'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import { 
  Heart, 
  Bell, 
  Trash2, 
  ChevronRight, 
  Minus, 
  Plus, 
  Bookmark, 
  MapPin, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  RotateCcw,
  Ticket,
  Info,
  ChevronUp,
  Check,
  X
} from 'lucide-react';
import { CartProductCard } from '@/components/cart/CartProductCard';
import { 
  useGetCartQuery, 
  useUpdateCartItemMutation, 
  useRemoveFromCartMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation
} from '@/lib/api';

export default function CartPage() {
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const [couponCode, setCouponCode] = useState('');

  const { data: cartData, isLoading, refetch } = useGetCartQuery(undefined, {
    skip: !user
  });
  
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeFromCart] = useRemoveFromCartMutation();
  const [applyCoupon, { isLoading: isApplyingCoupon }] = useApplyCouponMutation();
  const [removeCoupon, { isLoading: isRemovingCoupon }] = useRemoveCouponMutation();

  const handleCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/cart');
    } else {
      router.push('/checkout');
    }
  };

  const handleIncrement = async (itemId: string, newQuantity: number) => {
    await updateCartItem({ itemId, quantity: newQuantity });
  };

  const handleDecrement = async (itemId: string, newQuantity: number) => {
    await updateCartItem({ itemId, quantity: newQuantity });
  };

  const handleRemove = async (itemId: string) => {
    await removeFromCart(itemId);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      await applyCoupon(couponCode).unwrap();
      setCouponCode('');
    } catch (err: any) {
      alert(err.data?.message || 'Failed to apply coupon');
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon().unwrap();
    } catch (err: any) {
      alert(err.data?.message || 'Failed to remove coupon');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold mb-4">Please login to view your cart</h2>
        <button onClick={() => router.push('/login?redirect=/cart')} className="bg-[#FF5A36] text-white px-6 py-2 rounded-xl font-bold">
          Login
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading cart...</div>;
  }

  const items = cartData?.items || [];
  
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Trash2 className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
        <button onClick={() => router.push('/search')} className="bg-[#FF5A36] text-white px-6 py-2 rounded-xl font-bold">
          Start Shopping
        </button>
      </div>
    );
  }

  // Group items by store
  const itemsByStore: Record<string, { storeName: string, items: any[] }> = {};
  items.forEach((item: any) => {
    const storeId = item.product.storeId;
    if (!itemsByStore[storeId]) {
      itemsByStore[storeId] = {
        storeName: 'Store ' + storeId.substring(0,4), // In a real app, product would include store name
        items: []
      };
    }
    itemsByStore[storeId].items.push(item);
  });

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.product.sellingPrice * item.quantity), 0);
  const totalOriginalPrice = items.reduce((sum: number, item: any) => sum + ((item.product.originalPrice || item.product.sellingPrice) * item.quantity), 0);
  
  let discountAmount = totalOriginalPrice - subtotal;
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

  const deliveryCharges = 0; // Or calculate based on subtotal
  const totalAmount = subtotal - couponDiscount + deliveryCharges;
  const totalSaved = discountAmount + couponDiscount;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] pb-32">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Column: Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Free Delivery Progress */}
          <div>
            <p className="text-sm text-[#171717] mb-2 font-medium">
              You're <span className="font-bold">₹1,210</span> away from <span className="text-[#16845B] font-bold">FREE delivery</span>
            </p>
            <div className="w-full h-1.5 bg-gray-200 rounded-full relative">
              <div className="absolute top-0 left-0 h-full bg-[#FF5A36] rounded-full" style={{ width: '65%' }}></div>
              <div className="absolute right-0 -top-3 flex flex-col items-center">
                <Truck className="w-4 h-4 text-[#6B6B6B] mb-0.5" />
                <span className="text-[10px] text-[#6B6B6B]">₹999 free delivery</span>
              </div>
            </div>
          </div>

          {Object.entries(itemsByStore).map(([storeId, storeGroup]) => (
            <div key={storeId} className="bg-white rounded-3xl p-5 shadow-sm border border-[#E5E2DC]">
              {/* Store Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#171717] rounded-full flex items-center justify-center text-white font-bold text-xs uppercase">
                    {storeGroup.storeName.substring(0,2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#171717] text-sm">{storeGroup.storeName}</h3>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#16845B] mt-0.5">
                      <Check className="w-3 h-3" />
                      Eligible for FREE delivery
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              {/* Cart Items */}
              <div className="space-y-4">
                {storeGroup.items.map((item: any) => {
                  const originalPrice = item.product.originalPrice || item.product.sellingPrice;
                  const discountPercent = originalPrice > item.product.sellingPrice 
                    ? Math.round(((originalPrice - item.product.sellingPrice) / originalPrice) * 100)
                    : 0;
                  return (
                    <CartProductCard
                      key={item.id}
                      id={item.id}
                      name={item.product.name}
                      variantInfo={item.variant ? Object.values(item.variant.options).join(' • ') : undefined}
                      price={item.product.sellingPrice}
                      originalPrice={originalPrice}
                      discount={discountPercent > 0 ? `${discountPercent}% OFF` : undefined}
                      imageUrl={item.product.imageUrl}
                      quantity={item.quantity}
                      onIncrement={handleIncrement}
                      onDecrement={handleDecrement}
                      onRemove={handleRemove}
                    />
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
              <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-xl">
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
                <span>Subtotal ({items.length} items)</span>
                <span className="text-[#171717] font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
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
                  <span className="line-through text-xs">₹40</span>
                  <span className="text-[#16845B] font-bold">FREE</span>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 my-4 pt-4 flex justify-between items-center">
              <span className="font-bold text-[#171717]">Total Amount</span>
              <span className="font-black text-[#171717] text-lg">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            {totalSaved > 0 && (
              <p className="text-[#16845B] text-xs font-bold text-center bg-green-50 py-2 rounded-lg">
                You Saved ₹{totalSaved.toLocaleString('en-IN')} on this order
              </p>
            )}
          </div>

          {/* Deliver To Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E2DC]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#171717]">Deliver to</h3>
              <button className="text-[#FF5A36] text-xs font-bold">Change</button>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#6B6B6B] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-[#171717] text-sm">{user?.name || 'Aarohi Singh'}</h4>
                <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
                  22, Green Park Extension,<br/>
                  New Delhi - 110016
                </p>
                <p className="text-xs text-[#6B6B6B] mt-1">+91 98765 43210</p>
              </div>
            </div>
          </div>
          
          {/* Why shop with us? */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E2DC]">
            <h3 className="font-bold text-[#171717] mb-5">Why shop with us?</h3>
            <div className="space-y-5">
              <div className="flex gap-3">
                <RotateCcw className="w-5 h-5 text-[#171717] flex-shrink-0" strokeWidth={1.5} />
                <div>
                  <h4 className="text-xs font-bold text-[#171717]">7 Days Easy Returns</h4>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">No questions asked</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-[#171717] flex-shrink-0" strokeWidth={1.5} />
                <div>
                  <h4 className="text-xs font-bold text-[#171717]">100% Original Products</h4>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">Sourced directly from brands</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CreditCard className="w-5 h-5 text-[#171717] flex-shrink-0" strokeWidth={1.5} />
                <div>
                  <h4 className="text-xs font-bold text-[#171717]">Secure Payments</h4>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">100% safe & secure</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Truck className="w-5 h-5 text-[#171717] flex-shrink-0" strokeWidth={1.5} />
                <div>
                  <h4 className="text-xs font-bold text-[#171717]">On-time Delivery</h4>
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">Track your order easily</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E2DC] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-6xl mx-auto w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-black text-xl text-[#171717] leading-none">₹{totalAmount.toLocaleString('en-IN')}</span>
              <button className="flex items-center gap-0.5 text-[11px] font-bold text-[#6B6B6B] mt-1.5">
                View Details <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
            {totalSaved > 0 && (
              <div className="flex flex-col text-[10px] font-bold text-[#16845B] leading-tight mt-0.5">
                <span>You saved</span>
                <span>₹{totalSaved.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleCheckout}
            className="bg-[#FF5A36] text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-between hover:bg-[#e04d2d] transition-colors shadow-sm min-w-[150px]"
          >
            <div className="flex flex-col text-center flex-1 leading-tight">
              <span className="text-[13px]">Proceed to</span>
              <span className="text-[13px]">Checkout</span>
            </div>
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
