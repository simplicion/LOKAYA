'use client';

import React from 'react';
import { StoriesBar } from '@/components/feed/StoriesBar';
import { SocialPost } from '@/components/feed/SocialPost';
import { StoryItemProps } from '@/components/feed/StoryItem';

// Mock Data
const MOCK_STORIES: StoryItemProps[] = [
  { id: '1', label: 'Live Shopping', imageUrl: 'https://i.pravatar.cc/150?img=1', type: 'live' },
  { id: '2', label: 'New Arrivals', imageUrl: 'https://i.pravatar.cc/150?img=2', type: 'new' },
  { id: '3', label: 'Summer Sale', imageUrl: 'https://i.pravatar.cc/150?img=3', type: 'sale' },
  { id: '4', label: 'Footwear', imageUrl: 'https://i.pravatar.cc/150?img=4', type: 'default', hasUnseen: true },
  { id: '5', label: 'Home Decor', imageUrl: 'https://i.pravatar.cc/150?img=5', type: 'default', hasUnseen: false },
  { id: '6', label: 'Accessories', imageUrl: 'https://i.pravatar.cc/150?img=6', type: 'default', hasUnseen: true },
];

const MOCK_POSTS = [
  {
    id: 'post-1',
    storeName: 'Sneak Peak',
    storeAvatar: 'https://i.pravatar.cc/150?img=11',
    isVerified: true,
    timeAgo: '6h ago',
    media: [
      { type: 'video' as const, url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop', duration: '0:25' }
    ],
    likes: '15.2K',
    comments: '214',
    shares: '647',
    caption: 'Move in style. Built for comfort.',
    hashtags: ['SneakPeak', 'UrbanRunner'],
    likedByText: 'Liked by 15.2K people',
    likedByAvatars: ['https://i.pravatar.cc/150?img=31', 'https://i.pravatar.cc/150?img=32', 'https://i.pravatar.cc/150?img=33'],
    product: {
      name: 'Urban Runner Sneakers',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop',
      price: '₹2,999',
      originalPrice: '₹3,999',
      discount: '-25%'
    }
  },
  {
    id: 'post-2',
    storeName: 'Luxe Living',
    storeAvatar: 'https://i.pravatar.cc/150?img=12',
    isVerified: true,
    timeAgo: '4h ago',
    media: [
      { type: 'image' as const, url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1000&auto=format&fit=crop' },
      { type: 'image' as const, url: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=1000&auto=format&fit=crop' }
    ],
    likes: '8,765',
    comments: '95',
    shares: '412',
    caption: 'Transform your space with our modern ceramic collection. Minimalist design for any home.',
    hashtags: ['HomeDecor', 'Minimalist', 'InteriorDesign'],
    likedByText: 'Liked by 8.7K people',
    likedByAvatars: ['https://i.pravatar.cc/150?img=34', 'https://i.pravatar.cc/150?img=35'],
    product: {
      name: 'Modern Ceramic Vase',
      image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=200&auto=format&fit=crop',
      price: '₹899',
      originalPrice: '₹1,299',
      discount: '-31%'
    }
  }
];

export default function SocialHomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] pb-20">
      {/* Main Scrollable Area */}
      <div className="flex-1 mt-0">
        <StoriesBar stories={MOCK_STORIES} />
        
        {/* Feed Container */}
        <div className="flex flex-col pb-4">
          {MOCK_POSTS.map((post) => (
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
