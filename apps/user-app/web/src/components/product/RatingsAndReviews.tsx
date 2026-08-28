import { Product } from '@/lib/mock/products';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingsAndReviewsProps {
  rating?: Product['rating'];
}

export function RatingsAndReviews({ rating }: RatingsAndReviewsProps) {
  if (!rating) return null;

  return (
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
    </div>
  );
}
