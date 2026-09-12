'use client';

import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Instagram, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };

  const shareOptions = [
    {
      id: 'native',
      name: 'More',
      icon: <Share2 className="w-6 h-6 text-white" />,
      bg: 'bg-black',
      onClick: handleNativeShare
    },
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
        handleCopy();
        toast.info('Link copied! Open Instagram to share.');
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
      icon: isCopied ? <Check className="w-6 h-6 text-[#FF5A36]" /> : <Copy className="w-6 h-6 text-[#FF5A36]" />,
      bg: 'bg-gray-100 border border-gray-200',
      textColor: 'text-gray-900',
      onClick: handleCopy
    }
  ];

  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-end">
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
