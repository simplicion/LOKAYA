"use client";

import React, { useEffect, useState } from 'react';
import { X, User, Send } from 'lucide-react';
import { useGetPostCommentsQuery, useGetReelCommentsQuery, useAddPostCommentMutation, useAddReelCommentMutation } from '@/lib/api';

export function CommentsBottomSheet({ isOpen, onClose, targetId, type }: { isOpen: boolean; onClose: () => void; targetId: string; type: 'post' | 'reel' }) {
  const [content, setContent] = useState('');
  
  const { data: postComments, isLoading: isPostLoading } = useGetPostCommentsQuery(targetId, { skip: !isOpen || type !== 'post' });
  const { data: reelComments, isLoading: isReelLoading } = useGetReelCommentsQuery(targetId, { skip: !isOpen || type !== 'reel' });
  
  const [addPostComment, { isLoading: isAddingPost }] = useAddPostCommentMutation();
  const [addReelComment, { isLoading: isAddingReel }] = useAddReelCommentMutation();

  const comments = type === 'post' ? postComments : reelComments;
  const isLoading = type === 'post' ? isPostLoading : isReelLoading;
  const isAdding = type === 'post' ? isAddingPost : isAddingReel;

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isAdding) return;
    
    try {
      if (type === 'post') {
        await addPostComment({ postId: targetId, content }).unwrap();
      } else {
        await addReelComment({ reelId: targetId, content }).unwrap();
      }
      setContent('');
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white w-full rounded-t-[24px] flex flex-col h-[75vh] animate-in slide-in-from-bottom duration-300 ease-out shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-[17px] font-bold text-[#171717]">Comments</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 pb-20">
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Loading comments...</p>
          ) : comments?.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No comments yet. Be the first!</p>
          ) : (
            comments?.map((comment: any) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {comment.user.avatarUrl ? <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-[#171717]">{comment.user.name}</span>
                    <span className="text-[11px] text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[14px] text-gray-800 leading-snug mt-0.5">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 bg-white flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 flex items-center">
            <input 
              type="text" 
              placeholder="Add a comment..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-[14px] text-gray-800 placeholder:text-gray-500"
            />
          </div>
          <button type="submit" disabled={!content.trim() || isAdding} className="w-10 h-10 rounded-full bg-[#FF5A36] text-white flex items-center justify-center disabled:opacity-50 transition-colors">
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
