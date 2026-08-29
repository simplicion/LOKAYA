"use client";

import React, { useEffect } from 'react';
import { X, Flag, Link as LinkIcon, Share2 } from 'lucide-react';

interface OptionsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onReport: () => void;
  url: string;
}

export function OptionsBottomSheet({ isOpen, onClose, onReport, url }: OptionsBottomSheetProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
      onClose();
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white w-full rounded-t-[24px] flex flex-col animate-in slide-in-from-bottom duration-300 ease-out shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-[17px] font-bold text-[#171717]">Options</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex-col p-4 pb-8 flex gap-2">
          <button onClick={handleCopyLink} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full text-left">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><LinkIcon className="w-5 h-5 text-gray-700" /></div>
            <span className="text-[15px] font-semibold text-[#171717]">Copy Link</span>
          </button>
          <button onClick={() => { onClose(); onReport(); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors w-full text-left group">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors"><Flag className="w-5 h-5 text-red-600" /></div>
            <span className="text-[15px] font-semibold text-red-600">Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
