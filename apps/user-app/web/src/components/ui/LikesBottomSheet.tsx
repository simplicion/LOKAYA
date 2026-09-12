"use client";

import React, { useEffect } from 'react';
import { X, User } from 'lucide-react';
import { useGetPostLikesQuery, useGetReelLikesQuery } from '@/lib/api';

export function LikesBottomSheet({ isOpen, onClose, targetId, type }: { isOpen: boolean; onClose: () => void; targetId: string; type: 'post' | 'reel' }) {
  const { data: postLikes, isLoading: isPostLoading } = useGetPostLikesQuery(targetId, { skip: !isOpen || type !== 'post' });
  const { data: reelLikes, isLoading: isReelLoading } = useGetReelLikesQuery(targetId, { skip: !isOpen || type !== 'reel' });
  
  const likes = type === 'post' ? postLikes : reelLikes;
  const isLoading = type === 'post' ? isPostLoading : isReelLoading;

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white w-full rounded-t-[24px] flex flex-col max-h-[80vh] animate-in slide-in-from-bottom duration-300 ease-out shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-[17px] font-bold text-[#171717]">Likes</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : likes?.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No likes yet.</p>
          ) : (
            likes?.map((like: any) => (
              <div key={like.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  {like.user.avatarUrl ? <img src={like.user.avatarUrl} alt={like.user.name} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-400" />}
                </div>
                <span className="font-semibold text-[15px] text-[#171717]">{like.user.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
