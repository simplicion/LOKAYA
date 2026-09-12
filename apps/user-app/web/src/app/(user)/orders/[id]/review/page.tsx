'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Star, Camera, X, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useGetOrderQuery } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const orderId = resolvedParams.id;

  const { data: order, isLoading } = useGetOrderQuery(orderId, { skip: !orderId });
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading Review Form...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-3">
          <Package className="w-8 h-8 text-gray-300" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Order Not Found</h2>
        <p className="text-xs text-gray-500 mb-4">Cannot review an unverified order.</p>
        <Button onClick={() => router.push('/orders')} className="h-10 px-5 rounded-xl bg-[#FF6B00] text-white text-xs font-bold">
          Back to Orders
        </Button>
      </div>
    );
  }

  // Use the first item in the order
  const item = order.items?.[0];
  const itemImage = item?.product?.media?.[0]?.url || item?.product?.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';
  const itemName = item?.productName || item?.product?.name || 'Order Item';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (images.length < 3) {
        const file = e.target.files[0];
        const previewUrl = URL.createObjectURL(file);
        setImages((prev) => [...prev, previewUrl]);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const getRatingText = () => {
    const val = hoveredRating || rating;
    switch(val) {
      case 1: return 'Very Poor';
      case 2: return 'Poor';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent!';
      default: return 'Rate your purchase';
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    setIsSubmitting(true);
    try {
      // In production, calls review API
      toast.success('Thank you for your valuable feedback!');
      setTimeout(() => {
        router.push(`/orders/${order.id}`);
      }, 800);
    } catch (err) {
      toast.error('Failed to submit review');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="flex items-center px-4 py-3.5 border-b border-gray-100 sticky top-0 bg-white z-20">
        <button 
          onClick={() => router.back()} 
          className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-gray-800 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-bold text-gray-900 ml-2">Write a Review</h1>
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-y-auto mb-20">
        {/* Product Info */}
        <div className="flex gap-3.5 p-3.5 border border-gray-100 rounded-2xl bg-gray-50/70 items-center">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-white">
            <Image src={itemImage} alt={itemName} fill className="object-cover" sizes="56px" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-xs truncate leading-snug">{itemName}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Order #{order.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Rating Section */}
        <div className="flex flex-col items-center justify-center pt-2">
          <h2 className="text-base font-extrabold text-gray-900 mb-0.5">How was your product?</h2>
          <p className="text-xs font-medium text-[#FF6B00] mb-5">{getRatingText()}</p>
          
          <div className="flex gap-2.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform active:scale-90"
              >
                <Star 
                  className={cn(
                    "w-9 h-9 transition-colors",
                    (hoveredRating || rating) >= star 
                      ? "fill-[#FFB800] text-[#FFB800]" 
                      : "fill-gray-100 text-gray-200"
                  )} 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Text Review */}
        <div className="pt-2 border-t border-gray-100">
          <h3 className="font-bold text-gray-900 text-xs mb-2">Detailed Review</h3>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="What did you like or dislike? How was the fit and material quality?"
            className="w-full h-28 p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none resize-none text-xs transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Photo Upload */}
        <div className="pt-1">
          <h3 className="font-bold text-gray-900 text-xs mb-1 flex items-center justify-between">
            <span>Add Photos</span>
            <span className="text-[11px] font-medium text-gray-400">{images.length}/3 added</span>
          </h3>
          <p className="text-[11px] text-gray-500 mb-3">Photos help other shoppers see real fit and quality.</p>
          
          <div className="flex gap-2.5">
            {images.length < 3 && (
              <label className="w-18 h-18 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#FF6B00] bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 hover:text-[#FF6B00] p-3">
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">Add Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
            
            {images.map((img, idx) => (
              <div key={idx} className="relative w-18 h-18 rounded-xl border border-gray-200 overflow-hidden shrink-0 group">
                <Image src={img} alt={`Upload ${idx + 1}`} fill className="object-cover" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-3.5 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
        <Button 
          disabled={rating === 0 || isSubmitting}
          onClick={handleSubmit}
          className="w-full h-11 rounded-xl bg-[#FF6B00] hover:bg-[#ff7a1f] text-white font-bold text-xs tracking-wide uppercase disabled:opacity-50 disabled:bg-gray-300"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
}
