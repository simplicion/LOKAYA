'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { 
  useGetUserPublicProfileQuery, 
  useFollowUserMutation,
  useGetStoreSummaryQuery,
  useGetStoreProductsQuery,
  useGetStoreHighlightsQuery,
  useGetStorePostsQuery,
  useGetStoreReelsQuery
} from '@/lib/api';
import { cn, getMediaUrl, isVideoMedia } from '@/lib/utils';
import { 
  ArrowLeft, 
  Share2, 
  Grid, 
  PlaySquare, 
  Store as StoreIcon, 
  CheckCircle2, 
  UserCheck, 
  UserPlus, 
  Loader2, 
  MapPin, 
  Calendar, 
  Clock, 
  Star, 
  Headphones, 
  Truck, 
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { ShareBottomSheet } from '@/components/ui/ShareBottomSheet';
import { StoryViewerModal } from '@/components/feed/StoryViewerModal';
import { toast } from 'sonner';

export default function UserPublicProfilePage({ params }: { params?: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const routeId = routeParams?.id as string | undefined;
  const pathId = typeof window !== 'undefined' 
    ? window.location.pathname.split('/user/')[1]?.split('/')[0]?.split('?')[0] 
    : undefined;

  const userId = (routeId && routeId !== '1') 
    ? routeId 
    : (pathId && pathId !== '1') 
      ? pathId 
      : (routeId || pathId || '');

  const currentUser = useSelector((state: RootState) => state.auth.user);

  // If viewing own profile, seamlessly redirect to /profile
  useEffect(() => {
    if (currentUser?.id && currentUser.id === userId) {
      router.replace('/profile');
    }
  }, [currentUser?.id, userId, router]);

  const { data: profile, isLoading, error } = useGetUserPublicProfileQuery(userId, {
    skip: !userId,
  });

  const [followUser, { isLoading: isTogglingFollow }] = useFollowUserMutation();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');

  // Story Highlight Viewer State
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerHighlightStories, setViewerHighlightStories] = useState<any[]>([]);
  const [viewerHighlightTitle, setViewerHighlightTitle] = useState('');

  const primaryStore = profile?.stores?.[0]?.store;
  const targetUserId = profile?.id || userId;

  // Additional live store queries if target user owns a store
  const { data: storeSummary } = useGetStoreSummaryQuery(primaryStore?.id, { 
    skip: !primaryStore?.id 
  });
  const { data: storeProducts } = useGetStoreProductsQuery(primaryStore?.id, { 
    skip: !primaryStore?.id 
  });
  const { data: storeHighlights } = useGetStoreHighlightsQuery(primaryStore?.id, { 
    skip: !primaryStore?.id 
  });
  const { data: storePosts } = useGetStorePostsQuery(primaryStore?.id, { 
    skip: !primaryStore?.id 
  });
  const { data: storeReels } = useGetStoreReelsQuery(primaryStore?.id, { 
    skip: !primaryStore?.id 
  });

  useEffect(() => {
    if (profile) {
      setIsFollowing(Boolean(profile.isFollowing));
      setFollowersCount(
        profile._count?.followers ?? storeSummary?.followersCount ?? 0
      );
    }
  }, [profile, storeSummary?.followersCount]);

  const handleToggleFollow = async () => {
    if (!currentUser) {
      toast.error('Please sign in to follow');
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/user/${userId}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowersCount(prev => nextState ? prev + 1 : Math.max(0, prev - 1));

    try {
      await followUser(targetUserId).unwrap();
    } catch (err: any) {
      setIsFollowing(!nextState);
      setFollowersCount(prev => !nextState ? prev + 1 : Math.max(0, prev - 1));
      toast.error(err?.data?.message || 'Failed to update follow status');
    }
  };

  const handleOpenHighlight = (highlight: any) => {
    if (highlight.stories && highlight.stories.length > 0) {
      setViewerHighlightStories(highlight.stories);
      setViewerHighlightTitle(highlight.title);
      setIsViewerOpen(true);
    }
  };

  const formatCount = (count?: number | null) => {
    const num = count || 0;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF5A36] flex items-center justify-center mb-4 shadow-sm">
          <StoreIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">This profile may have been removed or does not exist.</p>
        <button
          onClick={() => router.push('/home')}
          className="px-6 py-2.5 bg-[#FF5A36] text-white font-bold rounded-full text-sm hover:bg-[#e04f2f] transition-all shadow-md active:scale-95 cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  // Resolved store details
  const store = storeSummary?.store || primaryStore;
  const storeName = store?.name || profile.name || 'Profile';
  const resolvedAvatar = primaryStore?.logoUrl || store?.logoUrl || profile.avatarUrl;
  const initialChar = (profile.name || storeName || 'U').trim().charAt(0).toUpperCase();

  const isVerified = Boolean(
    (store?.isVerified && store?.verificationStatus === 'APPROVED') ||
    profile.isVerified
  );
  const storeCategory = store?.category || primaryStore?.category;
  const storeDescription = store?.description || profile.bio;
  const locationString = [profile.city, profile.state, store?.city, store?.state].filter(Boolean).slice(0, 2).join(', ');
  const displayAddress = (store?.address && store.address !== 'Address not provided') ? store.address : locationString;
  const contactPhone = store?.contactPhone;
  const openingTime = store?.openingTime;
  const closingTime = store?.closingTime;
  const isOpen = storeSummary?.isOpen ?? true;
  const hasHours = Boolean(openingTime || closingTime || storeSummary?.timingLabel);
  const timingLabel = storeSummary?.timingLabel || (hasHours ? (isOpen ? 'Open Now' : 'Closed') : '');
  const avgRating = storeSummary?.avgRating ?? 0;
  const reviewCount = storeSummary?.reviewCount ?? 0;

  // Merge posts and reels
  const allPosts = storePosts && storePosts.length > 0 ? storePosts : (profile.posts || []);
  const allReels = storeReels && storeReels.length > 0 ? storeReels : (profile.reels || []);

  const videoPostsAsReels = allPosts
    .filter((p: any) => p.type === 'video' || p.media?.some((m: any) => m.type === 'VIDEO' || m.type === 'video' || isVideoMedia(m.url)))
    .map((p: any) => {
      const vidMedia = p.media?.find((m: any) => m.type === 'VIDEO' || m.type === 'video' || isVideoMedia(m.url)) || p.media?.[0];
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
        likesCount: p.likesCount || p._count?.likes || 0,
        commentsCount: p.commentsCount || p._count?.comments || 0,
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

  const highlightViewerGroup = [{
    storeId: primaryStore?.id || '',
    storeName: storeName,
    storeAvatar: resolvedAvatar || '',
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

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24 text-[#171717]">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 2) {
              router.back();
            } else {
              router.push('/home');
            }
          }}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div className="flex items-center gap-1.5 min-w-0 max-w-[220px]">
          <span className="font-bold text-[15px] truncate text-[#171717]">
            {profile.name || storeName}
          </span>
          {isVerified && (
            <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 text-white shrink-0" />
          )}
        </div>

        <button
          onClick={() => setIsShareOpen(true)}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
          aria-label="Share Profile"
        >
          <Share2 className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      {/* Main Profile Info Section (Matching SellerProfile Aesthetics) */}
      <div className="px-4 pt-3 pb-4">
        {/* Avatar + Stats Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-gray-200 p-0.5 shadow-sm shrink-0 relative">
              {resolvedAvatar ? (
                <img 
                  src={getMediaUrl(resolvedAvatar)} 
                  alt={profile.name || storeName} 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-[#FF5A36] to-[#FF8C36] text-white font-black text-2xl shadow-inner">
                  {initialChar}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-6 sm:gap-8 pr-4">
            {/* Posts Count */}
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-[#171717]">
                {formatCount(
                  displayPosts.length + displayReels.length ||
                  (profile._count?.posts || 0) + (profile._count?.reels || 0)
                )}
              </span>
              <span className="text-xs text-gray-500 font-medium">posts</span>
            </div>

            {/* Followers Count (Only on profile page!) */}
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-[#171717]">
                {formatCount(followersCount)}
              </span>
              <span className="text-xs text-gray-500 font-medium">followers</span>
            </div>

            {/* Products or Following Count */}
            <div className="flex flex-col items-center">
              <span className="font-bold text-lg text-[#171717]">
                {primaryStore ? (
                  formatCount(storeProducts?.length ?? storeSummary?.productsCount ?? 0)
                ) : (
                  formatCount(profile._count?.following || 0)
                )}
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {primaryStore ? 'products' : 'following'}
              </span>
            </div>
          </div>
        </div>

        {/* Identity & Bio */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-bold text-[#171717] text-base leading-tight">
              {profile.name}
              {store?.name && store.name !== profile.name && (
                <span className="text-gray-500 font-normal text-xs ml-1.5">(@{store.name})</span>
              )}
            </h1>
            {isVerified && (
              <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 text-white shrink-0 animate-in zoom-in duration-300" />
            )}
            {storeCategory && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-[#FF5A36] border border-orange-200/70">
                {storeCategory}
              </span>
            )}
          </div>

          {storeDescription && (
            <p className="text-sm text-gray-700 leading-relaxed mb-2 break-words">
              {storeDescription}
            </p>
          )}

          {/* Timings & Ratings (for sellers) */}
          {(hasHours || (openingTime && closingTime) || reviewCount > 0) && (
            <div className="flex items-center gap-2.5 flex-wrap text-xs mb-2">
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

          {/* Delivery Operations Badges (for sellers) */}
          {primaryStore && (
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
          )}

          {/* Contact Support & Address */}
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
                <span className="truncate max-w-[240px]">{displayAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-2.5">
          {/* Follow / Following Button */}
          <button
            onClick={handleToggleFollow}
            disabled={isTogglingFollow}
            className={cn(
              "flex-1 h-9 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer shadow-xs",
              isFollowing
                ? "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
                : "bg-[#FF5A36] text-white hover:bg-[#e04d2d] shadow-orange-500/20"
            )}
          >
            {isTogglingFollow ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isFollowing ? (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Following</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Follow</span>
              </>
            )}
          </button>

          {/* Visit Store Button (If user is a seller) */}
          {primaryStore && (
            <button
              onClick={() => router.push(`/store/${primaryStore.id}`)}
              className="flex-1 h-9 rounded-lg border border-gray-200 font-bold text-xs text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer shadow-2xs"
            >
              <StoreIcon className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Visit Store</span>
            </button>
          )}

          {/* Share Button */}
          <button
            onClick={() => setIsShareOpen(true)}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Story Highlights Bar (if available) */}
      {storeHighlights && storeHighlights.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto no-scrollbar border-t border-gray-100">
          {storeHighlights.map((highlight: any) => (
            <div 
              key={highlight.id} 
              onClick={() => handleOpenHighlight(highlight)}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full border border-gray-300 p-0.5 group-active:scale-95 transition-transform shadow-2xs">
                <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden relative">
                  {highlight.coverUrl ? (
                    <img 
                      src={getMediaUrl(highlight.coverUrl)} 
                      alt={highlight.title} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                      {highlight.title?.slice(0, 2).toUpperCase() || 'HL'}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs font-medium text-[#171717] max-w-[68px] truncate text-center">
                {highlight.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-t border-gray-200">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`flex-1 flex justify-center py-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'posts' ? 'border-[#171717]' : 'border-transparent text-gray-400'
          }`}
          aria-label="Posts tab"
        >
          <Grid className={`w-6 h-6 ${activeTab === 'posts' ? 'text-[#171717]' : 'text-gray-400'}`} />
        </button>
        <button 
          onClick={() => setActiveTab('reels')}
          className={`flex-1 flex justify-center py-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'reels' ? 'border-[#171717]' : 'border-transparent text-gray-400'
          }`}
          aria-label="Reels tab"
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
                const queryParams = new URLSearchParams();
                queryParams.set('id', item.id);
                if (vUrl) queryParams.set('videoUrl', vUrl);
                if (pUrl) queryParams.set('posterUrl', pUrl);
                if (storeName) queryParams.set('storeName', storeName);
                if (item.caption) queryParams.set('caption', item.caption);
                router.push(`/home/reels?${queryParams.toString()}`);
              } else {
                router.push('/home');
              }
            };

            const resolvedVideoSrc = mediaUrl 
              ? (getMediaUrl(mediaUrl).includes('#t=') ? getMediaUrl(mediaUrl) : `${getMediaUrl(mediaUrl)}#t=0.1`) 
              : '';

            return (
              <div 
                key={item.id || idx} 
                onClick={handleItemClick}
                className="aspect-square relative bg-gray-100 cursor-pointer overflow-hidden group"
              >
                {posterUrl ? (
                  <img 
                    src={getMediaUrl(posterUrl)} 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                ) : isVideo && resolvedVideoSrc ? (
                  <video 
                    src={resolvedVideoSrc} 
                    preload="metadata" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform pointer-events-none" 
                    muted 
                    playsInline 
                  />
                ) : mediaUrl ? (
                  <img 
                    src={getMediaUrl(mediaUrl)} 
                    alt="Post" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                    Media
                  </div>
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
              ? 'Photos and posts shared by this account will appear here.' 
              : 'Short video reels shared by this account will appear here.'}
          </p>
        </div>
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

      {/* Share Bottom Sheet */}
      <ShareBottomSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={currentUrl}
      />
    </div>
  );
}
