'use client';

import { Product } from '@/lib/mock/products';
import { Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface RatingsAndReviewsProps {
  rating?: Product['rating'];
}

export function RatingsAndReviews({ rating }: RatingsAndReviewsProps) {
  const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [reviewText, setReviewText] = useState('');

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isReviewSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isReviewSheetOpen]);

  if (!rating) return null;

  return (
    <>
      <div className="px-4 py-6 border-t border-gray-100 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-[15px]">Ratings & Reviews <span className="font-normal text-gray-500">({rating.count})</span></h3>
          <button className="text-sm font-bold text-[#FF6B00]">View All</button>
        </div>

        <div className="flex gap-8">
          {/* Left: Overall Score */}
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-4xl font-black text-gray-900 leading-none">{rating.score}</span>
            <div className="flex text-[#FF6B00]">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className={cn("w-4 h-4", star <= Math.round(rating.score) ? "fill-[#FF6B00]" : "text-gray-300")} />
              ))}
            </div>
            <span className="text-xs text-gray-500 mt-1 text-center">Based on {rating.count} reviews</span>
          </div>

          {/* Right: Distribution Bars */}
          <div className="flex-1 flex flex-col justify-between">
            {rating.distribution.map((dist, idx) => {
              const percentage = (dist.count / rating.count) * 100;
              return (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-0.5 w-6 text-gray-600 font-medium">
                    {dist.star} <Star className="w-3 h-3 fill-gray-400 text-gray-400" />
                  </div>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#FF6B00] rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-gray-500">
                    {dist.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button 
          onClick={() => setIsReviewSheetOpen(true)}
          className="w-full py-3 mt-4 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-900 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          Write a Review
        </button>
      </div>

      {/* Review Bottom Sheet */}
      {isReviewSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsReviewSheetOpen(false)}
          />
          
          {/* Sheet Content */}
          <div className="relative bg-white rounded-t-3xl w-full max-w-md mx-auto p-6 animate-in slide-in-from-bottom duration-300">
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Write a Review</h3>
              <button 
                onClick={() => setIsReviewSheetOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Star Selection */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <span className="text-sm font-medium text-gray-600">Tap to Rate</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedStars(star)}
                      className="transition-transform active:scale-90 p-1"
                    >
                      <Star 
                        className={cn(
                          "w-10 h-10 transition-colors", 
                          star <= selectedStars ? "fill-[#FF6B00] text-[#FF6B00]" : "text-gray-300"
                        )} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Your Review (Optional)</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What did you like or dislike?"
                  className="w-full border border-gray-200 rounded-xl p-4 min-h-[120px] resize-none focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              {/* Submit Button */}
              <button 
                className={cn(
                  "w-full py-4 rounded-full font-bold text-white transition-colors",
                  selectedStars > 0 ? "bg-[#FF6B00] hover:bg-[#e66000]" : "bg-gray-300 cursor-not-allowed"
                )}
                disabled={selectedStars === 0}
                onClick={() => {
                  // Submit logic here
                  setIsReviewSheetOpen(false);
                }}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
