'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Image as ImageIcon, Edit2, Plus, Star, ChevronRight, MoreVertical, Trash2, Clock, Phone, Truck, ShoppingBag, CreditCard, Banknote, Tag, MapPin, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { 
  useGetMyStoreQuery, 
  useGetStoreProductsQuery, 
  useGetStoreCategoriesQuery,
  useGetPresignedUrlMutation,
  useUploadMediaMutation,
  useUpdateStoreProfileMutation,
  useGetStoreSummaryQuery
} from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { getMediaUrl } from '@/lib/utils';

export default function StorePreviewPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: storeData } = useGetMyStoreQuery();
  const { data: products = [] } = useGetStoreProductsQuery(storeData?.id ?? '', {
    skip: !storeData?.id,
  });
  const { data: categories = [] } = useGetStoreCategoriesQuery(storeData?.id ?? '', {
    skip: !storeData?.id,
  });
  const { data: storeSummary } = useGetStoreSummaryQuery(storeData?.id ?? '', {
    skip: !storeData?.id,
  });

  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();
  const [updateStoreProfile] = useUpdateStoreProfileMutation();
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  const [showBannerMenu, setShowBannerMenu] = useState(false);

  const [previewBanner, setPreviewBanner] = useState<string | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleRemove = async (type: 'banner' | 'logo') => {
    if (!storeData?.id) return;
    try {
      if (type === 'banner') setIsUploadingBanner(true);
      else setIsUploadingLogo(true);
      
      await updateStoreProfile({
        storeId: storeData.id,
        body: type === 'banner' ? { bannerUrl: "" } : { logoUrl: "" }
      }).unwrap();
      
      if (type === 'banner') {
          setPreviewBanner(null);
          setShowBannerMenu(false);
      } else {
          setPreviewLogo(null);
      }
    } catch (err) {
      console.error(`Failed to remove ${type}`, err);
    } finally {
      if (type === 'banner') setIsUploadingBanner(false);
      else setIsUploadingLogo(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file || !storeData?.id) return;

    if (type === 'banner') setShowBannerMenu(false);

    const previewUrl = URL.createObjectURL(file);

    try {
      if (type === 'banner') {
        setPreviewBanner(previewUrl);
        setIsUploadingBanner(true);
      } else {
        setPreviewLogo(previewUrl);
        setIsUploadingLogo(true);
      }

      let finalUrl = '';

      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadMedia(formData).unwrap();
        finalUrl = getMediaUrl(res.publicUrl || res.url);
      } catch (directErr) {
        console.warn('Direct upload fallback to presigned URL:', directErr);
        const { uploadUrl, signedUrl, fileKey, publicUrl } = await getPresignedUrl({
          contentType: file.type,
          filename: file.name,
        }).unwrap();

        const targetUrl = uploadUrl || signedUrl;
        if (!targetUrl) throw new Error('No upload URL returned');

        const uploadRes = await fetch(targetUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload to storage: ${uploadRes.status}`);
        }

        finalUrl = getMediaUrl(publicUrl || (fileKey ? `/media/view?key=${encodeURIComponent(fileKey)}` : ''));
      }

      if (!finalUrl) {
        throw new Error('Could not obtain uploaded image URL');
      }

      // Update store profile
      await updateStoreProfile({
        storeId: storeData.id,
        body: type === 'banner' ? { bannerUrl: finalUrl } : { logoUrl: finalUrl }
      }).unwrap();

    } catch (error: any) {
      console.error(`Failed to upload ${type}:`, error.message || error);
    } finally {
      if (type === 'banner') setIsUploadingBanner(false);
      else setIsUploadingLogo(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 pb-24" onClick={() => setShowBannerMenu(false)}>
      
      <SellerHeader 
        title={storeData?.name || "My Store"}
        hideSearchIcon={true}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        rightAction={
          <button 
            onClick={() => router.push('/seller/store/settings')} 
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-[#171717] transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        
        <div className="bg-white shadow-sm mb-4 pb-6 rounded-b-3xl">
          {/* Banner Section - Strict 16:9 */}
          <div className="relative w-full aspect-[16/9] bg-indigo-500 group overflow-hidden">
            {previewBanner || storeData?.bannerUrl ? (
              <img src={getMediaUrl(previewBanner || storeData?.bannerUrl)} alt="Store Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600" />
            )}
            
            {/* Loading Overlay for Banner */}
            {isUploadingBanner && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center transition-all z-10">
                <span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}
            
            <input 
              type="file" 
              ref={bannerInputRef} 
              onChange={(e) => handleUpload(e, 'banner')} 
              accept="image/*" 
              className="hidden" 
            />
            
            {/* 3-Dot Menu Button */}
            <div className="absolute top-4 right-4 z-20" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setShowBannerMenu(!showBannerMenu)}
                disabled={isUploadingBanner}
                className="bg-black/40 backdrop-blur-md hover:bg-black/60 text-white p-2 rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {/* Dropdown Menu */}
              {showBannerMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <button 
                    onClick={() => {
                      bannerInputRef.current?.click();
                      setShowBannerMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    Upload Banner
                  </button>
                  
                  <button 
                    onClick={() => handleRemove('banner')}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors border-t border-gray-100"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    Remove Banner
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Store Info Profile Section */}
          <div className="px-5 -mt-12 relative z-20">
            <div className="flex flex-col">
              {/* Logo */}
              <div className="relative w-24 h-24 rounded-full bg-white shadow-lg border-4 border-white mb-3 group">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden relative">
                  {previewLogo || storeData?.logoUrl ? (
                    <img src={getMediaUrl(previewLogo || storeData?.logoUrl)} alt={storeData?.name || 'Store'} className={`w-full h-full object-cover transition-opacity ${isUploadingLogo ? 'opacity-50' : 'opacity-100'}`} />
                  ) : (
                    <span className="text-white font-bold text-3xl leading-tight">
                      {storeData?.name ? storeData.name.charAt(0).toUpperCase() : "S"}
                    </span>
                  )}
                  
                  {isUploadingLogo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
                    </div>
                  )}
                </div>
                
                <input 
                  type="file" 
                  ref={logoInputRef} 
                  onChange={(e) => handleUpload(e, 'logo')} 
                  accept="image/*" 
                  className="hidden" 
                />

                {/* Edit Logo Button */}
                <button 
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg text-gray-700 hover:text-indigo-600 border border-gray-100 transition-colors"
                >
                  {isUploadingLogo ? (
                    <span className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin block" />
                  ) : (
                    <Edit2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h2 className="text-2xl font-black text-gray-900 leading-tight truncate">{storeData?.name || ''}</h2>
                    {storeData?.status === 'VERIFIED' && (
                      <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50 shrink-0" />
                    )}
                  </div>

                  {/* Operations Status */}
                  <div className="shrink-0">
                    {(storeData?.isActive ?? true) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Store
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Offline
                      </span>
                    )}
                  </div>
                </div>

                {/* Category Badge */}
                {storeData?.category && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#FF5A36] border border-orange-200/70">
                      <Tag className="w-3 h-3 text-[#FF5A36]" />
                      {storeData.category}
                    </span>
                  </div>
                )}

                {storeData?.description && (
                  <p className="text-gray-500 text-sm mt-1.5 mb-2.5 break-words line-clamp-3 leading-relaxed">{storeData.description}</p>
                )}

                {/* Timings & Reviews */}
                {(Boolean(storeSummary?.reviewCount && storeSummary.reviewCount > 0) || Boolean(storeData?.openingTime && storeData?.closingTime)) && (
                  <div className="flex items-center gap-2 flex-wrap mt-2 mb-2">
                    {Boolean(storeSummary?.reviewCount && storeSummary.reviewCount > 0) && (
                      <div className="flex items-center text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-current mr-1.5" />
                        {Number(storeSummary?.avgRating || 0).toFixed(1)} ({storeSummary?.reviewCount} {storeSummary?.reviewCount === 1 ? 'Review' : 'Reviews'})
                      </div>
                    )}
                    {Boolean(storeData?.openingTime && storeData?.closingTime) && (
                      <div className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border ${
                        storeSummary?.isOpen ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80' : 'text-amber-700 bg-amber-50 border-amber-200/80'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{storeSummary?.timingLabel || (storeSummary?.isOpen ? 'Open Now' : 'Currently Closed')}</span>
                        <span className="opacity-80 font-normal ml-0.5">({storeData.openingTime} - {storeData.closingTime})</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery & Payment Operations Badges */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] mb-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200/70">
                    <Truck className="w-3 h-3 text-blue-600" />
                    <span>Delivery Available</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
                    <ShoppingBag className="w-3 h-3 text-purple-600" />
                    <span>In-Store Pickup</span>
                  </span>

                  {(storeData?.acceptedPayments?.includes('ONLINE PAYMENT') ?? true) ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                      <CreditCard className="w-3 h-3 text-emerald-600" />
                      <span>UPI & Online Pay</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold bg-gray-50 text-gray-700 border border-gray-200">
                      <Banknote className="w-3 h-3 text-gray-500" />
                      <span>Cash on Delivery</span>
                    </span>
                  )}
                </div>

                {/* Customer Support Phone */}
                {storeData?.contactPhone && (
                  <div className="mb-2">
                    <a 
                      href={`tel:${storeData.contactPhone}`} 
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-lg transition-colors group shadow-2xs"
                      title="Customer support phone"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                      <span>Customer Support: <span className="underline decoration-emerald-400 underline-offset-2 font-bold">{storeData.contactPhone}</span></span>
                    </a>
                  </div>
                )}

                {/* Physical Address */}
                {storeData?.address && storeData.address !== 'Address not provided' && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate max-w-[280px]">{storeData.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Categories Loop */}
        <div className="bg-white rounded-3xl py-6 shadow-sm mb-4">
          <div className="px-5 flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-gray-900">Categories</h3>
            <button 
              onClick={() => router.push('/seller/store/categories')}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              Manage <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          
          <div className="flex overflow-x-auto no-scrollbar px-5 pb-2 gap-4">
            
            {/* Add New Category Button */}
            <button 
              onClick={() => router.push('/seller/store/categories/add')}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-50/80 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shadow-sm transition-transform active:scale-95">
                <Plus className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-bold text-indigo-600 text-center uppercase tracking-wide">Add<br/>New</span>
            </button>

            {/* Existing Categories */}
            {categories.map((cat: any) => (
              <div key={cat.id} className="relative flex flex-col items-center gap-2 min-w-[72px]">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl shadow-sm overflow-hidden">
                  {cat.imageUrl || cat.image ? (
                    <img src={getMediaUrl(cat.imageUrl || cat.image)} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-medium uppercase tracking-wider">No img</div>
                  )}
                </div>
                <span className="text-[11px] font-bold text-gray-700 text-center truncate w-full">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Products Preview */}
        <div className="bg-white rounded-t-3xl pt-6 px-5 min-h-[400px]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-black text-gray-900">All Products</h3>
            <button 
              onClick={() => router.push('/seller/products')}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              Manage <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Add Product Card */}
            <button 
              onClick={() => router.push('/seller/products/add')}
              className="bg-indigo-50/50 rounded-2xl border border-indigo-100 border-dashed flex flex-col items-center justify-center p-4 aspect-[4/5] transition-transform active:scale-95 group hover:bg-indigo-50"
            >
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-indigo-600 mb-3 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-indigo-600 text-sm">Add Product</span>
            </button>

            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  title: product.name,
                  image: product.media?.[0]?.url || product.imageUrl || '',
                  price: product.sellingPrice?.toString() || '0',
                  originalPrice: product.mrp ? product.mrp.toString() : undefined,
                  store: { name: storeData?.name || '', isVerified: storeData?.status === 'VERIFIED' },
                  rating: product.avgRating ? String(product.avgRating) : undefined,
                  reviews: product.reviewsCount ? String(product.reviewsCount) : undefined,
                  stockCount: product.stockCount
                }}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
