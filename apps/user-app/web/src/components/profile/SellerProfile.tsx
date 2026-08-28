'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Grid, PlaySquare, MapPin, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SellerProfile({ myStore, user }: { myStore: any, user: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  
  // Mock data
  const stats = {
    posts: 128,
    followers: '1.2M',
    following: 294
  };
  
  const mockPosts = [
    { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' },
    { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80' },
    { id: 3, type: 'image', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' },
    { id: 4, type: 'image', url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80' },
    { id: 5, type: 'image', url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80' },
    { id: 6, type: 'image', url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80' },
  ];
  
  const mockReels = [
    { id: 1, type: 'video', url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80' },
    { id: 2, type: 'video', url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&q=80' },
  ];

  const displayItems = activeTab === 'posts' ? mockPosts : mockReels;

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Profile Header Info */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white border border-gray-200 p-0.5 shadow-sm">
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
              <span className="font-bold text-lg text-[#171717]">{stats.posts}</span>
              <span className="text-sm text-[#171717]">posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-[#171717]">{stats.followers}</span>
              <span className="text-sm text-[#171717]">followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-[#171717]">{stats.following}</span>
              <span className="text-sm text-[#171717]">following</span>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-[#171717] text-base">{myStore.name}</h2>
            <CheckCircle2 className="w-4 h-4 text-blue-500 fill-current" />
          </div>
          <p className="text-sm text-gray-500 mt-0.5 mb-1.5">{myStore.description || "Har Ghar Ki Zaroorat"} • Grocery & Essentials</p>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <span className="text-amber-400 mr-1 text-[15px]">★</span>
              4.8 (120+ ratings)
            </div>
            <div className="text-sm font-medium text-green-600">
              Open until 10:00 PM
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
             {myStore.city && (
               <div className="flex items-center gap-1 text-sm text-gray-500">
                 <MapPin className="w-4 h-4" />
                 <span>{myStore.city}</span>
               </div>
             )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
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
      </div>
      
      {/* Highlights (Mock) */}
      <div className="px-4 pb-4 overflow-x-auto no-scrollbar flex gap-4">
        {/* New Highlight Button */}
        <button className="flex flex-col items-center gap-1 shrink-0">
           <div className="w-16 h-16 rounded-full border border-gray-300 p-0.5">
             <div className="w-full h-full rounded-full bg-white flex items-center justify-center border border-dashed border-gray-400">
               <Plus className="w-6 h-6 text-[#171717]" />
             </div>
           </div>
           <span className="text-xs text-[#171717]">New</span>
        </button>

        {[1,2,3,4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
             <div className="w-16 h-16 rounded-full border border-gray-300 p-0.5">
               <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                 <PlaySquare className="w-6 h-6 text-gray-400" />
               </div>
             </div>
             <span className="text-xs text-[#171717]">Highlights</span>
          </div>
        ))}
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
      
      {/* Grid */}
      <div className="grid grid-cols-3 gap-0.5">
        {displayItems.map((item) => (
          <div key={item.id} className="aspect-square relative bg-gray-100">
            <Image src={item.url} alt="Post" fill className="object-cover" unoptimized />
            {item.type === 'video' && (
              <div className="absolute top-2 right-2">
                <PlaySquare className="w-5 h-5 text-white drop-shadow-md" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
