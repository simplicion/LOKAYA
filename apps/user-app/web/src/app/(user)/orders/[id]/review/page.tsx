'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Star, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { MOCK_ORDERS } from '@/lib/mock/checkout';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';

import { use } from 'react';



export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const order = MOCK_ORDERS.find(o => o.id === resolvedParams.id);
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [images, setImages] = useState<string[]>([]);
  
  if (!order || order.status !== 'DELIVERED') notFound();

  // For simplicity, just reviewing the first item in the order
  const item = order.items[0];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real app, you would upload to a server and get a URL.
    // Here we just use a fake placeholder.
    if (e.target.files && e.target.files.length > 0) {
      if (images.length < 3) {
        setImages([...images, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80']);
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
      default: return 'Rate your product';
    }
  };

  return (
    <div className="min-h-screen bg-white pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => router.back()} className="mr-4 text-gray-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Write a Review</h1>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto mb-[80px]">
        {/* Product Info */}
        <div className="flex gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
          <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white">
            <Image src={item.image} alt={item.title} fill className="object-cover" />
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{item.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
          </div>
        </div>

        {/* Rating Section */}
        <div className="flex flex-col items-center justify-center pt-4">
          <h2 className="text-xl font-black text-gray-900 mb-1">How is the product?</h2>
          <p className="text-sm font-medium text-gray-500 mb-6">{getRatingText()}</p>
          
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform active:scale-90"
              >
                <Star 
                  className={cn(
                    "w-10 h-10 transition-colors",
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
        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">Add detailed review</h3>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="What did you like or dislike? How did it fit? How was the quality?"
            className="w-full h-32 p-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none resize-none text-sm transition-all"
          />
        </div>

        {/* Photo Upload */}
        <div className="pt-2">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center justify-between">
            <span>Add Photos</span>
            <span className="text-xs font-medium text-gray-400">{images.length}/3 added</span>
          </h3>
          <p className="text-xs text-gray-500 mb-3">Shoppers find images and videos more helpful than text alone.</p>
          
          <div className="flex gap-3">
            {images.length < 3 && (
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#FF6B00] bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-400 hover:text-[#FF6B00]">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
            
            {images.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden shrink-0 group">
                <Image src={img} alt={`Upload ${idx + 1}`} fill className="object-cover" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button 
          disabled={rating === 0}
          onClick={() => {
            // Success flow
            router.push(`/orders/${order.id}`);
          }}
          className="w-full h-12 rounded-xl bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold text-lg disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500"
        >
          Submit Review
        </Button>
      </div>
    </div>
  );
}
