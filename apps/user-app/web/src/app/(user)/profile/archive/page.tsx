'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Eye, Heart, Plus, Sparkles, Check, Loader2, AlertCircle } from 'lucide-react';
import { useGetStoryArchiveQuery, useGetMyStoreQuery } from '@/lib/api';
import { StoryViewerModal } from '@/components/feed/StoryViewerModal';
import { CreateHighlightModal } from '@/components/profile/CreateHighlightModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function StoryArchivePage() {
  const router = useRouter();
  const { data: myStore } = useGetMyStoreQuery();
  const { data: archiveStories, isLoading, refetch } = useGetStoryArchiveQuery();

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [isHighlightModalOpen, setIsHighlightModalOpen] = useState(false);

  // Story viewer state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerStoryIndex, setViewerStoryIndex] = useState(0);

  const toggleSelectStory = (storyId: string) => {
    if (selectedStoryIds.includes(storyId)) {
      setSelectedStoryIds(prev => prev.filter(id => id !== storyId));
    } else {
      setSelectedStoryIds(prev => [...prev, storyId]);
    }
  };

  const handleStoryCardClick = (index: number, storyId: string) => {
    if (isSelectMode) {
      toggleSelectStory(storyId);
    } else {
      setViewerStoryIndex(index);
      setIsViewerOpen(true);
    }
  };

  const handleStartHighlight = () => {
    if (selectedStoryIds.length === 0) {
      toast.info('Select at least one archived story to create a highlight');
      return;
    }
    setIsHighlightModalOpen(true);
  };

  // Convert archive stories into viewer store group format
  const viewerGroup = archiveStories ? [{
    storeId: myStore?.id || 'archive',
    storeName: myStore?.name || 'My Archive',
    storeAvatar: myStore?.logoUrl || '',
    isVerified: myStore?.status === 'VERIFIED',
    stories: archiveStories.map(s => ({
      id: s.id,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      caption: s.caption,
      product: s.product ? {
        id: s.product.id,
        name: s.product.name,
        image: s.product.imageUrl || '',
        price: `₹${s.product.sellingPrice}`,
      } : null,
      createdAt: s.createdAt,
      viewsCount: s.viewsCount,
      likesCount: s.likesCount,
    }))
  }] : [];

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-[#171717]" />
          </button>
          <div>
            <h1 className="font-bold text-lg text-[#171717]">Stories Archive</h1>
            <p className="text-[11px] text-gray-500 font-medium">30-day retention storage</p>
          </div>
        </div>

        <button 
          onClick={() => {
            setIsSelectMode(!isSelectMode);
            if (isSelectMode) setSelectedStoryIds([]);
          }}
          className={cn(
            "text-xs font-bold px-3 py-1.5 rounded-full transition-colors",
            isSelectMode 
              ? "bg-gray-200 text-gray-800" 
              : "bg-[#FF5A36]/10 text-[#FF5A36] hover:bg-[#FF5A36]/20"
          )}
        >
          {isSelectMode ? 'Cancel' : 'Select'}
        </button>
      </div>

      {/* 30-Day Retention Notice Banner */}
      <div className="mx-4 my-3 p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5">
        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">30-Day Retention Policy:</span> Stories in your archive are stored for 30 days. After 30 days, they are automatically purged from cloud storage. To preserve stories indefinitely, add them to your <span className="font-bold underline">Highlights</span>.
        </div>
      </div>

      {/* Grid of Archived Stories */}
      <div className="px-4 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="w-7 h-7 text-[#FF5A36] animate-spin" />
            <span className="text-xs font-medium">Loading your story archive...</span>
          </div>
        ) : !archiveStories || archiveStories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-[#FF5A36] mb-3">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-[#171717] text-base mb-1">No Archived Stories</h3>
            <p className="text-xs text-gray-500 max-w-xs leading-normal">
              Stories you post will automatically appear here once their 24-hour public duration finishes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {archiveStories.map((story: any, index: number) => {
              const isSelected = selectedStoryIds.includes(story.id);

              return (
                <div 
                  key={story.id}
                  onClick={() => handleStoryCardClick(index, story.id)}
                  className="aspect-[9/16] relative bg-gray-900 rounded-xl overflow-hidden cursor-pointer group shadow-sm"
                >
                  {story.mediaType === 'video' || story.mediaType === 'VIDEO' ? (
                    <video src={story.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={story.mediaUrl} alt="Archived Story" className="w-full h-full object-cover" />
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

                  {/* Top: Days remaining badge */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                    {story.daysRemaining}d left
                  </div>

                  {/* Checkbox in select mode */}
                  {isSelectMode && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected 
                          ? "bg-[#FF5A36] border-white text-white" 
                          : "border-white/90 bg-black/40"
                      )}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  )}

                  {/* Bottom: Date & Metrics */}
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <span className="text-[10px] font-bold block drop-shadow-sm">
                      {new Date(story.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[9px] text-white/90 font-medium">
                      <span className="flex items-center gap-0.5">
                        <Eye className="w-3 h-3" /> {story.viewsCount || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Heart className="w-3 h-3" /> {story.likesCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Bar when selecting stories */}
      {isSelectMode && selectedStoryIds.length > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40 bg-[#171717] text-white rounded-2xl p-3.5 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div>
            <p className="text-xs font-bold">{selectedStoryIds.length} {selectedStoryIds.length === 1 ? 'story' : 'stories'} selected</p>
            <p className="text-[10px] text-gray-400">Add to your profile highlights</p>
          </div>

          <button 
            onClick={handleStartHighlight}
            className="bg-gradient-to-r from-[#FF6B00] to-[#FF0000] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Create Highlight
          </button>
        </div>
      )}

      {/* Story Viewer Modal for Archive */}
      {isViewerOpen && (
        <StoryViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          groups={viewerGroup}
          initialGroupIndex={0}
          initialStoryIndex={viewerStoryIndex}
          title="Archive Story"
        />
      )}

      {/* Create Highlight Modal */}
      {isHighlightModalOpen && myStore && (
        <CreateHighlightModal
          isOpen={isHighlightModalOpen}
          onClose={() => {
            setIsHighlightModalOpen(false);
            setIsSelectMode(false);
            setSelectedStoryIds([]);
          }}
          storeId={myStore.id}
          initialStoryIds={selectedStoryIds}
          availableStories={archiveStories || []}
        />
      )}
    </div>
  );
}
