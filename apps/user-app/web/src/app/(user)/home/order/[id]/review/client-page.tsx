'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState('');

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900 mx-auto pr-7 tracking-tight">Review Order</h1>
      </div>

      <div className="flex-1 flex flex-col px-4 py-8 max-w-md mx-auto w-full items-center">
        
        {/* Check/Complete illustration */}
        <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-[22px] font-black text-gray-900 tracking-tight text-center mb-2">Order Completed!</h2>
        <p className="text-gray-500 text-center mb-10 text-[15px]">Thank You! Your order has been picked up.<br/>How was your experience?</p>

        {/* Star Rating */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star} 
              onClick={() => setRating(star)}
              className="p-1 focus:outline-none transition-transform active:scale-90"
            >
              <Star 
                className={`w-10 h-10 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
              />
            </button>
          ))}
        </div>

        {/* Review Textarea */}
        <div className="w-full mb-8">
          <textarea 
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write your review here... (Optional)"
            className="w-full min-h-[120px] p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700 resize-none bg-white shadow-sm"
          />
        </div>

        <div className="flex-1"></div>

        {/* Submit Button */}
        <div className="w-full pt-4 pb-8">
          <Button 
            onClick={() => {
              // Submit logic here
              router.push('/home');
            }}
            disabled={rating === 0}
            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[16px] shadow-[0_8px_30px_rgb(79,70,229,0.25)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:bg-indigo-600"
          >
            Submit Review
          </Button>
        </div>
      </div>
    </div>
  );
}
