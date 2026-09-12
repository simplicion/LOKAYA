'use client';

import React, { useState } from 'react';
import { X, Check, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { useCreateHighlightMutation } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreateHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  initialStoryIds?: string[];
  availableStories?: any[];
}

export function CreateHighlightModal({
  isOpen,
  onClose,
  storeId,
  initialStoryIds = [],
  availableStories = []
}: CreateHighlightModalProps) {
  const [title, setTitle] = useState('');
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>(initialStoryIds);
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createHighlight] = useCreateHighlightMutation();

  const toggleSelectStory = (id: string) => {
    setSelectedStoryIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      // If coverUrl is not set or was unselected, default to first selected
      if (!coverUrl || !next.includes(id)) {
        const firstStory = availableStories.find(s => next.includes(s.id));
        setCoverUrl(firstStory?.mediaUrl || '');
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title for your highlight (e.g., "Best Sellers")');
      return;
    }
    if (selectedStoryIds.length === 0) {
      toast.error('Select at least one story for this highlight');
      return;
    }

    setIsSubmitting(true);
    try {
      await createHighlight({
        storeId,
        title: title.trim(),
        coverUrl: coverUrl || undefined,
        storyIds: selectedStoryIds,
      }).unwrap();

      toast.success(`Highlight "${title}" added to your profile!`);
      onClose();
    } catch (err: any) {
      console.error('Failed to create highlight:', err);
      toast.error(err?.data?.message || err?.message || 'Failed to create highlight');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FF5A36]" />
            <h3 className="font-bold text-base text-[#171717]">New Highlight</h3>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Highlight Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-700">Highlight Title</label>
            <input 
              type="text"
              placeholder="e.g. Best Sellers, Reviews, Outfits"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={30}
              className="w-full text-sm font-semibold border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#FF5A36] transition-colors"
            />
          </div>

          {/* Select Stories from Archive */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">
                Choose Stories ({selectedStoryIds.length} selected)
              </label>
              <span className="text-[11px] text-gray-400">Tap to select / unselect</span>
            </div>

            {availableStories.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-400">
                No stories found in your archive. Upload stories from the Home feed first!
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1 rounded-xl bg-gray-50 border border-gray-100">
                {availableStories.map((story) => {
                  const isSelected = selectedStoryIds.includes(story.id);

                  return (
                    <div 
                      key={story.id}
                      onClick={() => toggleSelectStory(story.id)}
                      className={cn(
                        "aspect-[9/16] rounded-xl relative overflow-hidden cursor-pointer border-2 transition-all group",
                        isSelected ? "border-[#FF5A36] shadow-sm" : "border-transparent"
                      )}
                    >
                      <img src={story.mediaUrl} alt="Story thumbnail" className="w-full h-full object-cover" />
                      
                      <div className="absolute top-1.5 right-1.5">
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected ? "bg-[#FF5A36] border-white text-white" : "border-white/80 bg-black/40"
                        )}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white drop-shadow-md">
                        {story.createdAt ? new Date(story.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center gap-3">
          <button 
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleCreate}
            disabled={!title.trim() || selectedStoryIds.length === 0 || isSubmitting}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FF6B00] to-[#FF0000] text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Save Highlight</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
