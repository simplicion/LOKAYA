'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Image as ImageIcon, Edit2, Plus, Star, ChevronRight, MoreVertical, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { 
  useGetMyStoreQuery, 
  useGetStoreProductsQuery, 
  useGetStoreCategoriesQuery,
  useGetPresignedUrlMutation,
  useUpdateStoreProfileMutation
} from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';

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

      // Get presigned URL
      const { signedUrl, fileKey } = await getPresignedUrl({
        contentType: file.type,
        filename: file.name,
      }).unwrap();

      if (!signedUrl) {
        throw new Error('No upload URL returned');
      }

      // Upload to R2
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error(`Failed to upload to R2: ${uploadRes.status} ${uploadRes.statusText}`);
      }

      // Update store profile
      const publicUrl = `https://pub-9735c0214aaa423b89c9c5f647cc184c.r2.dev/${fileKey}`;
      
      await updateStoreProfile({
        storeId: storeData.id,
        body: type === 'banner' ? { bannerUrl: publicUrl } : { logoUrl: publicUrl }
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
              <img src={previewBanner || storeData?.bannerUrl} alt="Store Banner" className="w-full h-full object-cover" />
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
                    <img src={previewLogo || storeData?.logoUrl} alt={storeData?.name || 'Store'} className={`w-full h-full object-cover transition-opacity ${isUploadingLogo ? 'opacity-50' : 'opacity-100'}`} />
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
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900 leading-tight">{storeData?.name || 'Your Store Name'}</h2>
                </div>
                <p className="text-gray-500 text-sm mt-1 mb-4 break-words line-clamp-3">{storeData?.description || 'Add a description in settings to tell customers about your store.'}</p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1.5 rounded-lg">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current mr-1.5" />
                    4.8 (120+ Reviews)
                  </div>
                  <div className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1.5 rounded-lg">
                    Open until 10:00 PM
                  </div>
                </div>
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
              onClick={() => router.push('/seller/store/categories?add=true')}
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
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
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
                  image: product.media?.[0]?.url || 'https://placehold.co/400x400/png?text=No+Image',
                  price: product.sellingPrice?.toString() || '0',
                  originalPrice: product.mrp ? product.mrp.toString() : undefined,
                  store: { name: storeData?.name || 'Store', isVerified: true },
                  rating: "4.5",
                  reviews: "0"
                }}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
