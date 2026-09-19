'use client';

import React from 'react';
import { StoriesBar } from '@/components/feed/StoriesBar';
import { FeedUploadProgressBar } from '@/components/feed/FeedUploadProgressBar';
import { SocialPost } from '@/components/feed/SocialPost';
import { useGetPostsQuery, useGetMyStoreQuery } from '@/lib/api';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Sparkles, PlusCircle, Compass, Heart } from 'lucide-react';
import Link from 'next/link';
import { AdaptiveSkeleton } from '@/components/ui/AdaptiveSkeleton';
import { formatTimeAgo } from '@/lib/utils';

export default function SocialHomePage() {
  const { data: serverPosts, isLoading } = useGetPostsQuery();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: myStore } = useGetMyStoreQuery(undefined, { skip: !user });

  const postsToRender = (serverPosts && serverPosts.length > 0)
    ? serverPosts.map((p) => ({
        id: p.id,
        authorId: p.authorId,
        storeId: p.storeId,
        storeName: p.storeName,
        storeAvatar: p.storeAvatar,
        isVerified: p.isVerified,
        createdAt: p.createdAt,
        timeAgo: formatTimeAgo(p.createdAt),
        media: p.media && p.media.length > 0 ? p.media : [],
        likes: p.likes || '0',
        likesCount: p.likesCount || 0,
        isLikedByMe: p.isLikedByMe,
        isSavedByMe: p.isSavedByMe,
        comments: p.comments || '0',
        shares: p.shares || '0',
        caption: p.caption || '',
        hashtags: p.hashtags || [],
        product: p.product,
      }))
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] pb-20">
      {/* Main Scrollable Area */}
      <div className="flex-1 mt-0">
        {/* Stories Bar with 100% live backend data */}
        <StoriesBar />
        
        {/* Instagram-style real-time upload progress banner */}
        <FeedUploadProgressBar />

        {/* Loading Skeleton */}
        {isLoading && (
          <AdaptiveSkeleton variant="feed-post" count={2} />
        )}

        {/* Feed Container */}
        {!isLoading && postsToRender.length > 0 && (
          <div className="flex flex-col pb-4">
            {postsToRender.map((post) => (
              <SocialPost key={post.id} {...post} />
            ))}
          </div>
        )}

        {/* Empty State when no posts yet */}
        {!isLoading && postsToRender.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mb-4 text-[#FF5A36] shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#171717]">Welcome to Lokaya!</h3>
            <p className="text-xs text-[#6B6B6B] max-w-xs mt-1 leading-relaxed">
              {myStore
                ? 'No posts in your feed yet. Be the first seller to share your products with local customers!'
                : 'No posts in your feed yet. Discover and follow your favorite local artisan stores to see their latest updates!'}
            </p>
            {myStore ? (
              <Link 
                href="/profile/create/post" 
                className="mt-5 inline-flex items-center gap-2 bg-[#FF5A36] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md hover:bg-[#E04B28] active:scale-95 transition"
              >
                <PlusCircle className="w-4 h-4" />
                Create First Post
              </Link>
            ) : (
              <Link 
                href="/explore" 
                className="mt-5 inline-flex items-center gap-2 bg-[#FF5A36] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-md hover:bg-[#E04B28] active:scale-95 transition"
              >
                <Compass className="w-4 h-4" />
                Explore Stores
              </Link>
            )}
          </div>
        )}

        {/* End of Feed Watermark */}
        <div className="flex flex-col items-center justify-center py-8 pb-12 opacity-80">
          <p className="text-xs font-bold text-[#999999] tracking-wide uppercase flex items-center justify-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-[#FF5A36] fill-[#FF5A36]" /> for local communities
          </p>
        </div>
      </div>
    </div>
  );
}