'use client';

import React, { useEffect, useState } from 'react';
import { X, Copy, Check, MessageCircle, Instagram, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string;
  title?: string;
}

export function ShareBottomSheet({ isOpen, onClose, url = '', title = 'Check this out on Lokaya!' }: ShareBottomSheetProps) {
  const [isCopied, setIsCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Lock body scroll
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const shareOptions = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="w-6 h-6 text-white" />,
      bg: 'bg-[#25D366]',
      onClick: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + shareUrl)}`, '_blank')
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: <Instagram className="w-6 h-6 text-white" />,
      bg: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
      onClick: () => {
        // Instagram doesn't have a direct web share API for URLs that works reliably on desktop,
        // but this is standard for mobile fallback or they use native share API if available.
        handleCopy();
        alert('Link copied! Open Instagram to share.');
      }
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="w-6 h-6 text-white" />,
      bg: 'bg-[#1877F2]',
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
    },
    {
      id: 'copy',
      name: isCopied ? 'Copied!' : 'Copy Link',
      icon: isCopied ? <Check className="w-6 h-6 text-gray-700" /> : <Copy className="w-6 h-6 text-gray-700" />,
      bg: 'bg-gray-100 border border-gray-200',
      textColor: 'text-gray-900',
      onClick: handleCopy
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="relative bg-white w-full rounded-t-[24px] p-4 pb-8 animate-in slide-in-from-bottom duration-300 ease-out shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[17px] font-bold text-[#171717]">Share to</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {shareOptions.map((option) => (
            <button 
              key={option.id}
              onClick={option.onClick}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={cn(
                "w-[60px] h-[60px] rounded-[18px] flex items-center justify-center shadow-sm transition-transform active:scale-95 group-hover:-translate-y-1",
                option.bg
              )}>
                {option.icon}
              </div>
              <span className={cn(
                "text-[11px] font-semibold text-center leading-tight",
                option.textColor || "text-[#6B6B6B]"
              )}>
                {option.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
