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
  Check
} from 'lucide-react';
import { CartProductCard } from '@/components/cart/CartProductCard';

export default function CartPage() {
  const router = useRouter();
  const [selectAll, setSelectAll] = useState(false);
  const user = useSelector((state: any) => state.auth.user);

  const handleCheckout = () => {
    if (!user) {
      router.push('/login?redirect=/cart');
    } else {
      // Proceed to checkout logic
      router.push('/checkout');
    }
  };

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
              {/* Truck icon marker at end */}
              <div className="absolute right-0 -top-3 flex flex-col items-center">
                <Truck className="w-4 h-4 text-[#6B6B6B] mb-0.5" />
                <span className="text-[10px] text-[#6B6B6B]">₹999 free delivery</span>
              </div>
            </div>
          </div>



          {/* --- Cart Group 1: Urban Threads --- */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E5E2DC]">
            {/* Store Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#171717] rounded-full flex items-center justify-center text-white font-bold text-xs">
                  UT
                </div>
                <div>
                  <h3 className="font-bold text-[#171717] text-sm">Urban Threads</h3>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#16845B] mt-0.5">
                    <Check className="w-3 h-3" />
                    Eligible for FREE delivery
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>

            {/* Cart Item 1 */}
            <CartProductCard
              id="1"
              name="Waffle Knit Shirt"
              variantInfo="Brown • M"
              price={1499}
              originalPrice={2499}
              discount="40% OFF"
              imageUrl="https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=400&q=80"
              quantity={1}
            />
          </div>

          {/* --- Cart Group 2: Sneak Peak --- */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E5E2DC]">
            {/* Store Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#171717] rounded-full flex items-center justify-center text-white font-bold text-[10px] text-center leading-none">
                  SNEAK<br/>PEAK
                </div>
                <div>
                  <h3 className="font-bold text-[#171717] text-sm">Sneak Peak</h3>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#16845B] mt-0.5">
                    <Check className="w-3 h-3" />
                    Eligible for FREE delivery
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>

            {/* Cart Item 2 */}
            <CartProductCard
              id="2"
              name="Urban Runner Sneakers"
              variantInfo="Beige • UK 8"
              price={2999}
              originalPrice={3999}
              discount="25% OFF"
              imageUrl="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80"
              quantity={1}
            />
          </div>

          {/* --- Cart Group 3: Luxe Living --- */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E5E2DC]">
            {/* Store Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[#171717] font-serif text-[10px] text-center leading-none">
                  LUXE<br/>LIVING
                </div>
                <div>
                  <h3 className="font-bold text-[#171717] text-sm">Luxe Living</h3>
                  <div className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Add <span className="font-bold text-[#FF5A36]">₹710</span> more to get <span className="font-bold text-[#16845B]">FREE delivery</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>

            {/* Cart Item 3 */}
            <CartProductCard
              id="3"
              name="Modern Ceramic Vase"
              variantInfo="Beige"
              price={899}
              originalPrice={1299}
              discount="31% OFF"
              imageUrl="https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&q=80"
              quantity={1}
            />
          </div>

          {/* Wishlisted Items Carousel */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#171717]">Wishlisted Items <span className="text-[#6B6B6B] font-medium text-sm">(4)</span></h3>
              <button className="text-[#FF5A36] text-sm font-bold">View All</button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
              {[
                "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=200&q=80", // watch
                "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=200&q=80", // sunglasses
                "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=200&q=80", // bag
                "https://images.unsplash.com/photo-1507149833265-60c372daea22?w=200&q=80", // lamp
              ].map((src, i) => (
                <div key={i} className="w-24 h-24 flex-shrink-0 bg-white border border-[#E5E2DC] rounded-xl overflow-hidden p-2">
                  <Image src={src} alt="Saved item" width={80} height={80} className="w-full h-full object-contain mix-blend-multiply" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Info */}
        <div className="space-y-6">
          
          {/* Price Details Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5E2DC]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#171717]">Price Details</h3>
              <Ticket className="w-5 h-5 text-[#6B6B6B]" />
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-[#6B6B6B]">
                <span>Subtotal (3 items)</span>
                <span className="text-[#171717] font-medium">₹5,397</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#16845B]">Discount</span>
                <span className="text-[#16845B] font-bold">- ₹1,348</span>
              </div>
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
              <span className="font-black text-[#171717] text-lg">₹4,049</span>
            </div>

            <p className="text-[#16845B] text-xs font-bold text-center bg-green-50 py-2 rounded-lg">
              You Saved ₹1,348 on this order
            </p>
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
                <h4 className="font-bold text-[#171717] text-sm">Aarohi Singh</h4>
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
              <span className="font-black text-xl text-[#171717] leading-none">₹4,049</span>
              <button className="flex items-center gap-0.5 text-[11px] font-bold text-[#6B6B6B] mt-1.5">
                View Details <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-col text-[10px] font-bold text-[#16845B] leading-tight mt-0.5">
              <span>You saved</span>
              <span>₹1,348</span>
            </div>
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
