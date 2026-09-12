'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Grid, PlaySquare, MapPin, Plus, CheckCircle2, Archive, PlusCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  useGetStoreHighlightsQuery, 
  useGetStorePostsQuery, 
  useGetStoreReelsQuery,
  useGetStoryArchiveQuery 
} from '@/lib/api';
import { CreateHighlightModal } from './CreateHighlightModal';
import { StoryViewerModal } from '../feed/StoryViewerModal';
import Link from 'next/link';

export function SellerProfile({ myStore, user }: { myStore: any, user: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [isCreateHighlightOpen, setIsCreateHighlightOpen] = useState(false);
  
  // Highlight viewer state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerHighlightStories, setViewerHighlightStories] = useState<any[]>([]);
  const [viewerHighlightTitle, setViewerHighlightTitle] = useState('');

  // Live queries
  const { data: highlights } = useGetStoreHighlightsQuery(myStore.id, { skip: !myStore?.id });
  const { data: storePosts } = useGetStorePostsQuery(myStore.id, { skip: !myStore?.id });
  const { data: storeReels } = useGetStoreReelsQuery(myStore.id, { skip: !myStore?.id });
  const { data: archiveStories } = useGetStoryArchiveQuery();

  const fallbackPosts = [
    { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' },
    { id: '2', type: 'image', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80' },
    { id: '3', type: 'image', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' },
    { id: '4', type: 'image', url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80' },
  ];

  const fallbackReels = [
    { id: '1', type: 'video', url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80' },
    { id: '2', type: 'video', url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&q=80' },
  ];

  const displayPosts = (storePosts && storePosts.length > 0) ? storePosts : fallbackPosts;
  const displayReels = (storeReels && storeReels.length > 0) ? storeReels : fallbackReels;
  const displayItems = activeTab === 'posts' ? displayPosts : displayReels;

  const handleOpenHighlight = (highlight: any) => {
    if (highlight.stories && highlight.stories.length > 0) {
      setViewerHighlightStories(highlight.stories);
      setViewerHighlightTitle(highlight.title);
      setIsViewerOpen(true);
    }
  };

  const highlightViewerGroup = [{
    storeId: myStore.id,
    storeName: myStore.name,
    storeAvatar: myStore.logoUrl || '',
    isVerified: myStore.status === 'VERIFIED',
    stories: viewerHighlightStories.map(s => ({
      id: s.id,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      caption: s.caption,
      product: s.product,
      createdAt: s.createdAt,
    }))
  }];

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Profile Header Info */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white border border-gray-200 p-0.5 shadow-sm shrink-0">
            {myStore.logoUrl ? (
              <Image src={myStore.logoUrl} alt={myStore.name} width={80} height={80} className="w-full h-full rounded-full object-cover" unoptimized />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-green-600 text-white font-bold text-[10px] text-center leading-tight px-1">
                {myStore.name.split(' ').slice(0,2).join('\n').toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex gap-6 pr-4">
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-[#171717]">{storePosts?.length ?? 128}</span>
              <span className="text-sm text-[#171717]">posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-[#171717]">1.2M</span>
              <span className="text-sm text-[#171717]">followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-[#171717]">294</span>
              <span className="text-sm text-[#171717]">following</span>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-[#171717] text-base">{myStore.name}</h2>
            {myStore.status === 'VERIFIED' && (
              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-current" />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5 mb-1.5">{myStore.description || "Official Online Store"} • {myStore.category || "Grocery & Essentials"}</p>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <span className="text-amber-400 mr-1 text-[15px]">★</span>
              4.8 (120+ ratings)
            </div>
            <div className="text-sm font-medium text-green-600">
              {myStore.openingTime && myStore.closingTime ? `Open ${myStore.openingTime} - ${myStore.closingTime}` : 'Open until 10:00 PM'}
            </div>
          </div>
          
          {myStore.address && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
              <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
              <span className="truncate">{myStore.address}</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons Row 1 */}
        <div className="flex items-center gap-2 mb-2">
          <Button 
            variant="outline" 
            className="flex-1 bg-[#F5F5F5] border-none text-[#171717] font-semibold h-9 px-2 rounded-lg hover:bg-gray-200"
            onClick={() => router.push('/seller')}
          >
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-[#F5F5F5] border-none text-[#171717] font-semibold h-9 px-2 rounded-lg hover:bg-gray-200"
            onClick={() => router.push('/profile/settings')}
          >
            Edit Store
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-[#F5F5F5] border-none text-[#171717] font-semibold h-9 px-2 rounded-lg hover:bg-gray-200"
            onClick={() => router.push(`/store/${myStore.id}`)}
          >
            Visit Store
          </Button>
        </div>

        {/* Action Buttons Row 2: Story Archive & New Post */}
        <div className="flex items-center gap-2">
          <Link 
            href="/profile/archive"
            className="flex-1 h-8 bg-orange-50 text-[#FF5A36] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 border border-orange-200 hover:bg-orange-100 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Story Archive</span>
          </Link>

          <Link 
            href="/profile/create/post"
            className="flex-1 h-8 bg-[#171717] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-black transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Post / Reel</span>
          </Link>
        </div>
      </div>
      
      {/* Highlights (Instagram Style) */}
      <div className="px-4 pb-4 overflow-x-auto no-scrollbar flex gap-4 items-start">
        {/* New Highlight Button */}
        <button 
          onClick={() => setIsCreateHighlightOpen(true)}
          className="flex flex-col items-center gap-1 shrink-0 group"
        >
          <div className="w-16 h-16 rounded-full border border-gray-300 p-0.5 group-active:scale-95 transition-transform">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center border border-dashed border-gray-400">
              <Plus className="w-6 h-6 text-[#171717]" />
            </div>
          </div>
          <span className="text-xs font-medium text-[#171717]">New</span>
        </button>

        {/* Live Highlights */}
        {highlights && highlights.length > 0 ? (
          highlights.map((highlight: any) => (
            <div 
              key={highlight.id} 
              onClick={() => handleOpenHighlight(highlight)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full border border-gray-300 p-0.5 group-active:scale-95 transition-transform">
                <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden relative">
                  {highlight.coverUrl ? (
                    <img src={highlight.coverUrl} alt={highlight.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                      {highlight.title.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium text-[#171717] max-w-[68px] truncate text-center">
                {highlight.title}
              </span>
            </div>
          ))
        ) : (
          /* Default mock highlights when fresh */
          ['Summer Sale', 'New Drop', 'Reviews'].map((label, i) => (
            <div 
              key={i} 
              onClick={() => setIsCreateHighlightOpen(true)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer opacity-70"
            >
              <div className="w-16 h-16 rounded-full border border-gray-300 p-0.5">
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                  <PlaySquare className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <span className="text-xs text-[#171717] max-w-[68px] truncate text-center">{label}</span>
            </div>
          ))
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex items-center border-t border-gray-200">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex-1 flex justify-center py-3 border-b-2 transition-colors ${activeTab === 'posts' ? 'border-[#171717]' : 'border-transparent text-gray-400'}`}
        >
          <Grid className={`w-6 h-6 ${activeTab === 'posts' ? 'text-[#171717]' : 'text-gray-400'}`} />
        </button>
        <button 
          onClick={() => setActiveTab('reels')}
          className={`flex-1 flex justify-center py-3 border-b-2 transition-colors ${activeTab === 'reels' ? 'border-[#171717]' : 'border-transparent text-gray-400'}`}
        >
          <PlaySquare className={`w-6 h-6 ${activeTab === 'reels' ? 'text-[#171717]' : 'text-gray-400'}`} />
        </button>
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-0.5">
        {displayItems.map((item: any, idx: number) => {
          const mediaUrl = item.url || item.videoUrl || item.media?.[0]?.url;
          const isVideo = item.type === 'video' || item.type === 'VIDEO';

          return (
            <div key={item.id || idx} className="aspect-square relative bg-gray-100 cursor-pointer overflow-hidden">
              {mediaUrl ? (
                <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">Media</div>
              )}
              {isVideo && (
                <div className="absolute top-2 right-2">
                  <PlaySquare className="w-4 h-4 text-white drop-shadow-md" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Highlight Modal */}
      {isCreateHighlightOpen && (
        <CreateHighlightModal
          isOpen={isCreateHighlightOpen}
          onClose={() => setIsCreateHighlightOpen(false)}
          storeId={myStore.id}
          availableStories={archiveStories || []}
        />
      )}

      {/* Story Viewer for Highlights */}
      {isViewerOpen && (
        <StoryViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          groups={highlightViewerGroup}
          title={viewerHighlightTitle}
        />
      )}
    </div>
  );
}
