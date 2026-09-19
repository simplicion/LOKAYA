"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { X, Loader2 } from 'lucide-react';
import { useGetPostLikesQuery, useGetReelLikesQuery } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';

export function LikesBottomSheet({ isOpen, onClose, targetId, type }: { isOpen: boolean; onClose: () => void; targetId: string; type: 'post' | 'reel' }) {
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [brokenAvatars, setBrokenAvatars] = useState<Record<string, boolean>>({});

  const { data: postLikes, isLoading: isPostLoading } = useGetPostLikesQuery(targetId, { skip: !isOpen || type !== 'post' });
  const { data: reelLikes, isLoading: isReelLoading } = useGetReelLikesQuery(targetId, { skip: !isOpen || type !== 'reel' });
  
  const likes = type === 'post' ? postLikes : reelLikes;
  const isLoading = type === 'post' ? isPostLoading : isReelLoading;

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleProfileNavigation = (user: any) => {
    if (!user) return;
    onClose();

    if (currentUser?.id && user.id === currentUser.id) {
      router.push('/profile');
      return;
    }

    const storeId = user.stores?.[0]?.storeId || user.stores?.[0]?.store?.id;
    if (storeId) {
      router.push(`/store/${storeId}`);
      return;
    }

    if (user.id) {
      router.push(`/user/${user.id}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white w-full rounded-t-[28px] flex flex-col max-h-[75vh] animate-in slide-in-from-bottom duration-300 ease-out shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold text-[#171717]">Likes</h3>
            <span className="text-[13px] font-semibold text-gray-500 tabular-nums">
              ({likes?.length || 0})
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

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 pb-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-6 h-6 text-[#FF5A36] animate-spin" />
              <p className="text-xs text-gray-400 font-medium">Loading likes...</p>
            </div>
          ) : likes?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-900 font-semibold text-sm">No likes yet</p>
              <p className="text-gray-400 text-xs mt-0.5">Be the first to like this content!</p>
            </div>
          ) : (
            likes?.map((like: any) => {
              const userName = like.user?.name || 'User';
              const initialChar = userName.trim().charAt(0).toUpperCase() || 'U';
              const avatarUrl = like.user?.avatarUrl;
              const hasBrokenAvatar = brokenAvatars[like.id] || !avatarUrl;
              const isSeller = Boolean(like.user?.stores?.[0]?.storeId || like.user?.stores?.[0]?.store?.id);

              return (
                <div key={like.id} className="flex items-center justify-between py-1">
                  <button
                    type="button"
                    onClick={() => handleProfileNavigation(like.user)}
                    className="flex items-center gap-3 group text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-stone-100 border border-orange-100 overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:ring-2 group-hover:ring-[#FF5A36]/30 transition-all">
                      {!hasBrokenAvatar ? (
                        <img 
                          src={getMediaUrl(avatarUrl)} 
                          alt={userName} 
                          className="w-full h-full object-cover" 
                          onError={() => setBrokenAvatars(prev => ({ ...prev, [like.id]: true }))}
                        />
                      ) : (
                        <span className="font-bold text-[14px] text-[#FF5A36] select-none">
                          {initialChar}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[14px] text-[#171717] group-hover:underline">
                        {userName}
                      </span>
                      {isSeller && (
                        <span className="text-[10px] text-emerald-600 font-medium">Seller</span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
