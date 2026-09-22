'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Twitter, 
  QrCode, 
  PlusCircle, 
  Search, 
  Send, 
  CheckCircle2, 
  Download,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn, getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useGetShareRecipientsQuery, useSendDirectShareMutation } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { bottomSheetVariants, backdropVariants } from '@/lib/animations';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

interface ShareBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  url?: string;
  title?: string;
  authorName?: string;
  coverImage?: string;
}

export function ShareBottomSheet({
  isOpen,
  onClose,
  url = '',
  title = 'Check this out on Lokaya!',
  authorName,
  coverImage,
}: ShareBottomSheetProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageNote, setMessageNote] = useState('');
  const [sentRecipientIds, setSentRecipientIds] = useState<Set<string>>(new Set());
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Fetch suggested friends/recipients for Instagram-style Quick Send
  const { data: recipients = [] } = useGetShareRecipientsQuery(undefined, { skip: !isOpen });
  const [sendDirectShare] = useSendDirectShareMutation();

  // Handle escape key & scroll locking
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isQrModalOpen) setIsQrModalOpen(false);
        else onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isQrModalOpen]);

  // Reset local state on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setMessageNote('');
      setIsQrModalOpen(false);
    }
  }, [isOpen]);

  const filteredRecipients = useMemo(() => {
    if (!searchQuery.trim()) return recipients;
    const q = searchQuery.toLowerCase().trim();
    return recipients.filter(
      (r: any) =>
        r.name.toLowerCase().includes(q) ||
        (r.username && r.username.toLowerCase().includes(q))
    );
  }, [recipients, searchQuery]);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    } else {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setIsCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2200);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: messageNote ? `${messageNote} - ${title}` : title,
          url: shareUrl,
        });
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleQuickSend = async (recipient: any) => {
    const isAlreadySent = sentRecipientIds.has(recipient.id);
    if (isAlreadySent) return;

    setSentRecipientIds((prev) => new Set(prev).add(recipient.id));
    toast.success(`Sent to ${recipient.name}!`);

    if (currentUser?.id) {
      try {
        await sendDirectShare({
          recipientId: recipient.id,
          shareUrl,
          message: messageNote.trim() || undefined,
        }).unwrap();
      } catch (err) {
        console.warn('Could not record direct share notification:', err);
      }
    }
  };

  const shareActions = [
    {
      id: 'story',
      name: 'Add to Story',
      icon: (
        <div className="relative">
          <Instagram className="w-6 h-6 text-white" />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#FF5A36] text-white rounded-full flex items-center justify-center font-black text-[9px] border border-white">
            +
          </div>
        </div>
      ),
      bg: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
      onClick: () => {
        handleCopy();
        toast.success('Ready to share! Opening story composer...');
        setTimeout(() => {
          onClose();
          window.location.href = `/profile/create/post`;
        }, 600);
      },
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="w-6 h-6 text-white" />,
      bg: 'bg-[#25D366]',
      onClick: () => {
        const text = encodeURIComponent(
          `${messageNote ? `${messageNote}\n\n` : ''}${title}\n${shareUrl}`
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      },
    },
    {
      id: 'copy',
      name: isCopied ? 'Copied!' : 'Copy Link',
      icon: isCopied ? (
        <Check className="w-6 h-6 text-[#FF5A36]" />
      ) : (
        <Copy className="w-6 h-6 text-[#171717]" />
      ),
      bg: isCopied ? 'bg-orange-50 border border-orange-200' : 'bg-gray-100 border border-gray-200',
      textColor: isCopied ? 'text-[#FF5A36]' : 'text-[#171717]',
      onClick: handleCopy,
    },
    {
      id: 'qrcode',
      name: 'QR Code',
      icon: <QrCode className="w-6 h-6 text-white" />,
      bg: 'bg-gradient-to-tr from-gray-900 to-gray-700',
      onClick: () => setIsQrModalOpen(true),
    },
    {
      id: 'native',
      name: 'Share via...',
      icon: <Share2 className="w-6 h-6 text-white" />,
      bg: 'bg-black',
      onClick: handleNativeShare,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="w-6 h-6 text-white" />,
      bg: 'bg-[#1877F2]',
      onClick: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
      },
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: <Twitter className="w-5 h-5 text-white" />,
      bg: 'bg-black',
      onClick: () => {
        const text = encodeURIComponent(`${title}\n${shareUrl}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
      },
    },
    {
      id: 'sms',
      name: 'Messages',
      icon: <MessageCircle className="w-6 h-6 text-white" />,
      bg: 'bg-emerald-500',
      onClick: () => {
        const body = encodeURIComponent(
          `${messageNote ? `${messageNote} ` : ''}${title} ${shareUrl}`
        );
        window.location.href = `sms:?body=${body}`;
      },
    },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[120] flex flex-col justify-end pointer-events-auto">
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
              onClick={onClose}
            />

            {/* Bottom Sheet Container */}
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
              className="relative bg-white w-full rounded-t-[32px] pt-3 pb-8 px-4 shadow-[0_-12px_40px_rgba(0,0,0,0.2)] max-w-lg mx-auto flex flex-col max-h-[85vh] z-10 touch-manipulation"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-3.5 select-none hover:bg-gray-300 transition-colors cursor-grab active:cursor-grabbing" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3 px-1">
            <h3 className="text-base font-black text-[#171717] tracking-tight">Share</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Instagram-Style Search Input */}
          <div className="relative mb-3.5">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full bg-gray-100/80 border border-transparent rounded-2xl py-2 pl-10 pr-4 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-gray-300 transition-all"
            />
          </div>

          {/* Instagram Quick-Send Direct Messages Grid */}
          <div className="overflow-y-auto no-scrollbar max-h-44 mb-3 -mx-2 px-2">
            <div className="grid grid-cols-4 gap-3 py-1">
              {filteredRecipients.slice(0, 8).map((recipient: any) => {
                const isSent = sentRecipientIds.has(recipient.id);
                const initial = recipient.name ? recipient.name.charAt(0).toUpperCase() : 'U';

                return (
                  <div
                    key={recipient.id}
                    onClick={() => handleQuickSend(recipient)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group select-none"
                  >
                    {/* Avatar with gradient border */}
                    <div className="relative w-13 h-13 rounded-full p-[2px] bg-gradient-to-tr from-[#FF5A36] to-amber-400 transition-transform active:scale-95 group-hover:scale-105">
                      <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center border border-white">
                        {recipient.avatarUrl ? (
                          <img
                            src={getMediaUrl(recipient.avatarUrl)}
                            alt={recipient.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-bold text-xs text-gray-700">{initial}</span>
                        )}
                      </div>
                      {isSent && (
                        <div className="absolute inset-0 rounded-full bg-emerald-500/85 flex items-center justify-center text-white">
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Recipient Name */}
                    <span className="text-[11px] font-semibold text-gray-800 truncate max-w-[68px] text-center leading-tight">
                      {recipient.name}
                    </span>

                    {/* Send / Sent Pill Button */}
                    <button
                      type="button"
                      className={cn(
                        'px-3 py-0.5 rounded-full text-[10px] font-bold transition-all',
                        isSent
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-[#FF5A36] text-white hover:bg-[#e04d2d] shadow-xs'
                      )}
                    >
                      {isSent ? 'Sent ✓' : 'Send'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Message Note Field */}
          <div className="mb-4">
            <input
              type="text"
              value={messageNote}
              onChange={(e) => setMessageNote(e.target.value)}
              placeholder="Write a message..."
              className="w-full bg-[#FAF9F6] border border-gray-200 rounded-2xl px-3.5 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#FF5A36] transition-all"
            />
          </div>

          {/* Instagram Action Row (Horizontal Scroll) */}
          <div className="border-t border-gray-100 pt-3.5">
            <div className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
              {shareActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-1.5 shrink-0 group select-none cursor-pointer"
                  style={{ width: '64px' }}
                >
                  <div
                    className={cn(
                      'w-13 h-13 rounded-2xl flex items-center justify-center shadow-xs transition-transform active:scale-95 group-hover:-translate-y-1',
                      action.bg
                    )}
                  >
                    {action.icon}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-semibold text-center leading-tight line-clamp-2',
                      action.textColor || 'text-gray-600'
                    )}
                  >
                    {action.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

      {/* Instagram-Style QR Code Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[130] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-6 max-w-xs w-full flex flex-col items-center text-center shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Lokaya Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF5A36] text-xs font-black tracking-wider uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lokaya Scan</span>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-2xl border-2 border-gray-100 shadow-inner mb-4">
              <QRCodeSVG
                value={shareUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <h4 className="font-black text-gray-900 text-sm mb-1 line-clamp-1">{title}</h4>
            <p className="text-[11px] text-gray-500 mb-5 max-w-[200px]">
              Scan with your smartphone camera to open directly on Lokaya.
            </p>

            {/* Action Buttons */}
            <div className="w-full flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 bg-[#FF5A36] text-white rounded-2xl text-xs font-bold shadow-md hover:bg-[#e04d2d] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-2xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
