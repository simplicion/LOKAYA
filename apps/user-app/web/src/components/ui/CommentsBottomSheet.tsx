"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { X, Send, Loader2 } from 'lucide-react';
import { useGetPostCommentsQuery, useGetReelCommentsQuery, useAddPostCommentMutation, useAddReelCommentMutation } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';

interface CommentsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  type: 'post' | 'reel';
  onCommentAdded?: (newCount?: number) => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 45) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export function CommentsBottomSheet({ isOpen, onClose, targetId, type, onCommentAdded }: CommentsBottomSheetProps) {
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [content, setContent] = useState('');
  const [optimisticComments, setOptimisticComments] = useState<any[]>([]);
  const [brokenAvatars, setBrokenAvatars] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: postComments, isLoading: isPostLoading } = useGetPostCommentsQuery(targetId, { 
    skip: !isOpen || type !== 'post' 
  });
  const { data: reelComments, isLoading: isReelLoading } = useGetReelCommentsQuery(targetId, { 
    skip: !isOpen || type !== 'reel' 
  });
  
  const [addPostComment] = useAddPostCommentMutation();
  const [addReelComment] = useAddReelCommentMutation();

  const serverComments = type === 'post' ? postComments : reelComments;
  const isLoading = type === 'post' ? isPostLoading : isReelLoading;

  // Sync server comments with optimistic comments
  useEffect(() => {
    if (serverComments) {
      setOptimisticComments(prev => {
        // Keep any pending optimistic comments that haven't reconciled yet
        const pendingOptimistic = prev.filter(c => c.isOptimistic && !serverComments.some(sc => sc.content === c.content && sc.userId === c.userId));
        return [...pendingOptimistic, ...serverComments];
      });
    }
  }, [serverComments]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Auto focus input
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      document.body.style.overflow = '';
      setContent('');
    }
    return () => { 
      document.body.style.overflow = ''; 
    };
  }, [isOpen]);

  const handleProfileNavigation = (user: any) => {
    if (!user) return;
    onClose();

    // 1. Current user
    if (currentUser?.id && user.id === currentUser.id) {
      router.push('/profile');
      return;
    }

    // 2. Seller with store
    const storeId = user.stores?.[0]?.storeId || user.stores?.[0]?.store?.id;
    if (storeId) {
      router.push(`/store/${storeId}`);
      return;
    }

    // 3. Public User Profile
    if (user.id) {
      router.push(`/user/${user.id}`);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    if (!currentUser) {
      toast.error('Please sign in to comment');
      router.push('/login');
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticItem = {
      id: tempId,
      content: trimmed,
      userId: currentUser.id,
      postId: type === 'post' ? targetId : undefined,
      reelId: type === 'reel' ? targetId : undefined,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      user: {
        id: currentUser.id,
        name: currentUser.name || 'You',
        avatarUrl: currentUser.avatarUrl || null,
        stores: (currentUser as any).stores || []
      }
    };

    // 1. INSTANT UPDATE: Prepend comment locally with 0ms delay
    setOptimisticComments(prev => [optimisticItem, ...prev]);
    setContent('');
    
    // 2. Notify parent counter immediately
    if (onCommentAdded) {
      onCommentAdded();
    }

    // Scroll to top of comment feed
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    try {
      let res: any;
      if (type === 'post') {
        res = await addPostComment({ postId: targetId, content: trimmed }).unwrap();
      } else {
        res = await addReelComment({ reelId: targetId, content: trimmed }).unwrap();
      }

      // Reconcile optimistic comment with confirmed response
      if (res && res.id) {
        setOptimisticComments(prev => 
          prev.map(c => c.id === tempId ? { ...res, isOptimistic: false } : c)
        );
      }
    } catch (err) {
      // Rollback optimistic comment on network error
      setOptimisticComments(prev => prev.filter(c => c.id !== tempId));
      toast.error('Failed to post comment. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Sheet Container */}
      <div className="relative bg-white w-full rounded-t-[28px] flex flex-col h-[75vh] max-h-[640px] animate-in slide-in-from-bottom duration-300 ease-out shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold text-[#171717]">Comments</h3>
            <span className="text-[13px] font-semibold text-gray-500 tabular-nums">
              ({optimisticComments.length})
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Comments Feed */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 pb-24"
        >
          {isLoading && optimisticComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-[#FF5A36] animate-spin" />
              <p className="text-xs text-gray-400 font-medium">Loading comments...</p>
            </div>
          ) : optimisticComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-gray-900 font-semibold text-[14px] mb-1">No comments yet</p>
              <p className="text-gray-400 text-[13px]">Be the first to share your thoughts!</p>
            </div>
          ) : (
            optimisticComments.map((comment: any) => {
              const userName = comment.user?.name || 'Lokaya User';
              const initialChar = userName.trim().charAt(0).toUpperCase() || 'U';
              const avatarUrl = comment.user?.avatarUrl;
              const hasBrokenAvatar = brokenAvatars[comment.id] || !avatarUrl;
              const isSeller = Boolean(comment.user?.stores?.[0]?.storeId || comment.user?.stores?.[0]?.store?.id);

              return (
                <div 
                  key={comment.id} 
                  className={`flex gap-3 items-start transition-opacity duration-200 ${
                    comment.isOptimistic ? 'opacity-70' : 'opacity-100'
                  }`}
                >
                  {/* User Profile Avatar / Initial Character */}
                  <button
                    type="button"
                    onClick={() => handleProfileNavigation(comment.user)}
                    className="w-9 h-9 rounded-full bg-stone-100 border border-orange-100 overflow-hidden flex-shrink-0 flex items-center justify-center hover:ring-2 hover:ring-[#FF5A36]/30 transition-all active:scale-95"
                    aria-label={`View profile of ${userName}`}
                  >
                    {!hasBrokenAvatar ? (
                      <img 
                        src={getMediaUrl(avatarUrl)} 
                        alt={userName} 
                        className="w-full h-full object-cover"
                        onError={() => setBrokenAvatars(prev => ({ ...prev, [comment.id]: true }))}
                      />
                    ) : (
                      <span className="font-bold text-[13px] text-[#FF5A36] select-none">
                        {initialChar}
                      </span>
                    )}
                  </button>

                  {/* Comment Body */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleProfileNavigation(comment.user)}
                        className="font-bold text-[13px] text-[#171717] hover:underline cursor-pointer text-left truncate max-w-[180px]"
                      >
                        {userName}
                      </button>

                      {isSeller && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md">
                          Seller
                        </span>
                      )}

                      <span className="text-[11px] text-gray-400 font-medium">
                        {comment.isOptimistic ? 'Posting...' : formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>

                    <p className="text-[14px] text-gray-800 leading-relaxed mt-0.5 break-words whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Comment Input Footer */}
        <form 
          onSubmit={handleSubmit} 
          className="absolute bottom-0 left-0 right-0 p-3.5 border-t border-gray-100 bg-white flex items-center gap-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]"
        >
          {/* User's own small avatar or initial */}
          <div className="w-8 h-8 rounded-full bg-stone-100 border border-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {currentUser?.avatarUrl ? (
              <img 
                src={getMediaUrl(currentUser.avatarUrl)} 
                alt={currentUser.name || 'User'} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="font-bold text-[12px] text-[#FF5A36]">
                {currentUser?.name ? currentUser.name.trim().charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>

          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center focus-within:ring-2 focus-within:ring-[#FF5A36]/20 transition-all">
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Add a comment..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              className="bg-transparent border-none outline-none w-full text-[14px] text-gray-800 placeholder:text-gray-400"
            />
          </div>

          <button 
            type="submit" 
            disabled={!content.trim()} 
            className="w-9 h-9 rounded-full bg-[#FF5A36] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#e04f2f] active:scale-90 transition-all shadow-sm flex-shrink-0"
            aria-label="Send Comment"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
