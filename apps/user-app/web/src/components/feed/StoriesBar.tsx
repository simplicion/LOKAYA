'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useGetStoriesFeedQuery, useGetMyStoreQuery } from '@/lib/api';
import { StoryViewerModal, StoryViewerStoreGroup } from './StoryViewerModal';
import { StoryUploadModal } from './StoryUploadModal';
import { cn, getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

export function StoriesBar() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = Boolean(user);
  
  const { data: serverFeed, isLoading } = useGetStoriesFeedQuery();
  const { data: myStore } = useGetMyStoreQuery(undefined, { skip: !isAuthenticated });

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleCloseViewer = React.useCallback(() => {
    setIsViewerOpen(false);
  }, []);

  // Use live feed from backend exclusively
  const feedGroups: StoryViewerStoreGroup[] = serverFeed || [];

  // Check if my store has active stories in the current feed
  const myStoreGroupIndex = feedGroups.findIndex(g => myStore && g.storeId === myStore.id);
  const myStoreHasActiveStories = myStoreGroupIndex !== -1;
  const myStoreGroup = myStoreHasActiveStories ? feedGroups[myStoreGroupIndex] : null;
  const myLatestStoryMedia = myStoreGroup?.stories?.[0]?.mediaUrl;
  const myStoryPreviewUrl = myLatestStoryMedia || myStore?.logoUrl;

  const handleOpenMyStory = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated || !user) {
      toast.info('Please log in to share stories with your followers');
      router.push('/login?redirect=/home');
      return;
    }

    if (!myStore) {
      toast.info('Set up a seller store to start sharing stories with customers!');
      router.push('/seller/onboarding');
      return;
    }

    if (myStoreHasActiveStories) {
      setSelectedGroupIndex(myStoreGroupIndex);
      setIsViewerOpen(true);
    } else {
      setIsUploadOpen(true);
    }
  };

  const handleAddStoryBadge = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated || !user) {
      toast.info('Please log in to share stories with your followers');
      router.push('/login?redirect=/home');
      return;
    }

    if (!myStore) {
      toast.info('Set up a seller store to start sharing stories with customers!');
      router.push('/seller/onboarding');
      return;
    }
    setIsUploadOpen(true);
  };

  const handleOpenStoreStory = (index: number) => {
    setSelectedGroupIndex(index);
    setIsViewerOpen(true);
  };

  return (
    <div className="w-full bg-[#FAF9F6] pt-1 pb-3">
      <div className="flex gap-3.5 overflow-x-auto px-4 snap-x no-scrollbar items-start">
        
        {/* "Your Story" item for Authenticated Sellers with a Store */}
        {isAuthenticated && user && myStore && (
          <div className="snap-start shrink-0 w-[calc(25vw-20px)] max-w-[76px] flex flex-col items-center gap-1 cursor-pointer group">
            <div className="relative w-full aspect-square" onClick={handleOpenMyStory}>
              {/* Ring */}
              <div className={cn(
                "w-full h-full rounded-full flex items-center justify-center p-[2px] transition-transform group-active:scale-95",
                myStoreHasActiveStories 
                  ? "bg-gradient-to-tr from-[#FF6B00] via-[#FF0055] to-[#FF0000]" 
                  : "border-2 border-dashed border-gray-300"
              )}>
                <div className="w-full h-full bg-[#FAF9F6] rounded-full p-[2px]">
                  <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden relative">
                    {myStoryPreviewUrl ? (
                      <img 
                        src={getMediaUrl(myStoryPreviewUrl)} 
                        alt={myStore?.name || 'Your Story'} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-orange-100 text-[#FF5A36] font-bold text-xs">
                        {myStore?.name ? myStore.name.slice(0, 2).toUpperCase() : 'YOU'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Plus Badge */}
              <div 
                onClick={handleAddStoryBadge}
                className="absolute bottom-0 right-0 w-5 h-5 bg-[#FF5A36] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 active:scale-90 transition-transform"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            <span className="text-[11px] font-medium text-[#171717] mt-1 w-full truncate text-center px-0.5">
              Your Story
            </span>
          </div>
        )}

        {/* Other stores' active stories */}
        {feedGroups.map((group, index) => {
          // If this is my store and already displayed as "Your Story", skip duplicate
          if (myStore && group.storeId === myStore.id) return null;

          const storeThumbnail = group.storeAvatar || group.stories?.[0]?.mediaUrl;

          return (
            <div 
              key={group.storeId} 
              onClick={() => handleOpenStoreStory(index)}
              className="snap-start shrink-0 w-[calc(25vw-20px)] max-w-[76px] flex flex-col items-center gap-1 cursor-pointer group"
            >
              <div className="relative w-full aspect-square">
                {/* Gradient ring if unseen, neutral ring if all seen */}
                <div className={cn(
                  "w-full h-full rounded-full flex items-center justify-center p-[2px] transition-transform group-active:scale-95",
                  group.hasUnseen 
                    ? "bg-gradient-to-tr from-[#FF6B00] via-[#FF0055] to-[#FF0000]" 
                    : "bg-[#E5E2DC]"
                )}>
                  <div className="w-full h-full bg-[#FAF9F6] rounded-full p-[2px]">
                    <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden relative">
                      {storeThumbnail ? (
                        <img 
                          src={getMediaUrl(storeThumbnail)} 
                          alt={group.storeName} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-700 font-bold text-xs">
                          {group.storeName ? group.storeName.slice(0, 2).toUpperCase() : 'ST'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-medium text-[#171717] mt-1 w-full truncate text-center px-0.5">
                {group.storeName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      {isViewerOpen && feedGroups.length > 0 && (
        <StoryViewerModal
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
          groups={feedGroups}
          initialGroupIndex={selectedGroupIndex}
        />
      )}

      {/* Story Upload Modal for Seller */}
      {isUploadOpen && myStore && (
        <StoryUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          storeId={myStore.id}
          storeName={myStore.name}
          storeLogo={myStore.logoUrl}
        />
      )}
    </div>
  );
}
