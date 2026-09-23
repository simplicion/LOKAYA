'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Search, 
  X, 
  Clock, 
  MapPin, 
  Store, 
  ShoppingBag, 
  Film, 
  Users, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Play,
  Heart,
  MessageCircle,
  Flame,
  ChevronRight,
  Layers,
  Tag
} from 'lucide-react';
import { 
  useSearchGlobalQuery, 
  useGetTrendingSearchQuery, 
  useGetReelsQuery, 
  useGetPostsQuery, 
  useGetPublicProductsQuery 
} from '@/lib/api';
import { StoreProfileCard } from '@/components/StoreProfileCard';
import { ProductCard } from '@/components/ProductCard';
import { SocialPost } from '@/components/feed/SocialPost';
import { AdaptiveSkeleton } from '@/components/ui/AdaptiveSkeleton';
import { formatTimeAgo, getMediaUrl } from '@/lib/utils';

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load user-specific recent searches from localStorage (strictly last 5, no mock data)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lokaya_recent_searches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 5));
        }
      }
    } catch {}
  }, []);

  // Save query to recent searches (deduplicated, latest first, capped at 5)
  const saveSearchToHistory = (query: string) => {
    const cleaned = query.trim();
    if (!cleaned || cleaned.length < 2) return;
    setRecentSearches((prev) => {
      const updated = [cleaned, ...prev.filter(item => item.toLowerCase() !== cleaned.toLowerCase())].slice(0, 5);
      try {
        localStorage.setItem('lokaya_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter(item => item.toLowerCase() !== termToRemove.toLowerCase());
      try {
        localStorage.setItem('lokaya_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('lokaya_recent_searches');
    } catch {}
  };

  // Debounce the search query to prevent hitting the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      if (searchQuery.trim().length >= 2) {
        saveSearchToHistory(searchQuery.trim());
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Global search query
  const { data: searchResponse, isLoading, isFetching } = useSearchGlobalQuery(debouncedQuery, {
    skip: debouncedQuery.length < 2,
  });

  // Trending search keywords from backend
  const { data: trendingData } = useGetTrendingSearchQuery();
  const trendingKeywords = trendingData?.trendingKeywords || [];

  // Content feeds for Instagram-style discovery
  const { data: serverReels = [], isLoading: isReelsLoading } = useGetReelsQuery();
  const { data: serverPosts = [], isLoading: isPostsLoading } = useGetPostsQuery();
  const { data: popularProducts = [], isLoading: isProductsLoading } = useGetPublicProductsQuery({ 
    sort: 'popular', 
    limit: 8 
  });

  // 1. Top 5 Highly Liked Reels in descending order of likes
  const topReels = useMemo(() => {
    if (!serverReels || serverReels.length === 0) return [];
    return [...serverReels]
      .sort((a: any, b: any) => {
        const likesA = Number(a.likesCount ?? a.likes ?? 0) || 0;
        const likesB = Number(b.likesCount ?? b.likes ?? 0) || 0;
        return likesB - likesA;
      })
      .slice(0, 5);
  }, [serverReels]);

  // 2. Top Liked Posts in descending order of likes
  const topPosts = useMemo(() => {
    if (!serverPosts || serverPosts.length === 0) return [];
    return [...serverPosts]
      .sort((a: any, b: any) => {
        const likesA = Number(a.likesCount ?? a.likes ?? 0) || 0;
        const likesB = Number(b.likesCount ?? b.likes ?? 0) || 0;
        return likesB - likesA;
      })
      .slice(0, 6);
  }, [serverPosts]);

  const searchData = searchResponse || { users: [], stores: [], products: [], posts: [] };
  const { users = [], stores = [], products = [], posts = [] } = searchData;
  const showResults = debouncedQuery.length >= 2;
  const isSearchLoading = (isLoading || isFetching) && showResults;
  const isDiscoveryLoading = !showResults && (isReelsLoading || isPostsLoading || isProductsLoading);

  const totalResultsCount = stores.length + products.length + posts.length;

  const searchFilters = [
    { id: 'all', label: 'All', icon: Sparkles, count: totalResultsCount },
    { id: 'products', label: 'Products', icon: ShoppingBag, count: products.length },
    { id: 'posts', label: 'Posts & Reels', icon: Film, count: posts.length },
    { id: 'stores', label: 'Stores', icon: Store, count: stores.length },
  ];

  const handleSearchSelect = (term: string) => {
    setSearchQuery(term);
    setDebouncedQuery(term);
    saveSearchToHistory(term);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      setDebouncedQuery(searchQuery.trim());
      saveSearchToHistory(searchQuery.trim());
    }
  };

  // Filter search results based on active tab
  const renderResults = () => {
    if (isSearchLoading) {
      return (
        <div className="pt-2 animate-in fade-in duration-200">
          <AdaptiveSkeleton 
            variant="search-results" 
            activeFilter={activeFilter} 
          />
        </div>
      );
    }

    if (totalResultsCount === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">No results found for "{debouncedQuery}"</h3>
          <p className="text-xs text-gray-500 max-w-[260px] leading-relaxed">
            Try checking for typos or explore our trending reels and hot deals below.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setDebouncedQuery('');
            }}
            className="mt-4 px-4 py-2 bg-[#FF5A36] text-white text-xs font-bold rounded-full shadow-sm hover:bg-[#e04b28] transition"
          >
            Clear Search
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6 pb-24">
        {/* Products Section */}
        {(activeFilter === 'all' || activeFilter === 'products') && products.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#FF5A36]" />
                <h4 className="text-sm font-bold text-gray-900 tracking-wide">Products ({products.length})</h4>
              </div>
              {activeFilter === 'all' && products.length > 4 && (
                <button
                  onClick={() => setActiveFilter('products')}
                  className="text-xs font-semibold text-[#FF5A36] flex items-center gap-0.5 hover:underline"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(activeFilter === 'all' ? products.slice(0, 4) : products).map((product: any) => (
                <ProductCard key={`prod-${product.id}`} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Posts & Reels Section */}
        {(activeFilter === 'all' || activeFilter === 'posts') && posts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#FF5A36]" />
                <h4 className="text-sm font-bold text-gray-900 tracking-wide">Posts & Reels ({posts.length})</h4>
              </div>
              {activeFilter === 'all' && posts.length > 2 && (
                <button
                  onClick={() => setActiveFilter('posts')}
                  className="text-xs font-semibold text-[#FF5A36] flex items-center gap-0.5 hover:underline"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-4">
              {(activeFilter === 'all' ? posts.slice(0, 2) : posts).map((post: any) => (
                <SocialPost
                  key={`post-${post.id}`}
                  id={post.id}
                  authorId={post.authorId}
                  storeId={post.storeId}
                  storeName={post.storeName}
                  storeAvatar={post.storeAvatar}
                  isVerified={post.isVerified}
                  createdAt={post.createdAt}
                  timeAgo={formatTimeAgo(post.createdAt || post.timeAgo)}
                  media={post.media && post.media.length > 0 ? post.media : []}
                  likes={post.likes || '0'}
                  likesCount={post.likesCount || 0}
                  comments={post.comments || '0'}
                  shares={post.shares || '0'}
                  caption={post.caption || ''}
                  hashtags={post.hashtags || []}
                  product={post.product}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stores Section */}
        {(activeFilter === 'all' || activeFilter === 'stores') && stores.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#FF5A36]" />
                <h4 className="text-sm font-bold text-gray-900 tracking-wide">Stores ({stores.length})</h4>
              </div>
              {activeFilter === 'all' && stores.length > 3 && (
                <button
                  onClick={() => setActiveFilter('stores')}
                  className="text-xs font-semibold text-[#FF5A36] flex items-center gap-0.5 hover:underline"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {(activeFilter === 'all' ? stores.slice(0, 3) : stores).map((store: any) => (
                <StoreProfileCard key={`store-${store.id}`} type="store" data={store} />
              ))}
            </div>
          </div>
        )}


      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6]">
      {/* Header with Search Input */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-3 sticky top-0 bg-[#FAF9F6]/95 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="flex-1 relative flex items-center h-11 bg-white border border-gray-200 rounded-2xl px-3.5 shadow-sm focus-within:border-[#FF5A36] focus-within:ring-2 focus-within:ring-[#FF5A36]/10 transition-all overflow-hidden">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input 
            ref={inputRef}
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products, reels, stores..." 
            className="flex-1 h-full bg-transparent border-none outline-none px-2.5 text-sm text-gray-900 placeholder:text-gray-400 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setDebouncedQuery('');
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Link 
          href="/notifications" 
          prefetch={false}
          className="relative w-10 h-10 flex items-center justify-center -mr-1 text-[#171717] hover:bg-gray-100 active:scale-95 rounded-full transition cursor-pointer shrink-0"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-[#171717]" />
        </Link>
      </div>

      {/* Filter Chips Bar (When searching or viewing all) */}
      <div className="py-2.5 px-4 bg-white border-b border-gray-100 sticky top-[65px] z-40 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.03)]">
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          {searchFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#FF5A36] bg-[#FF5A36] text-white shadow-sm'
                    : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span>{filter.label}</span>
                {showResults && filter.count !== undefined && filter.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 pb-24">
        {!showResults ? (
          /* INSTAGRAM EXPLORE & DISCOVERY FEED */
          isDiscoveryLoading ? (
            <div className="animate-in fade-in duration-200">
              <AdaptiveSkeleton variant="search-discovery" />
            </div>
          ) : (
          <div className="space-y-6">

            {/* 1. User-Specific Recent Searches (Latest 5 only, no mock data) */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Searches</h3>
                  </div>
                  <button 
                    onClick={handleClearRecent}
                    className="text-xs font-bold text-[#FF5A36] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-col divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs">
                  {recentSearches.map((search, i) => (
                    <div 
                      key={`recent-${i}`} 
                      onClick={() => handleSearchSelect(search)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Clock className="w-4 h-4 text-gray-400 group-hover:text-[#FF5A36] transition-colors shrink-0" />
                        <span className="text-sm text-gray-800 font-medium group-hover:text-gray-900 truncate">{search}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, search)}
                          className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition"
                          title="Remove from history"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#FF5A36] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Trending Search Keywords (Dynamic derived/tracked) */}
            {trendingKeywords.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5 px-1">
                  <Flame className="w-4 h-4 text-[#FF5A36]" />
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Trending Keywords</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingKeywords.map((keyword: string, idx: number) => (
                    <button
                      key={`kw-${idx}`}
                      onClick={() => handleSearchSelect(keyword)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-[#FF5A36] hover:text-[#FF5A36] rounded-xl text-xs font-semibold text-gray-700 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <TrendingUp className="w-3 h-3 text-[#FF5A36]" />
                      <span>{keyword.startsWith('#') ? keyword : `#${keyword}`}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. TOP 5 HIGHLY LIKED REELS (Descending order of likes) */}
            {topReels.length > 0 && (
              <div className="pt-1">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center text-[#FF5A36]">
                      <Play className="w-3.5 h-3.5 fill-[#FF5A36]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-gray-900">Top 5 Liked Reels</h3>
                        <span className="text-[10px] font-black uppercase bg-gradient-to-r from-orange-500 to-[#FF5A36] text-white px-1.5 py-0.2 rounded-md shadow-2xs">
                          HOT
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">Ranked by local community likes</p>
                    </div>
                  </div>
                  <Link
                    href="/home/reels"
                    className="text-xs font-bold text-[#FF5A36] hover:underline flex items-center gap-0.5"
                  >
                    Watch All <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Reels Horizontal Snap Carousel */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 snap-x">
                  {topReels.map((reel: any, index: number) => {
                    const videoSrc = reel.videoUrl || reel.media?.[0]?.url || '';
                    const posterSrc = reel.posterUrl || reel.media?.[0]?.posterUrl || '';
                    const likesCount = Number(reel.likesCount ?? reel.likes ?? 0) || 0;
                    const formattedLikes = likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount.toString();

                    return (
                      <div
                        key={`reel-${reel.id}`}
                        onClick={() => router.push(`/home/reels?id=${reel.id}`)}
                        className="relative w-[136px] sm:w-[155px] aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer snap-start shrink-0 border border-gray-200/90 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] bg-black"
                      >
                        {/* Video Thumbnail / Poster */}
                        {posterSrc ? (
                          <img
                            src={getMediaUrl(posterSrc)}
                            alt={reel.storeName || 'Reel'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : videoSrc ? (
                          <video
                            src={getMediaUrl(videoSrc)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center">
                            <Film className="w-8 h-8 text-gray-500" />
                          </div>
                        )}

                        {/* Top Rank Badge */}
                        <div className="absolute top-2 left-2 z-10">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider shadow-sm flex items-center gap-1 ${
                            index === 0
                              ? 'bg-gradient-to-r from-amber-500 to-[#FF5A36] text-white ring-1 ring-white/40'
                              : 'bg-black/60 backdrop-blur-md text-white border border-white/20'
                          }`}>
                            #{index + 1}
                          </span>
                        </div>

                        {/* Center Play Icon Glow */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-9 h-9 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-[#FF5A36] transition-all duration-200 shadow-md">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Bottom Gradient with Likes & Creator Info */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 flex flex-col justify-end text-white pointer-events-none">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-white mb-1">
                            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 shrink-0" />
                            <span>{formattedLikes}</span>
                          </div>
                          <p className="text-xs font-bold truncate leading-tight drop-shadow-sm">
                            {reel.storeName || 'Creator'}
                          </p>
                          {reel.caption && (
                            <p className="text-[10px] text-gray-300 line-clamp-1 mt-0.5 font-normal">
                              {reel.caption}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. TOP LIKED POSTS (Descending order of likes - Instagram Explore Grid) */}
            {topPosts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Trending Posts</h3>
                      <p className="text-[11px] text-gray-500">Most engaged community posts</p>
                    </div>
                  </div>
                  <Link
                    href="/home"
                    className="text-xs font-bold text-[#FF5A36] hover:underline flex items-center gap-0.5"
                  >
                    View Feed <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Instagram Explore 3-Column / 2-Column Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {topPosts.map((post: any, pIdx: number) => {
                    const firstMedia = post.media?.[0];
                    const mediaUrl = firstMedia?.url || firstMedia?.posterUrl || '';
                    const isVideo = firstMedia?.type === 'video' || Boolean(post.isReel);
                    const isMulti = (post.media || []).length > 1;
                    const likesCount = Number(post.likesCount ?? post.likes ?? 0) || 0;
                    const commentsCount = Number(post.commentsCount ?? post.comments ?? 0) || 0;

                    return (
                      <div
                        key={`top-post-${post.id || pIdx}`}
                        onClick={() => router.push('/home')}
                        className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer bg-gray-100 border border-gray-200/80 shadow-2xs hover:shadow-md transition-all active:scale-[0.98]"
                      >
                        {/* Media Image / Video Poster */}
                        {mediaUrl ? (
                          <img
                            src={getMediaUrl(mediaUrl)}
                            alt={post.caption || 'Post image'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                            <Layers className="w-6 h-6" />
                          </div>
                        )}

                        {/* Top-Right Badge: Multi-photo or Video */}
                        <div className="absolute top-2 right-2 z-10 pointer-events-none">
                          {isMulti ? (
                            <div className="w-6 h-6 rounded-lg bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-xs">
                              <Layers className="w-3.5 h-3.5" />
                            </div>
                          ) : isVideo ? (
                            <div className="w-6 h-6 rounded-lg bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-xs">
                              <Play className="w-3 h-3 fill-white ml-0.5" />
                            </div>
                          ) : null}
                        </div>

                        {/* Instagram-style Hover / Touch Info Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 text-white font-bold text-xs pointer-events-none">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4 fill-white" />
                            {likesCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4 fill-white" />
                            {commentsCount}
                          </span>
                        </div>

                        {/* Subtle Bottom Bar on Small Screens */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 flex items-center justify-between text-white pointer-events-none group-hover:opacity-0 transition-opacity">
                          <span className="text-[11px] font-bold truncate max-w-[70%]">
                            {post.storeName || post.author?.name || 'Local Store'}
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-white/90">
                            <Heart className="w-3 h-3 fill-white" />
                            {likesCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. HOT DEALS & TRENDING PRODUCTS (Catalog Products Section) */}
            {popularProducts.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Trending Deals & Products</h3>
                      <p className="text-[11px] text-gray-500">Popular items across verified local stores</p>
                    </div>
                  </div>
                  <Link
                    href="/explore"
                    className="text-xs font-bold text-[#FF5A36] hover:underline flex items-center gap-0.5"
                  >
                    Browse All <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* 2-Column Product Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {popularProducts.slice(0, 6).map((product: any) => (
                    <ProductCard key={`trending-prod-${product.id}`} product={product} />
                  ))}
                </div>
              </div>
            )}

          </div>
          )
        ) : (
          renderResults()
        )}
      </div>
    </div>
  );
}
