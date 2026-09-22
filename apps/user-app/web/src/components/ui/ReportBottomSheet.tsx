"use client";

import React, { useState } from 'react';
import { Flag, CheckCircle } from 'lucide-react';
import { useReportContentMutation } from '@/lib/api';
import { AnimatedBottomSheet } from './AnimatedBottomSheet';

const REPORT_REASONS = [
  "Spam or misleading",
  "Inappropriate content",
  "Scam or fraud",
  "Intellectual property violation",
  "Other"
];

interface ReportBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onReported?: () => void;
  targetId: string;
  type: 'post' | 'reel';
}

export function ReportBottomSheet({ isOpen, onClose, onReported, targetId, type }: ReportBottomSheetProps) {
  const [reportContent, { isLoading }] = useReportContentMutation();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReport = async (reason: string) => {
    if (isLoading) return;
    try {
      await reportContent({ targetId, targetType: type.toUpperCase() as 'POST'|'REEL', reason }).unwrap();
      setIsSuccess(true);
      onReported?.();
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 1800);
    } catch (err) {
      console.error('Failed to report', err);
    }
  };

  return (
    <AnimatedBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Report"
      zIndex={70}
    >
      <div className="flex-col p-4 pb-8">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-[16px] font-bold text-[#171717]">Report Submitted</p>
            <p className="text-[14px] text-gray-500 text-center">Thank you for letting us know. We will review this content.</p>
          </div>
        ) : (
          <>
            <p className="text-[14px] text-gray-600 mb-4 px-2">Why are you reporting this {type}?</p>
            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((reason) => (
                <button 
                  key={reason}
                  onClick={() => handleReport(reason)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left disabled:opacity-50 cursor-pointer"
                >
                  <span className="text-[15px] font-semibold text-[#171717]">{reason}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </AnimatedBottomSheet>
  );
}
