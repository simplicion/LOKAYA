"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  ShoppingBag, 
  Store as StoreIcon,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useCreateProductReviewMutation, useCheckAuthQuery } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { bottomSheetVariants, backdropVariants } from '@/lib/animations';

interface ReviewBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage?: string;
  storeId?: string;
  storeName?: string;
  onReviewSubmitted?: () => void;
}

const QUICK_TAGS = [
  "🌟 Top Quality",
  "👌 True to Size",
  "🚚 Fast Delivery",
  "✨ Value for Money",
  "🧵 Soft Fabric",
  "📦 Loved Packaging",
  "💯 100% Recommended",
  "😍 Exceeded Expectations"
];

export function ReviewBottomSheet({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  storeId,
  storeName,
  onReviewSubmitted
}: ReviewBottomSheetProps) {
  const router = useRouter();
  const { data: user } = useCheckAuthQuery();
  const [createReview, { isLoading: isSubmitting }] = useCreateProductReviewMutation();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTimeout(() => {
        setIsSuccess(false);
        setComment('');
        setSelectedTags([]);
        setRating(5);
      }, 300);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleToggleTag = (tag: string) => {
    const isSelected = selectedTags.includes(tag);
    const newTags = isSelected 
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);

    // Auto-append or update comment smartly
    if (!isSelected) {
      const cleanTag = tag.replace(/^[^\w\s]+\s*/, ''); // Remove leading emoji for clean sentence
      if (!comment.includes(cleanTag)) {
        setComment(prev => prev.trim() ? `${prev.trim()}, ${cleanTag}` : cleanTag);
      }
    }
  };

  const getRatingDescriptor = (stars: number) => {
    switch (stars) {
      case 5: return { label: '5.0 - Excellent! 🌟', color: 'text-amber-800 bg-amber-100/90 border-amber-300' };
      case 4: return { label: '4.0 - Very Good 😊', color: 'text-emerald-800 bg-emerald-100/90 border-emerald-300' };
      case 3: return { label: '3.0 - Good 🙂', color: 'text-blue-800 bg-blue-100/90 border-blue-300' };
      case 2: return { label: '2.0 - Fair 😐', color: 'text-orange-800 bg-orange-100/90 border-orange-300' };
      default: return { label: '1.0 - Poor 😞', color: 'text-rose-800 bg-rose-100/90 border-rose-300' };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to post your customer review');
      router.push('/login');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a few words about your experience');
      return;
    }

    try {
      await createReview({
        productId,
        rating,
        comment: comment.trim()
      }).unwrap();

      setIsSuccess(true);
      toast.success('🎉 Thank you! Your verified review has been published.');
      onReviewSubmitted?.();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to submit review. Please try again.');
    }
  };

  const currentDesc = getRatingDescriptor(hoverRating ?? rating);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 pointer-events-auto">
          {/* Backdrop Blur */}
          <motion.div 
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={onClose}
          />

          {/* Bottom Sheet Modal Container */}
          <motion.div 
            variants={bottomSheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 350) {
                onClose();
              }
            }}
            className="relative bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[92vh] sm:max-h-[85vh] border border-gray-100 overflow-hidden touch-manipulation"
          >
            {/* Grab Handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden select-none cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors" />
            </div>

            {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-[#FF5A36]">
              <Star className="w-4 h-4 fill-[#FF5A36]" />
            </span>
            <div>
              <h3 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Write a Review
              </h3>
              <p className="text-[11px] text-gray-500 mt-1">Share your honest feedback with verified shoppers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-lg font-black text-gray-900">Review Published!</h4>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                Your rating and comments have been added to this product's verified reviews.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Product Mini Preview Card */}
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {productImage ? (
                    <img src={productImage} alt={productName} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-gray-900 truncate">{productName}</h4>
                  {storeName && (
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                      <StoreIcon className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{storeName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Interactive Star Rating Selector */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900/80 block">
                  Tap a Star to Rate
                </span>

                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating ?? rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                        className="p-1.5 hover:scale-125 active:scale-95 transition-transform cursor-pointer"
                        title={`${star} Star`}
                      >
                        <Star
                          className={cn(
                            "w-8 h-8 sm:w-9 sm:h-9 transition-colors",
                            active
                              ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                              : "fill-gray-200 text-gray-300"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <span className={cn("text-xs font-black px-3 py-1 rounded-full border shadow-2xs inline-block", currentDesc.color)}>
                    {currentDesc.label}
                  </span>
                </div>
              </div>

              {/* Quick Feedback Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>Quick Feedback Highlights</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={cn(
                          "px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer",
                          isSelected
                            ? "bg-[#FF5A36] text-white border-[#FF5A36] shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Experience Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-gray-700 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                    <span>Your Honest Review</span>
                  </label>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {comment.length}/500
                  </span>
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder="Tell us what you liked or disliked about this product (quality, fit, stitching, delivery)..."
                  rows={4}
                  className="w-full text-xs p-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-[#FF5A36] focus:ring-2 focus:ring-orange-500/20 bg-gray-50/50 hover:bg-white transition-colors leading-relaxed placeholder:text-gray-400"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-12 rounded-2xl font-bold text-xs text-gray-700 border-gray-200 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="flex-[2] h-12 rounded-2xl bg-[#FF5A36] hover:bg-[#E04B28] text-white font-black text-xs shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing Review...</span>
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-4 h-4" />
                      <span>Post Customer Review</span>
                    </>
                  )}
                </Button>
              </div>

            </form>
          )}
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
