'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Share2, Star, CheckCircle2, MapPin, Clock, ShoppingBag, Store as StoreIcon, Phone, Headphones, Loader2, Users, Truck, CreditCard, Banknote, Tag, Bike, User, ChevronRight } from 'lucide-react';
import { cn, getMediaUrl } from '@/lib/utils';
import { ProductCard } from '@/components/ProductCard';
import { ShareBottomSheet } from '@/components/ui/ShareBottomSheet';
import { 
  useGetStoreSummaryQuery, 
  useGetStoreProductsQuery, 
  useGetStoreCategoriesQuery,
  useGetStoreFollowStatusQuery,
  useFollowStoreMutation,
  useGetDeliveryProfileQuery,
  useSendStorePartnerRequestMutation
} from '@/lib/api';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

import { AdaptiveSkeleton } from '@/components/ui/AdaptiveSkeleton';

export default function StoreProfilePage({ params }: { params?: Promise<{ id: string }> | { id: string } }) {
  const routeParams = useParams();
  const routeId = routeParams?.id as string | undefined;
  const pathId = typeof window !== 'undefined' 
    ? window.location.pathname.split('/store/')[1]?.split('/')[0]?.split('?')[0] 
    : undefined;

  const storeId = (routeId && routeId !== '1') 
    ? routeId 
    : (pathId && pathId !== '1') 
      ? pathId 
      : (routeId || pathId || '');
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => (state as any).auth?.user);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followersDelta, setFollowersDelta] = useState(0);

  // Live Backend Data Fetching
  const { data: storeSummary, isLoading: isStoreLoading, error: storeError } = useGetStoreSummaryQuery(storeId, {
    skip: !storeId
  });
  const { data: followData } = useGetStoreFollowStatusQuery(storeId, {
    skip: !storeId
  });
  const [toggleFollowStore, { isLoading: isTogglingFollow }] = useFollowStoreMutation();
  const { data: products = [], isLoading: isProductsLoading } = useGetStoreProductsQuery(storeId, {
    skip: !storeId
  });
  const { data: categories = [], isLoading: isCategoriesLoading } = useGetStoreCategoriesQuery(storeId, {
    skip: !storeId
  });
  const { data: deliveryProfile } = useGetDeliveryProfileQuery();
  const [sendPartnerRequest, { isLoading: isPartnering }] = useSendStorePartnerRequestMutation();

  const handlePartnerRequest = async () => {
    if (!currentUser) {
      toast.error('Please sign in to send partner requests');
      router.push('/login');
      return;
    }

    try {
      await sendPartnerRequest({ storeId }).unwrap();
      toast.success('Partner request sent to store owner!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send partner request');
    }
  };

  const activeFollowing = isFollowing !== null ? isFollowing : (followData?.following ?? false);
  const currentFollowersCount = Math.max(0, (followData?.followersCount ?? storeSummary?.followersCount ?? 0) + followersDelta);

  const handleToggleFollow = async () => {
    if (!currentUser) {
      toast.error('Please sign in to follow stores');
      router.push('/login');
      return;
    }

    const nextState = !activeFollowing;
    setIsFollowing(nextState);
    setFollowersDelta(prev => prev + (nextState ? 1 : -1));
    try {
      await toggleFollowStore(storeId).unwrap();
    } catch (err: any) {
      setIsFollowing(!nextState);
      setFollowersDelta(prev => prev + (nextState ? -1 : 1));
      toast.error(err?.data?.message || 'Failed to update follow status');
    }
  };

  const store = storeSummary?.store;
  const storeName = store?.name || 'Store';
  const storeDescription = store?.description;
  const storeAddress = store?.address;
  const storeCategory = store?.category;
  const bannerUrl = store?.bannerUrl;
  const logoUrl = store?.logoUrl || store?.users?.[0]?.user?.avatarUrl;
  const isVerified = Boolean(store?.isVerified && store?.verificationStatus === 'APPROVED');
  const isOpen = storeSummary?.isOpen ?? true;
  const hasHours = Boolean(store?.openingTime || store?.closingTime || storeSummary?.timingLabel);
  const timingLabel = storeSummary?.timingLabel || (hasHours ? (isOpen ? 'Open Now' : 'Closed') : '');
  const avgRating = storeSummary?.avgRating ?? 0;
  const reviewCount = storeSummary?.reviewCount ?? 0;

  const ownerUser = store?.users?.[0]?.user;
  const ownerUserId = ownerUser?.id || store?.users?.[0]?.userId;

  const isStoreLive = store?.isActive ?? true;
  const contactPhone = store?.contactPhone;
  const acceptedPayments = store?.acceptedPayments || ['ONLINE PAYMENT', 'CASH'];
  const acceptsOnline = Array.isArray(acceptedPayments) ? acceptedPayments.includes('ONLINE PAYMENT') : true;
  const openingTime = store?.openingTime;
  const closingTime = store?.closingTime;

  // Filter products by selected category
  const filteredProducts = selectedCategoryId
    ? products.filter((p: any) => p.categoryId === selectedCategoryId)
    : products;

  // Loading Skeleton State
  if (isStoreLoading) {
    return <AdaptiveSkeleton variant="store-page" />;
  }

  // Not Found / Error State
  if (storeError || !store) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FAF9F6] items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF5A36] flex items-center justify-center mb-4 shadow-sm">
          <StoreIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Store Not Found</h2>
        <p className="text-sm text-gray-500 max-w-xs mb-6">
          This store might be closed or the link you followed has expired.
        </p>
        <button
          onClick={() => router.push('/home')}
          className="bg-[#FF5A36] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24">
      <div className="flex-1 overflow-y-auto">
        
        {/* Banner Section (Facebook-style Cover Photo) */}
        <div className="relative w-full aspect-[21/9] sm:aspect-[16/9] min-h-[180px] max-h-64 bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600">
          <div className="w-full h-full overflow-hidden">
            {bannerUrl ? (
              <img 
                src={getMediaUrl(bannerUrl)} 
                alt={storeName} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#171717] via-[#2A2A2A] to-[#FF5A36]/60 flex items-center justify-center">
                <span className="text-white/20 font-black text-4xl uppercase tracking-widest">{storeName}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/25 pointer-events-none" />
          </div>
          
          {/* Top Floating Navigation Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 pt-safe-offset-4 flex justify-between items-center z-10">
            <button 
              onClick={() => {
                if (selectedCategoryId) {
                  setSelectedCategoryId(null);
                } else if (typeof window !== 'undefined' && window.history.length > 2) {
                  router.back();
                } else {
                  router.push('/home');
                }
              }} 
              className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-95 transition-all shadow-md cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => setIsShareOpen(true)}
              className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-95 transition-all shadow-md cursor-pointer"
              aria-label="Share Store"
            >
              <Share2 className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Facebook-style Store Logo: Anchored overlapping the bottom mid-left of banner */}
          <div className="absolute -bottom-12 left-5 z-20">
            <div 
              onClick={() => {
                if (ownerUserId) {
                  router.push(`/user/${ownerUserId}`);
                }
              }}
              className={cn(
                "relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden ring-1 ring-black/5 flex-shrink-0 transition-transform active:scale-95",
                ownerUserId ? "cursor-pointer group" : ""
              )}
              title={ownerUserId ? "View Owner Profile" : storeName}
            >
              {logoUrl ? (
                <img 
                  src={getMediaUrl(logoUrl)} 
                  alt={storeName} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#FF6B00] to-[#FF0000] text-white font-black text-3xl sm:text-4xl flex items-center justify-center shadow-inner">
                  {storeName ? storeName.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Store Profile Identity Card below banner with clearance for overlapping logo */}
        <div className="relative pt-15 pb-6 px-5 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-1.5 leading-tight truncate">
                  {storeName}
                  {isVerified && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500 text-white flex-shrink-0 animate-in zoom-in duration-300" />
                  )}
                </h2>

                {storeCategory && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#FF5A36] border border-orange-200/70">
                    {storeCategory}
                  </span>
                )}
              </div>
              
              {storeDescription && (
                <p className="text-gray-600 text-sm mt-1.5 leading-relaxed break-words">
                  {storeDescription}
                </p>
              )}
              
              {/* Ratings, Followers & Operating Hours Badges */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <div className="flex items-center text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                  <Users className="w-3.5 h-3.5 text-gray-500 mr-1" />
                  <span>{currentFollowersCount}</span>
                  <span className="text-gray-400 font-normal ml-1">{currentFollowersCount === 1 ? 'follower' : 'followers'}</span>
                </div>

                {reviewCount > 0 ? (
                  <div className="flex items-center text-xs font-bold text-gray-800 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mr-1" />
                    <span>{avgRating.toFixed(1)}</span>
                    <span className="text-amber-800/60 font-normal ml-1">({reviewCount} {reviewCount === 1 ? 'rating' : 'ratings'})</span>
                  </div>
                ) : (
                  <div className="flex items-center text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                    <Star className="w-3.5 h-3.5 text-gray-400 mr-1" />
                    <span>New Merchant</span>
                  </div>
                )}

                {(hasHours || (openingTime && closingTime)) && (
                  <div className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border",
                    isOpen ? "text-emerald-700 bg-emerald-50 border-emerald-200/60" : "text-amber-700 bg-amber-50 border border-amber-200/60"
                  )}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timingLabel || (isOpen ? 'Open Now' : 'Closed')}</span>
                    {openingTime && closingTime && (
                      <span className="opacity-80 font-normal ml-0.5">({openingTime} - {closingTime})</span>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery Operations Badges */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] mt-2.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                  <Truck className="w-3 h-3 text-blue-600" />
                  <span>Delivery Available</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
                  <ShoppingBag className="w-3 h-3 text-purple-600" />
                  <span>In-Store Pickup</span>
                </span>
              </div>

              {/* Store Owner Navigation Pill */}
              {ownerUserId && (
                <div className="mt-3">
                  <button
                    onClick={() => router.push(`/user/${ownerUserId}`)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100/90 hover:bg-stone-200 border border-stone-200/90 text-stone-800 transition-all active:scale-95 cursor-pointer group shadow-2xs"
                    title="View Store Owner Public Profile"
                  >
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center text-[10px] font-black text-[#FF5A36] shrink-0 border border-[#FF5A36]/30">
                      {ownerUser?.avatarUrl ? (
                        <img src={getMediaUrl(ownerUser.avatarUrl)} alt={ownerUser.name || 'Owner'} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3 h-3 text-[#FF5A36]" />
                      )}
                    </div>
                    <span className="truncate max-w-[200px]">
                      Store Owner: <span className="font-bold text-gray-900 group-hover:text-[#FF5A36] transition-colors">{ownerUser?.name || 'View Profile'}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF5A36] transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </button>
                </div>
              )}

              {/* Customer Support Phone & Address */}
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap mt-2.5">
                {contactPhone && (
                  <a 
                    href={`tel:${contactPhone}`} 
                    className="inline-flex items-center gap-1.5 font-medium text-gray-700 hover:text-[#FF5A36] transition-colors group"
                    title="Customer Support"
                  >
                    <Headphones className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF5A36] shrink-0" />
                    <span className="group-hover:text-[#FF5A36]">{contactPhone}</span>
                  </a>
                )}

                {storeAddress && storeAddress !== 'Address not provided' && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate max-w-[280px]">{storeAddress}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Partner as Rider Button */}
              {deliveryProfile && (
                <button
                  onClick={handlePartnerRequest}
                  disabled={isPartnering}
                  className="px-3.5 py-2 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
                  title="Send Delivery Partner Request to Store"
                >
                  {isPartnering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bike className="w-3.5 h-3.5 text-[#FF6B00]" />}
                  <span>Partner as Rider</span>
                </button>
              )}

              {/* Follow / Following Action Button */}
              <button
                onClick={handleToggleFollow}
                disabled={isTogglingFollow}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer",
                  activeFollowing
                    ? "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
                    : "bg-[#FF5A36] text-white hover:bg-[#e04d2d] shadow-orange-500/20"
                )}
              >
                {isTogglingFollow && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {activeFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Store Categories */}
        {categories.length > 0 && (
          <div className="mt-3 bg-white py-4 shadow-sm border-y border-gray-100">
            <div className="px-4 flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Categories</h3>
              <span className="text-xs text-gray-400">{categories.length} sections</span>
            </div>
            
            <div className="flex overflow-x-auto no-scrollbar px-4 pb-1 gap-3">
              {/* "All" Category Pill */}
              <button 
                onClick={() => setSelectedCategoryId(null)}
                className="relative flex flex-col items-center gap-1.5 min-w-[68px] group transition-transform active:scale-95 cursor-pointer"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl border flex items-center justify-center text-xl shadow-sm transition-all", 
                  selectedCategoryId === null 
                    ? "bg-[#FF5A36] border-[#FF5A36] text-white shadow-md shadow-[#FF5A36]/20" 
                    : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
                )}>
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <span className={cn(
                  "text-[11px] font-semibold text-center truncate w-full",
                  selectedCategoryId === null ? "text-[#FF5A36] font-bold" : "text-gray-600"
                )}>
                  All ({products.length})
                </span>
              </button>

              {/* Dynamic Categories: Tapping opens dedicated Category Page with Search & Filters */}
              {categories.map((cat: any) => {
                const catImg = cat.imageUrl || cat.image;

                return (
                  <button 
                    key={cat.id} 
                    onClick={() => router.push(`/store/${storeId}/category/${cat.id}`)}
                    className="relative flex flex-col items-center gap-1.5 min-w-[68px] group transition-transform active:scale-95 cursor-pointer"
                    title={`Open ${cat.name} Category Page`}
                  >
                    <div className="w-14 h-14 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 group-hover:border-[#FF5A36] group-hover:ring-2 group-hover:ring-[#FF5A36]/20 flex items-center justify-center shadow-xs overflow-hidden transition-all">
                      {catImg ? (
                        <img 
                          src={getMediaUrl(catImg)} 
                          alt={cat.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                      ) : (
                        <span className="text-xs font-bold uppercase text-gray-600 group-hover:text-[#FF5A36]">
                          {cat.name.slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-center truncate w-full max-w-[76px] text-gray-600 group-hover:text-[#FF5A36] group-hover:font-bold transition-colors">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Product Catalog Grid */}
        <div className="mt-3 px-2 pb-8">
          <div className="flex items-center justify-between mb-3.5 px-0.5">
            <h3 className="text-lg font-bold text-gray-900">
              {selectedCategoryId 
                ? (categories.find((c: any) => c.id === selectedCategoryId)?.name || 'Category Products')
                : 'All Products'}
            </h3>
            <span className="text-xs font-semibold text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
              {filteredProducts.length} items
            </span>
          </div>
          
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {filteredProducts.map((product: any) => {
                const primaryImage = product.media?.[0]?.url || product.imageUrl || product.images?.[0] || '';
                const sellingPrice = product.sellingPrice != null ? product.sellingPrice : (product.price || 0);
                const mrp = product.mrp;
                const discountText = mrp && sellingPrice && mrp > sellingPrice
                  ? `${Math.round(((mrp - sellingPrice) / mrp) * 100)}% OFF`
                  : undefined;

                return (
                  <ProductCard 
                    key={product.id} 
                    product={{
                      id: product.id,
                      title: product.name,
                      image: primaryImage,
                      price: Number(sellingPrice).toLocaleString(),
                      originalPrice: mrp ? Number(mrp).toLocaleString() : undefined,
                      discount: discountText,
                      store: { id: store.id, name: storeName, isVerified },
                      rating: product.avgRating ? Number(product.avgRating).toFixed(1) : (avgRating > 0 ? avgRating.toFixed(1) : '5.0'),
                      reviews: `(${product.reviewCount || 0})`,
                      stockCount: product.stockCount,
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF5A36] flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">No products found</h4>
              <p className="text-xs text-gray-500 max-w-xs mt-1">
                {selectedCategoryId 
                  ? 'There are no products in this category yet.'
                  : `${storeName} has not published any products yet. Please check back later.`}
              </p>
              {selectedCategoryId && (
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className="mt-4 text-xs font-bold text-[#FF5A36] hover:underline"
                >
                  View All Products
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Share Modal */}
      <ShareBottomSheet 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={`Check out ${storeName} on Lokaya!`}
      />
    </div>
  );
}
