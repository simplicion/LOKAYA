"use client";

import React, { useEffect } from 'react';
import { X, Flag, Link as LinkIcon, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { AnimatedBottomSheet } from './AnimatedBottomSheet';

interface OptionsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onReport?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
  url: string;
  itemType?: 'post' | 'reel';
}

export function OptionsBottomSheet({ 
  isOpen, 
  onClose, 
  onReport, 
  onDelete, 
  isOwner = false, 
  url,
  itemType = 'post'
}: OptionsBottomSheetProps) {
  const handleCopyLink = async () => {
    try {
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
      onClose();
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareNative = async () => {
    onClose();
    if (typeof navigator !== 'undefined' && navigator.share && url) {
      try {
        await navigator.share({
          title: `Check out this ${itemType} on Lokaya`,
          url: url,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatedBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="More Options"
      zIndex={70}
    >
        
        <div className="flex flex-col p-4 pb-8 gap-1.5">
          {/* Share Action */}
          <button 
            onClick={handleShareNative} 
            className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full text-left"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-[#171717]">Share to...</span>
              <span className="text-xs text-gray-400">Share via WhatsApp, Messages or Social apps</span>
            </div>
          </button>

          {/* Copy Link Action */}
          <button 
            onClick={handleCopyLink} 
            className="flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors w-full text-left"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-gray-700" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-[#171717]">Copy Link</span>
              <span className="text-xs text-gray-400">Copy link directly to clipboard</span>
            </div>
          </button>

          {/* Delete Option (for author / store owner) */}
          {isOwner ? (
            <button 
              onClick={() => { 
                onClose(); 
                onDelete?.(); 
              }} 
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-red-50/60 hover:bg-red-100/70 active:bg-red-100 transition-colors w-full text-left group mt-1"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-red-600">Delete {itemType === 'reel' ? 'Reel' : 'Post'}</span>
                <span className="text-xs text-red-400">Permanently remove this from your profile & feed</span>
              </div>
            </button>
          ) : (
            /* Report Option (for viewers) */
            <button 
              onClick={() => { 
                onClose(); 
                onReport?.(); 
              }} 
              className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-red-50/40 hover:bg-red-50 active:bg-red-100 transition-colors w-full text-left group mt-1"
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <Flag className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-red-600">Report {itemType === 'reel' ? 'Reel' : 'Post'}</span>
                <span className="text-xs text-red-400">Hide this content and report violations</span>
              </div>
            </button>
          )}
        </div>
    </AnimatedBottomSheet>
  );
}
