'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Search, X, Clock, MapPin, Store, ShoppingBag, Film, Users, Sparkles, ArrowRight } from 'lucide-react';
import { useSearchGlobalQuery } from '@/lib/api';
import { StoreProfileCard } from '@/components/StoreProfileCard';
import { ProductCard } from '@/components/ProductCard';
import { SocialPost } from '@/components/feed/SocialPost';
import { formatTimeAgo } from '@/lib/utils';

const RECENT_SEARCHES = [
  'Shoes',
  'T-Shirt',
  'Dress',
  'Sneakers',
  'Boutique',
  'Jewelry'
];

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState<string[]>(RECENT_SEARCHES);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the search input when the page loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Debounce the search query to prevent hitting the API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResponse, isLoading, isFetching } = useSearchGlobalQuery(debouncedQuery, {
    skip: debouncedQuery.length < 2,
  });

  const searchData = searchResponse || { users: [], stores: [], products: [], posts: [] };
  const { users = [], stores = [], products = [], posts = [] } = searchData;
  const showResults = debouncedQuery.length >= 2;
  const isSearchLoading = (isLoading || isFetching) && showResults;

  const totalResultsCount = users.length + stores.length + products.length + posts.length;

  const searchFilters = [
    { id: 'all', label: 'All', icon: Sparkles, count: totalResultsCount },
    { id: 'products', label: 'Products', icon: ShoppingBag, count: products.length },
    { id: 'posts', label: 'Posts & Reels', icon: Film, count: posts.length },
    { id: 'stores', label: 'Stores', icon: Store, count: stores.length },
    { id: 'users', label: 'Profiles', icon: Users, count: users.length },
  ];

  const handleSearchSelect = (term: string) => {
    setSearchQuery(term);
    setDebouncedQuery(term);
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  // Filter results based on active tab
  const renderResults = () => {
    if (isSearchLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-[#FFF5F2] rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Search className="w-8 h-8 text-[#FF5A36]" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Searching for "{debouncedQuery}"...</h3>
          <p className="text-xs text-gray-500">Finding products, posts, stores and creators</p>
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
            Try checking for typos, using more generic terms, or browsing recent searches.
          </p>
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

        {/* Users (Profiles) Section */}
        {(activeFilter === 'all' || activeFilter === 'users') && users.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF5A36]" />
                <h4 className="text-sm font-bold text-gray-900 tracking-wide">Profiles ({users.length})</h4>
              </div>
              {activeFilter === 'all' && users.length > 3 && (
                <button
                  onClick={() => setActiveFilter('users')}
                  className="text-xs font-semibold text-[#FF5A36] flex items-center gap-0.5 hover:underline"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {(activeFilter === 'all' ? users.slice(0, 3) : users).map((user: any) => (
                <StoreProfileCard key={`user-${user.id}`} type="user" data={user} />
              ))}
            </div>
          </div>
        )}

        {/* Individual Tab Empty State */}
        {activeFilter === 'products' && products.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-xs">
            No products found matching "{debouncedQuery}"
          </div>
        )}
        {activeFilter === 'posts' && posts.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-xs">
            No posts or reels found matching "{debouncedQuery}"
          </div>
        )}
        {activeFilter === 'stores' && stores.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-xs">
            No stores found matching "{debouncedQuery}"
          </div>
        )}
        {activeFilter === 'users' && users.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-xs">
            No creator profiles found matching "{debouncedQuery}"
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
            placeholder="Search products, posts, stores..." 
            className="flex-1 h-full bg-transparent border-none outline-none px-2.5 text-sm text-gray-900 placeholder:text-gray-400 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setDebouncedQuery('');
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
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
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF5A36] rounded-full ring-2 ring-white" />
        </Link>
      </div>

      {/* Filter Chips Bar */}
      <div className="py-2.5 px-4 bg-white border-b border-gray-100 sticky top-[65px] z-40 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.03)]">
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          {searchFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all ${
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
      <div className="flex-1 p-4">
        {!showResults ? (
          /* Recent Searches & Suggested Tags */
          <div>
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Searches</h3>
                  <button 
                    onClick={handleClearRecent}
                    className="text-xs font-semibold text-[#FF5A36] hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-col divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  {recentSearches.map((search, i) => (
                    <button 
                      key={i} 
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left transition-colors group"
                      onClick={() => handleSearchSelect(search)}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-400 group-hover:text-[#FF5A36] transition-colors" />
                        <span className="text-sm text-gray-800 font-medium group-hover:text-gray-900">{search}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#FF5A36] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Discovery Tags */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Popular Categories</h3>
              <div className="flex flex-wrap gap-2">
                {['Streetwear', 'Handmade Bags', 'Traditional Wear', 'Sneakers', 'Vintage', 'Accessories'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleSearchSelect(tag)}
                    className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:border-[#FF5A36] hover:text-[#FF5A36] shadow-sm transition"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          renderResults()
        )}
      </div>
    </div>
  );
}
