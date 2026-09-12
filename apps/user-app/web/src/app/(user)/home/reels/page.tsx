'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SocialReel, SocialReelProps } from '@/components/feed/SocialReel';
import { ChevronLeft } from 'lucide-react';
import { useGetReelsQuery } from '@/lib/api';

const MOCK_REELS: SocialReelProps[] = [
  {
    id: 'reel-1',
    authorId: 'mock-author-1',
    storeName: 'Gloow Beauty',
    storeAvatar: 'https://i.pravatar.cc/150?img=21',
    isVerified: true,
    timeAgo: '1h ago',
    videoUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800&auto=format&fit=crop',
    likes: '9,874',
    likesCount: 9874,
    comments: '142',
    shares: '380',
    caption: 'Radiant skin, every day ✨',
    hashtags: ['GloowBeauty', 'Skincare'],
    product: {
      id: 'mock-p1',
      name: 'Glow Boost Serum',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=200&auto=format&fit=crop',
      price: '₹1,199',
      originalPrice: '₹1,799',
      discount: '-33%'
    },
    duration: '0:15',
    currentTime: '0:08',
    progressPercent: 53
  },
  {
    id: 'reel-2',
    authorId: 'mock-author-2',
    storeName: 'Urban Threads',
    storeAvatar: 'https://i.pravatar.cc/150?img=11',
    isVerified: true,
    timeAgo: '3h ago',
    videoUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    likes: '14.2K',
    likesCount: 14200,
    comments: '341',
    shares: '890',
    caption: 'The perfect summer fit is here. Get yours before it sells out! 🔥',
    hashtags: ['SummerCollection', 'Streetwear'],
    product: {
      id: 'mock-p2',
      name: 'Oversized Graphic Tee',
      image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=200&auto=format&fit=crop',
      price: '₹899',
      originalPrice: '₹1,299',
      discount: '-30%'
    },
    duration: '0:30',
    currentTime: '0:12',
    progressPercent: 40
  }
];

export default function ReelsPage() {
  const router = useRouter();
  const { data: serverReels, isLoading } = useGetReelsQuery();

  const reelsToRender: SocialReelProps[] = (serverReels && serverReels.length > 0)
    ? serverReels.map((r: any) => ({
        id: r.id,
        authorId: r.authorId,
        storeId: r.storeId,
        storeName: r.storeName,
        storeAvatar: r.storeAvatar,
        isVerified: r.isVerified,
        timeAgo: 'Recently',
        videoUrl: r.videoUrl || r.media?.[0]?.url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800',
        likes: r.likes || '0',
        likesCount: r.likesCount || 0,
        isLikedByMe: r.isLikedByMe,
        comments: r.comments || '0',
        shares: r.shares || '0',
        caption: r.caption || '',
        hashtags: r.hashtags || [],
        product: r.product,
        duration: r.duration || '0:15',
        currentTime: r.currentTime || '0:00',
        progressPercent: r.progressPercent || 0,
      }))
    : MOCK_REELS;

  return (
    <div className="w-full h-[100dvh] bg-black overflow-y-scroll snap-y snap-mandatory no-scrollbar relative">
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="fixed top-safe left-4 mt-4 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-md z-50 text-white border border-white/10 shadow-lg hover:bg-black/60 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {reelsToRender.map((reel) => (
        <div key={reel.id} className="w-full h-[100dvh] snap-start relative">
          <SocialReel {...reel} />
        </div>
      ))}
    </div>
  );
}
