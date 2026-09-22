'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { 
  Grid, 
  PlaySquare, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  Loader2, 
  Star,
  Clock,
  Phone,
  Headphones,
  Truck,
  ShoppingBag,
  Tag,
  Sparkles
} from 'lucide-react';
import { 
  useGetStoreHighlightsQuery, 
  useGetStorePostsQuery, 
  useGetStoreReelsQuery,
  useGetStoryArchiveQuery,
  useGetStoreSummaryQuery,
  useGetStoreProductsQuery,
  useUploadMediaMutation,
  useGetPresignedUrlMutation,
  useUpdateStoreProfileMutation,
  useUpdateProfileMutation
} from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { toast } from 'sonner';
import { CreateHighlightModal } from './CreateHighlightModal';
import { StoryViewerModal } from '../feed/StoryViewerModal';
import { BlueTickVerificationSheet } from './BlueTickVerificationSheet';
import { cn, getMediaUrl, isVideoMedia } from '@/lib/utils';
import Link from 'next/link';

export function SellerProfile({ myStore, user }: { myStore: any, user: any }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();
  const [updateStoreProfile] = useUpdateStoreProfileMutation();
  const [updateProfile] = useUpdateProfileMutation();

  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [isCreateHighlightOpen, setIsCreateHighlightOpen] = useState(false);
  
  // Highlight viewer state
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerHighlightStories, setViewerHighlightStories] = useState<any[]>([]);
  const [viewerHighlightTitle, setViewerHighlightTitle] = useState('');

  // Live queries
  const { data: storeSummary } = useGetStoreSummaryQuery(myStore.id, { skip: !myStore?.id });
  const { data: storeProducts } = useGetStoreProductsQuery(myStore.id, { skip: !myStore?.id });
  const { data: highlights } = useGetStoreHighlightsQuery(myStore.id, { skip: !myStore?.id });
  const { data: storePosts } = useGetStorePostsQuery(myStore.id, { skip: !myStore?.id });
  const { data: storeReels } = useGetStoreReelsQuery(myStore.id, { skip: !myStore?.id });
  const { data: archiveStories } = useGetStoryArchiveQuery();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !myStore?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      let finalUrl = '';
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadMedia(formData).unwrap();
        finalUrl = res.publicUrl || res.url;
      } catch (directErr) {
        const ext = file.name.split('.').pop() || 'jpg';
        const { uploadUrl, signedUrl, publicUrl } = await getPresignedUrl({
          contentType: file.type,
          filename: `avatar-${Date.now()}.${ext}`,
        }).unwrap();
        const targetUrl = uploadUrl || signedUrl;
        await fetch(targetUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        finalUrl = publicUrl;
      }

      if (!finalUrl) throw new Error('Upload failed');

      await updateStoreProfile({
        storeId: myStore.id,
        body: { logoUrl: finalUrl }
      }).unwrap();

      try {
        const userRes = await updateProfile({ avatarUrl: finalUrl }).unwrap();
        if (userRes?.user) {
          dispatch(setCredentials({ user: userRes.user }));
        }
      } catch (uErr) {
        console.warn('Could not sync user avatar:', uErr);
      }

      toast.success('Profile picture updated!');
    } catch (err: any) {
      console.error('Avatar update failed:', err);
      toast.error(err?.data?.message || err?.message || 'Failed to update profile picture');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const resolvedAvatar = myStore?.logoUrl || user?.avatarUrl;

  const avgRating = storeSummary?.avgRating ?? 0;
  const reviewCount = storeSummary?.reviewCount ?? 0;
  const isOpen = storeSummary?.isOpen ?? true;
  const openingTime = myStore?.openingTime || storeSummary?.store?.openingTime;
  const closingTime = myStore?.closingTime || storeSummary?.store?.closingTime;
  const hasHours = Boolean(openingTime || closingTime || storeSummary?.timingLabel);
  const timingLabel = storeSummary?.timingLabel || (hasHours ? (isOpen ? 'Open Now' : 'Closed') : '');

  const isStoreLive = myStore?.isActive ?? storeSummary?.store?.isActive ?? true;
  const isVerified = Boolean((myStore?.isVerified && myStore?.verificationStatus === 'APPROVED') || (storeSummary?.store?.isVerified && storeSummary?.store?.verificationStatus === 'APPROVED'));
  const verificationStatus = myStore?.verificationStatus || storeSummary?.store?.verificationStatus || (isVerified ? 'APPROVED' : 'NOT_APPLIED');
  const [isBlueTickSheetOpen, setIsBlueTickSheetOpen] = useState(false);

  const storeCategory = myStore?.category || storeSummary?.store?.category;
  const contactPhone = myStore?.contactPhone || storeSummary?.store?.contactPhone;
  const acceptedPayments = myStore?.acceptedPayments || storeSummary?.store?.acceptedPayments || ['ONLINE PAYMENT', 'CASH'];
  const acceptsOnline = Array.isArray(acceptedPayments) ? acceptedPayments.includes('ONLINE PAYMENT') : true;

  const displayAddress = (myStore?.address && myStore.address !== 'Address not provided')
    ? myStore.address
    : [myStore?.city, myStore?.state].filter(Boolean).join(', ');

  const allPosts = storePosts || [];
  const allReels = storeReels || [];

  const videoPostsAsReels = allPosts
    .filter((p: any) => p.type === 'video' || p.media?.some((m: any) => m.type === 'VIDEO' || m.type === 'video'))
    .map((p: any) => {
      const vidMedia = p.media?.find((m: any) => m.type === 'VIDEO' || m.type === 'video') || p.media?.[0];
      return {
        id: p.id,
        authorId: p.authorId,
        caption: p.caption,
        videoUrl: vidMedia?.url || p.url || '',
        url: vidMedia?.url || p.url || '',
        posterUrl: vidMedia?.posterUrl || p.posterUrl || '',
        status: vidMedia?.status || p.status || 'READY',
        isOptimizing: (vidMedia?.status || p.status) === 'PROCESSING' || (vidMedia?.status || p.status) === 'PENDING',
        media: p.media,
        type: 'video',
        likesCount: p.likesCount || 0,
        commentsCount: p.commentsCount || 0,
        createdAt: p.createdAt,
      };
    });

  const combinedReelsMap = new Map<string, any>();
  [...allReels, ...videoPostsAsReels].forEach(r => {
    if (r.id && !(r.status === 'FAILED' && !r.videoUrl && !r.url)) {
      combinedReelsMap.set(r.id, r);
    }
  });

  const displayPosts = allPosts;
  const displayReels = Array.from(combinedReelsMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
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
    isVerified: isVerified,
    stories: viewerHighlightStories.map(s => ({
      id: s.id,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      caption: s.caption,
      product: s.product,
      createdAt: s.createdAt,
    }))
  }];

  const formatCount = (count?: number | null) => {
    const num = count || 0;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return num.toString();
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Profile Header Info */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="relative group">
            <input 
              type="file" 
              ref={avatarInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />
            <div 
              className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-gray-200 p-0.5 shadow-sm shrink-0 relative"
            >
              {resolvedAvatar ? (
                <img 
                  src={getMediaUrl(resolvedAvatar)} 
                  alt={myStore.name} 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center bg-green-600 text-white font-bold text-[10px] text-center leading-tight px-1">
                  {myStore.name.split(' ').slice(0,2).join('\n').toUpperCase()}
                </div>
              )}

              {/* Upload Spinner Overlay */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-full z-10">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-6 pr-4">
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-[#171717]">
                {formatCount(
                  (storePosts?.length ?? 0) + (storeReels?.length ?? 0) ||
                  (storeSummary?.postsCount ?? 0) + (storeSummary?.reelsCount ?? 0)
                )}
              </span>
              <span className="text-sm text-[#171717]">posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-[#171717]">
                {formatCount(storeSummary?.followersCount ?? 0)}
              </span>
              <span className="text-sm text-[#171717]">followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-[#171717]">
                {formatCount(storeProducts?.length ?? storeSummary?.productsCount ?? 0)}
              </span>
              <span className="text-sm text-[#171717]">products</span>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          {/* Store Name & Category Badge */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="font-bold text-[#171717] text-base">{myStore.name}</h2>
            {isVerified && (
              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 text-white shrink-0 animate-in zoom-in duration-300" />
            )}
            {storeCategory && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-[#FF5A36] border border-orange-200/70">
                {storeCategory}
              </span>
            )}
          </div>

          {/* Description */}
          {myStore.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-1.5">
              {myStore.description}
            </p>
          )}

          {/* Timings & Ratings */}
          {(hasHours || (openingTime && closingTime) || reviewCount > 0) && (
            <div className="flex items-center gap-2.5 flex-wrap text-xs mb-1.5">
              {(hasHours || (openingTime && closingTime)) && (
                <span className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  isOpen ? "text-emerald-600" : "text-amber-600"
                )}>
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{timingLabel || (isOpen ? 'Open Now' : 'Closed')}</span>
                  {openingTime && closingTime && (
                    <span className="text-gray-400 font-normal">({openingTime} - {closingTime})</span>
                  )}
                </span>
              )}
              {reviewCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{avgRating.toFixed(1)}</span>
                  <span className="text-gray-400 font-normal">({reviewCount})</span>
                </span>
              )}
            </div>
          )}

          {/* Delivery & In-Store Operations */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
              <Truck className="w-3 h-3 text-blue-600" />
              <span>Delivery Available</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-purple-50 text-purple-700 border border-purple-200/60">
              <ShoppingBag className="w-3 h-3 text-purple-600" />
              <span>In-Store Pickup</span>
            </span>
          </div>

          {/* Contact Phone & Address */}
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            {contactPhone && (
              <a 
                href={`tel:${contactPhone}`} 
                className="inline-flex items-center gap-1 text-gray-600 hover:text-[#FF5A36] transition-colors group"
                title="Customer Support"
              >
                <Headphones className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF5A36] shrink-0" />
                <span className="font-medium text-gray-700 group-hover:text-[#FF5A36]">{contactPhone}</span>
              </a>
            )}

            {displayAddress && (
              <div className="flex items-center gap-1 text-gray-500">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                <span className="truncate max-w-[220px]">{displayAddress}</span>
              </div>
            )}
          </div>

          {/* Blue Tick Verification Strip (Request-based) */}
          {!isVerified && (
            <div className="mt-3">
              {verificationStatus === 'PENDING' ? (
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-amber-900">Blue Tick In Review</h4>
                        <span className="text-[10px] font-black bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">Pending Review</span>
                      </div>
                      <p className="text-[11px] text-amber-700 truncate">Application submitted to Verification Center.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/70 border border-blue-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-gray-900">Apply for Blue Tick Verification</h4>
                        <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Official</span>
                      </div>
                      <p className="text-[11px] text-gray-600 truncate">Get verified badge for profile & store</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsBlueTickSheetOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm shadow-blue-500/20 shrink-0 transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <button 
            onClick={() => router.push('/seller/dashboard')}
            className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition rounded-lg text-xs font-semibold text-[#171717]"
          >
            Dashboard
          </button>
          <button 
            onClick={() => router.push('/seller/settings')}
            className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition rounded-lg text-xs font-semibold text-[#171717]"
          >
            Edit Store
          </button>
          <button 
            onClick={() => router.push(`/store/${myStore.id}`)}
            className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition rounded-lg text-xs font-semibold text-[#171717]"
          >
            Visit Store
          </button>
        </div>
      </div>
      
      {/* Story Highlights Bar */}
      <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto no-scrollbar border-t border-gray-100">
        {/* Add Highlight Button */}
        <div 
          onClick={() => setIsCreateHighlightOpen(true)}
          className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-full border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
            <Plus className="w-6 h-6 text-gray-500" />
          </div>
          <span className="text-xs font-medium text-[#171717] max-w-[68px] truncate text-center">New</span>
        </div>

        {/* Real Highlight Circles */}
        {highlights && highlights.length > 0 && (
          highlights.map((highlight: any) => (
            <div 
              key={highlight.id} 
              onClick={() => handleOpenHighlight(highlight)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full border border-gray-300 p-0.5 group-active:scale-95 transition-transform">
                <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden relative">
                  {highlight.coverUrl ? (
                    <img src={getMediaUrl(highlight.coverUrl)} alt={highlight.title} className="w-full h-full object-cover" />
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
      {displayItems.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5">
          {displayItems.map((item: any, idx: number) => {
            const posterUrl = item.posterUrl || item.media?.[0]?.posterUrl;
            const mediaUrl = item.url || item.videoUrl || item.media?.[0]?.url;
            const isVideo = activeTab === 'reels' || item.type === 'video' || item.type === 'VIDEO' || isVideoMedia(mediaUrl) || item.media?.some((m: any) => m.type === 'VIDEO' || m.type === 'video' || isVideoMedia(m.url));
            const isOptimizing = item.isOptimizing || item.status === 'PROCESSING' || item.status === 'PENDING';

            const handleItemClick = () => {
              if (isVideo) {
                const vidMedia = item.media?.find((m: any) => m.type === 'VIDEO' || m.type === 'video') || item.media?.[0];
                const vUrl = item.videoUrl || item.url || vidMedia?.url || '';
                const pUrl = item.posterUrl || vidMedia?.posterUrl || '';
                const params = new URLSearchParams();
                params.set('id', item.id);
                if (vUrl) params.set('videoUrl', vUrl);
                if (pUrl) params.set('posterUrl', pUrl);
                if (myStore?.name) params.set('storeName', myStore.name);
                if (item.caption) params.set('caption', item.caption);
                router.push(`/home/reels?${params.toString()}`);
              } else {
                router.push('/home');
              }
            };

            const resolvedVideoSrc = mediaUrl ? (getMediaUrl(mediaUrl).includes('#t=') ? getMediaUrl(mediaUrl) : `${getMediaUrl(mediaUrl)}#t=0.1`) : '';

            return (
              <div 
                key={item.id || idx} 
                onClick={handleItemClick}
                className="aspect-square relative bg-gray-100 cursor-pointer overflow-hidden group"
              >
                {posterUrl ? (
                  <img src={getMediaUrl(posterUrl)} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : isVideo && resolvedVideoSrc ? (
                  <video src={resolvedVideoSrc} preload="metadata" className="w-full h-full object-cover group-hover:scale-105 transition-transform pointer-events-none" muted playsInline />
                ) : mediaUrl ? (
                  <img src={getMediaUrl(mediaUrl)} alt="Post" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">Media</div>
                )}

                {/* Video Indicator */}
                {isVideo && (
                  <div className="absolute top-2 right-2 z-10">
                    <PlaySquare className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                )}

                {/* Optimizing Status Badge */}
                {isOptimizing && (
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-500/40 text-[10px] font-semibold text-amber-300 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Optimizing</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
            {activeTab === 'posts' ? <Grid className="w-7 h-7" /> : <PlaySquare className="w-7 h-7" />}
          </div>
          <h4 className="text-sm font-bold text-[#171717]">
            {activeTab === 'posts' ? 'No posts yet' : 'No reels yet'}
          </h4>
          <p className="text-xs text-gray-500 max-w-xs mt-1">
            {activeTab === 'posts' 
              ? 'Share photos and tagged products with your followers.' 
              : 'Share short video reels showcasing your store and products.'}
          </p>
          <Link
            href="/profile/create/post"
            className="mt-4 bg-[#FF5A36] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-[#E04B28] active:scale-95 transition"
          >
            {activeTab === 'posts' ? '+ Create Post' : '+ Upload Reel'}
          </Link>
        </div>
      )}

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
      {isViewerOpen && (highlightViewerGroup?.[0]?.stories?.length || 0) > 0 && (
        <StoryViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          groups={highlightViewerGroup}
          title={viewerHighlightTitle}
        />
      )}

      {/* Blue Tick Verification Bottom Sheet */}
      <BlueTickVerificationSheet
        isOpen={isBlueTickSheetOpen}
        onClose={() => setIsBlueTickSheetOpen(false)}
        store={{
          id: myStore.id,
          name: myStore.name,
          logoUrl: resolvedAvatar,
          category: storeCategory
        }}
      />
    </div>
  );
}
