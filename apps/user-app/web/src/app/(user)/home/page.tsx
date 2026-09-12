'use client';

import React from 'react';
import { StoriesBar } from '@/components/feed/StoriesBar';
import { SocialPost } from '@/components/feed/SocialPost';
import { StoryItemProps } from '@/components/feed/StoryItem';
import { MOCK_PRODUCTS } from '@/lib/mock/products';
import { useGetPostsQuery } from '@/lib/api';

// Fallback Mock Stories if fresh database has no stories yet
const MOCK_STORIES: StoryItemProps[] = [
  { id: '1', label: 'Live Shopping', imageUrl: 'https://i.pravatar.cc/150?img=1', type: 'live' },
  { id: '2', label: 'New Arrivals', imageUrl: 'https://i.pravatar.cc/150?img=2', type: 'new' },
  { id: '3', label: 'Summer Sale', imageUrl: 'https://i.pravatar.cc/150?img=3', type: 'sale' },
  { id: '4', label: 'Footwear', imageUrl: 'https://i.pravatar.cc/150?img=4', type: 'default', hasUnseen: true },
  { id: '5', label: 'Home Decor', imageUrl: 'https://i.pravatar.cc/150?img=5', type: 'default', hasUnseen: false },
  { id: '6', label: 'Accessories', imageUrl: 'https://i.pravatar.cc/150?img=6', type: 'default', hasUnseen: true },
];

// Fallback Mock Posts if fresh database has no posts yet
const MOCK_POSTS = Object.values(MOCK_PRODUCTS).map((product, index) => ({
  id: `mock-post-${index}`,
  storeName: product.store.name,
  storeAvatar: product.store.avatar,
  isVerified: product.store.verified,
  timeAgo: `${index + 1}h ago`,
  media: product.images.slice(0, 2).map((img) => ({
    type: 'image' as const,
    url: img,
  })),
  likes: Math.floor(Math.random() * 10000 + 1000).toLocaleString(),
  likesCount: Math.floor(Math.random() * 10000 + 1000),
  comments: Math.floor(Math.random() * 500 + 10).toString(),
  shares: Math.floor(Math.random() * 1000 + 50).toString(),
  caption: product.description.substring(0, 80) + '...',
  hashtags: [product.category.replace(/\s+/g, ''), product.store.name.replace(/\s+/g, '')],
  likedByText: `Liked by ${Math.floor(Math.random() * 50 + 1)}K people`,
  likedByAvatars: ['https://i.pravatar.cc/150?img=31', 'https://i.pravatar.cc/150?img=32', 'https://i.pravatar.cc/150?img=33'],
  product: {
    id: product.id,
    name: product.title,
    image: product.images[0],
    price: `₹${product.price}`,
    originalPrice: product.originalPrice ? `₹${product.originalPrice}` : undefined,
    discount: product.discountLabel,
  },
}));

export default function SocialHomePage() {
  const { data: serverPosts, isLoading } = useGetPostsQuery();

  const postsToRender = (serverPosts && serverPosts.length > 0)
    ? serverPosts.map((p, idx) => ({
        id: p.id,
        storeId: p.storeId,
        storeName: p.storeName,
        storeAvatar: p.storeAvatar,
        isVerified: p.isVerified,
        timeAgo: 'Recently',
        media: p.media && p.media.length > 0 ? p.media : [{ type: 'image' as const, url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600' }],
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
    : MOCK_POSTS;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] pb-20">
      {/* Main Scrollable Area */}
      <div className="flex-1 mt-0">
        {/* Stories Bar with live and fallback data */}
        <StoriesBar fallbackStories={MOCK_STORIES} />
        
        {/* Feed Container */}
        <div className="flex flex-col pb-4">
          {postsToRender.map((post) => (
            <SocialPost key={post.id} {...post} />
          ))}
        </div>

        {/* End of Feed Watermark */}
        <div className="flex flex-col items-center justify-center py-8 pb-12 opacity-80">
          <p className="text-xs font-bold text-[#999999] tracking-wide uppercase">Made with ❤️ in Delhi, India</p>
        </div>
      </div>
    </div>
  );
}