'use client';

import React, { useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRange: string;
  onSelectRange: (range: string) => void;
  showCustomRange?: boolean;
}

const DATE_RANGES = [
  'Today',
  'Yesterday',
  'This Week',
  'This Month',
  'Last Month',
  'This Year',
];

export function DateRangeModal({
  isOpen,
  onClose,
  selectedRange,
  onSelectRange,
  showCustomRange = false,
}: DateRangeModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[#E5E2DC] flex flex-col space-y-4 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 pb-8 sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto sm:hidden -mt-1 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5A36] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-[#171717]">Select Date Range</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            aria-label="Close date range modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Date Options Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {DATE_RANGES.map((range) => {
            const isSelected = selectedRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => {
                  onSelectRange(range);
                }}
                className={`py-3 px-4 rounded-2xl border text-xs sm:text-sm font-semibold text-center transition-all ${
                  isSelected
                    ? 'bg-[#171717] text-white border-[#171717] shadow-sm scale-[1.02]'
                    : 'bg-[#FFFFFF] text-[#6B6B6B] border-[#E5E2DC] hover:border-[#171717] hover:text-[#171717]'
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>

        {/* Custom Range Option if enabled */}
        {showCustomRange && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full h-11 rounded-2xl border-[#E5E2DC] text-[#171717] font-semibold text-xs sm:text-sm hover:bg-gray-50"
          >
            Custom Range
          </Button>
        )}

        {/* Apply Action Button */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={onClose}
            className="w-full h-12 bg-[#FF5A36] hover:bg-[#E04B2A] text-white font-bold rounded-2xl shadow-md transition-all text-sm"
          >
            Apply Filter
          </Button>
        </div>
      </div>
    </div>
  );
}
