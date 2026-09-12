"use client";

import React, { useEffect, useState } from 'react';
import { X, Flag, CheckCircle } from 'lucide-react';
import { useReportContentMutation } from '@/lib/api';

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

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else {
      document.body.style.overflow = '';
      setTimeout(() => setIsSuccess(false), 300);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleReport = async (reason: string) => {
    if (isLoading) return;
    try {
      await reportContent({ targetId, targetType: type.toUpperCase() as 'POST'|'REEL', reason }).unwrap();
      setIsSuccess(true);
      onReported?.();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Failed to report', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white w-full rounded-t-[24px] flex flex-col animate-in slide-in-from-bottom duration-300 ease-out shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-[17px] font-bold text-[#171717]">Report</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><X className="w-5 h-5" /></button>
        </div>
        
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
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left disabled:opacity-50"
                  >
                    <span className="text-[15px] font-semibold text-[#171717]">{reason}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
