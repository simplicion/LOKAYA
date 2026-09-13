'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { 
  Clock, 
  ListTree, 
  ChevronRight,
  ArrowLeft,
  Store,
  FileText,
  Camera,
  Image as ImageIcon,
  Loader2,
  Trash2,
  CheckCircle2,
  MapPin,
  Phone,
  Palette,
  ExternalLink,
  CreditCard,
  Globe,
  Sparkles,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  useGetMyStoreQuery, 
  useUpdateStoreProfileMutation,
  useUploadMediaMutation,
  useGetPresignedUrlMutation,
  useUpdateProfileMutation 
} from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { AdaptiveSkeleton } from '@/components/ui/AdaptiveSkeleton';

const POPULAR_CATEGORIES = [
  'Footwear & Shoes',
  'Fashion & Apparel',
  'Electronics & Gadgets',
  'Grocery & Food',
  'Handmade & Crafts',
  'Health & Beauty',
  'Home & Decor',
  'Jewelry & Accessories'
];

export default function StoreSettingsMenuPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { data: storeData, isLoading: isLoadingStore } = useGetMyStoreQuery();
  const [updateStoreProfile, { isLoading: isUpdating }] = useUpdateStoreProfileMutation();
  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();
  const [updateProfile] = useUpdateProfileMutation();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [acceptsOnline, setAcceptsOnline] = useState(true);
  
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sync state when storeData arrives
  useEffect(() => {
    if (storeData) {
      setName(storeData.name || '');
      setDescription(storeData.description || '');
      setCategory(storeData.category || '');
      setAddress(storeData.address || '');
      setContactPhone(storeData.contactPhone || '');
      setIsActive(storeData.isActive ?? true);
      setAcceptsOnline(storeData.acceptedPayments?.includes('ONLINE PAYMENT') ?? true);
      setBannerUrl(storeData.bannerUrl || '');
      setLogoUrl(storeData.logoUrl || storeData.users?.[0]?.user?.avatarUrl || '');
    }
  }, [storeData]);

  // Check if there are unsaved text/toggle modifications
  const isDirty = useMemo(() => {
    if (!storeData) return false;
    const initialAcceptsOnline = storeData.acceptedPayments?.includes('ONLINE PAYMENT') ?? true;
    return (
      name !== (storeData.name || '') ||
      description !== (storeData.description || '') ||
      category !== (storeData.category || '') ||
      address !== (storeData.address || '') ||
      contactPhone !== (storeData.contactPhone || '') ||
      isActive !== (storeData.isActive ?? true) ||
      acceptsOnline !== initialAcceptsOnline
    );
  }, [storeData, name, description, category, address, contactPhone, isActive, acceptsOnline]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file || !storeData?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    try {
      if (type === 'banner') setIsUploadingBanner(true);
      else setIsUploadingLogo(true);

      let finalUrl = '';

      try {
        // Direct multipart upload
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadMedia(formData).unwrap();
        finalUrl = res.publicUrl || res.url;
      } catch (directErr) {
        console.warn('Direct upload failed, trying presigned URL fallback:', directErr);
        const ext = file.name.split('.').pop() || 'jpg';
        const { uploadUrl, signedUrl, publicUrl } = await getPresignedUrl({
          contentType: file.type,
          filename: `${type}-${Date.now()}.${ext}`,
        }).unwrap();

        const targetUrl = uploadUrl || signedUrl;
        if (!targetUrl) throw new Error('Could not get upload URL');

        await fetch(targetUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        finalUrl = publicUrl;
      }

      if (!finalUrl) throw new Error('Failed to obtain uploaded image URL');

      if (type === 'banner') {
        setBannerUrl(finalUrl);
        await updateStoreProfile({
          storeId: storeData.id,
          body: { bannerUrl: finalUrl }
        }).unwrap();
        toast.success('Store banner updated successfully!');
      } else {
        setLogoUrl(finalUrl);
        await updateStoreProfile({
          storeId: storeData.id,
          body: { logoUrl: finalUrl }
        }).unwrap();

        try {
          const userRes = await updateProfile({ avatarUrl: finalUrl }).unwrap();
          if (userRes?.user) {
            dispatch(setCredentials({ user: userRes.user }));
          }
        } catch (uErr) {
          console.warn('Could not sync user avatar in identity service:', uErr);
        }

        toast.success('Store logo & profile picture updated!');
      }
    } catch (error: any) {
      console.error(`Failed to upload ${type}:`, error);
      toast.error(error?.data?.message || error?.message || `Failed to upload ${type}`);
    } finally {
      if (type === 'banner') {
        setIsUploadingBanner(false);
        if (bannerInputRef.current) bannerInputRef.current.value = '';
      } else {
        setIsUploadingLogo(false);
        if (logoInputRef.current) logoInputRef.current.value = '';
      }
    }
  };

  const handleRemoveBanner = async () => {
    if (!storeData?.id) return;
    try {
      setBannerUrl('');
      await updateStoreProfile({
        storeId: storeData.id,
        body: { bannerUrl: null }
      }).unwrap();
      toast.success('Cover banner removed');
    } catch (err) {
      console.error('Failed to remove banner:', err);
      toast.error('Failed to remove banner');
    }
  };

  const handleSaveProfile = async () => {
    if (!storeData?.id) return;
    if (!name.trim()) {
      toast.error('Store name is required');
      return;
    }

    try {
      await updateStoreProfile({
        storeId: storeData.id,
        body: { 
          name: name.trim(), 
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          address: address.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          bannerUrl: bannerUrl || undefined,
          logoUrl: logoUrl || undefined,
          isActive,
          acceptedPayments: acceptsOnline ? ['ONLINE PAYMENT', 'CASH'] : ['CASH']
        }
      }).unwrap();

      if (logoUrl) {
        try {
          const userRes = await updateProfile({ avatarUrl: logoUrl }).unwrap();
          if (userRes?.user) {
            dispatch(setCredentials({ user: userRes.user }));
          }
        } catch (uErr) {
          console.warn('Could not sync user avatar on save:', uErr);
        }
      }

      toast.success('Store settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to update store profile:', error);
      toast.error(error?.data?.message || 'Failed to save store profile changes');
    }
  };

  const handleDiscardChanges = () => {
    if (storeData) {
      setName(storeData.name || '');
      setDescription(storeData.description || '');
      setCategory(storeData.category || '');
      setAddress(storeData.address || '');
      setContactPhone(storeData.contactPhone || '');
      setIsActive(storeData.isActive ?? true);
      setAcceptsOnline(storeData.acceptedPayments?.includes('ONLINE PAYMENT') ?? true);
      toast.info('Changes discarded');
    }
  };

  const managementShortcuts = [
    {
      title: 'Store Hours & Schedule',
      description: 'Configure opening hours, closing times & working days',
      icon: <Clock className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
      badge: 'Operational',
      href: '/seller/store/hours',
    },
    {
      title: 'Product Categories',
      description: 'Organize your catalog with custom product categories',
      icon: <ListTree className="w-5 h-5 text-orange-600" />,
      iconBg: 'bg-orange-50 border-orange-100',
      badge: 'Catalog',
      href: '/seller/store/categories',
    },
    {
      title: 'Theme & Store Styling',
      description: 'Choose primary and secondary colors for your storefront',
      icon: <Palette className="w-5 h-5 text-violet-600" />,
      iconBg: 'bg-violet-50 border-violet-100',
      badge: 'Design',
      href: '/seller/store/customization',
    },
  ];

  if (isLoadingStore) {
    return <AdaptiveSkeleton variant="store-page" />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] pb-28">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={bannerInputRef} 
        onChange={(e) => handleFileUpload(e, 'banner')} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={logoInputRef} 
        onChange={(e) => handleFileUpload(e, 'logo')} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3.5 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => router.back()} 
              aria-label="Go back"
              className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 active:scale-95 text-gray-700 flex items-center justify-center transition-all border border-gray-200/60"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                Store Settings
              </h1>
              <p className="text-[11px] font-medium text-gray-500">
                Manage branding, storefront details & status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {storeData?.id && (
              <button
                type="button"
                onClick={() => router.push(`/store/${storeData.id}`)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all active:scale-95"
                title="Preview public storefront"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Store</span>
              </button>
            )}

            {isDirty && (
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isUpdating || !name.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF5A36] to-[#FF7A59] hover:opacity-95 active:scale-95 text-white text-xs font-bold shadow-md shadow-[#FF5A36]/20 transition-all disabled:opacity-50"
              >
                {isUpdating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-6">

        {/* 1. STORE BRANDING CARD (Banner + Avatar) */}
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#FF5A36] flex items-center justify-center font-bold">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Store Branding</h2>
                <p className="text-[11px] text-gray-500">Cover banner and profile avatar for your store</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100/80">
              Visual Identity
            </span>
          </div>

          {/* Unified Banner & Avatar Stage */}
          <div className="relative pt-1 pb-4">
            
            {/* 16:9 Banner Canvas */}
            <div className="relative w-full aspect-[16/9] max-h-52 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#1E1B4B] via-[#312E81] to-[#4338CA] shadow-inner group">
              {bannerUrl ? (
                <img 
                  src={getMediaUrl(bannerUrl)} 
                  alt="Store Banner" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/90 p-5 text-center bg-gradient-to-br from-[#18181B] via-[#27272A] to-[#3F3F46]">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-2 ring-1 ring-white/20">
                    <ImageIcon className="w-6 h-6 text-white/80" />
                  </div>
                  <p className="text-sm font-black tracking-tight text-white">Add Store Cover Banner</p>
                  <p className="text-[11px] text-white/60 mt-0.5 max-w-xs">
                    Recommended 16:9 ratio (e.g. 1200×675px) • Up to 10MB
                  </p>
                </div>
              )}

              {/* Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

              {/* Uploading Overlay */}
              {isUploadingBanner && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-in fade-in">
                  <Loader2 className="w-7 h-7 animate-spin mb-1.5 text-[#FF5A36]" />
                  <span className="text-xs font-bold">Uploading Banner...</span>
                </div>
              )}

              {/* Top Banner Quick Controls */}
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                  className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md active:scale-95 transition-all border border-white/20"
                >
                  <Camera className="w-3.5 h-3.5 text-[#FF7A59]" />
                  <span>{bannerUrl ? 'Change Cover' : 'Upload Cover'}</span>
                </button>
                {bannerUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveBanner}
                    className="bg-black/60 hover:bg-red-600/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-md active:scale-95 transition-all border border-white/20"
                    title="Remove Cover Banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Store Avatar / Logo (Sitting cleanly outside overflow-hidden to prevent clipping) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 px-3 -mt-9 sm:-mt-11 relative z-10">
              <div className="flex items-end gap-3.5">
                {/* Logo Circle Container */}
                <div className="relative group/logo">
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden cursor-pointer ring-1 ring-black/10 relative transition-transform group-hover/logo:scale-102"
                  >
                    {logoUrl ? (
                      <img 
                        src={getMediaUrl(logoUrl)} 
                        alt="Store Logo" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#FF5A36] to-[#FF7A59] text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-inner">
                        {name ? name.charAt(0).toUpperCase() : 'S'}
                      </div>
                    )}

                    {/* Camera Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>

                    {/* Upload Spinner */}
                    {isUploadingLogo && (
                      <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  {/* Camera Action Badge */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      logoInputRef.current?.click();
                    }}
                    className="absolute bottom-0 right-0 bg-[#FF5A36] text-white p-2 rounded-full shadow-md ring-2 ring-white hover:bg-[#E04826] active:scale-95 transition-all"
                    title="Change Profile Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Identity Text */}
                <div className="mb-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-base sm:text-lg text-gray-900 leading-tight">
                      {name || 'Your Store Name'}
                    </h3>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50 shrink-0" />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {category || 'Uncategorized Store'}
                  </p>
                </div>
              </div>

              {/* Logo Action Button */}
              <div className="self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="text-xs font-bold text-[#FF5A36] hover:text-[#E04826] bg-orange-50 hover:bg-orange-100 px-3.5 py-1.5 rounded-full transition-all active:scale-95"
                >
                  {logoUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>
            </div>

            {/* Sync Notice */}
            <div className="mt-3.5 mx-2 bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-200/60 flex items-center gap-2 text-gray-600 text-[11px] font-medium">
              <Info className="w-4 h-4 text-orange-500 shrink-0" />
              <span>
                Your store logo is automatically synced with your personal seller profile avatar across Lokaya.
              </span>
            </div>

          </div>
        </section>

        {/* 2. BASIC STORE INFORMATION */}
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 space-y-5">
          <div className="flex items-center justify-between pb-1 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">General Information</h2>
                <p className="text-[11px] text-gray-500">How customers identify and discover your shop</p>
              </div>
            </div>
          </div>

          {/* Store Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>Store Name</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Footwear & Accessories"
                className="w-full bg-[#FAF9F6] border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-bold text-gray-900 text-sm"
              />
            </div>
          </div>

          {/* Store Category with Quick Select Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Primary Category</span>
              </span>
              <span className="text-[10px] font-semibold text-gray-400">Select or type custom</span>
            </label>
            
            <input 
              type="text" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Footwear & Shoes"
              className="w-full bg-[#FAF9F6] border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-semibold text-gray-800 text-sm mb-2"
            />

            {/* Quick Category Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {POPULAR_CATEGORIES.map((cat) => {
                const isSelected = category.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-xs px-3 py-1 rounded-full font-bold transition-all active:scale-95 border ${
                      isSelected 
                        ? 'bg-[#FF5A36] text-white border-[#FF5A36] shadow-xs' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200/80'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Store Description with Live Character Count */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Store Bio & Story</span>
              </label>
              <span className={`text-[10px] font-bold ${description.length > 450 ? 'text-orange-500' : 'text-gray-400'}`}>
                {description.length} / 500
              </span>
            </div>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Tell shoppers what makes your store unique, special collections, handcrafted items, or local expertise..."
              rows={3}
              className="w-full bg-[#FAF9F6] border border-gray-200 rounded-2xl p-4 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-4 focus:ring-[#FF5A36]/10 transition-all text-sm font-medium resize-none text-gray-800 leading-relaxed"
            />
          </div>
        </section>

        {/* 3. LOCATION & CONTACT INFORMATION */}
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Location & Contact</h2>
                <p className="text-[11px] text-gray-500">Help local customers locate and reach your shop</p>
              </div>
            </div>
          </div>

          {/* Physical Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Physical Shop Address</span>
            </label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop number, floor, street, landmark, city"
              className="w-full bg-[#FAF9F6] border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-4 focus:ring-[#FF5A36]/10 transition-all text-sm font-medium text-gray-800"
            />
          </div>

          {/* Contact Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customer Support Phone</span>
            </label>
            <input 
              type="tel" 
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-[#FAF9F6] border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:bg-white focus:border-[#FF5A36] focus:ring-4 focus:ring-[#FF5A36]/10 transition-all text-sm font-medium text-gray-800"
            />
          </div>
        </section>

        {/* 4. OPERATIONAL STATUS & VISIBILITY */}
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Operations & Status</h2>
                <p className="text-[11px] text-gray-500">Live store availability and payment preferences</p>
              </div>
            </div>
          </div>

          {/* Toggle 1: Live Status */}
          <div className="flex items-center justify-between p-4 bg-[#FAF9F6] rounded-2xl border border-gray-200/70 hover:border-gray-300 transition-colors">
            <div className="pr-4">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-sm font-bold text-gray-900">Store Live on Lokaya</h3>
                {isActive ? (
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
                  </span>
                ) : (
                  <span className="text-[10px] font-black bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                When enabled, your store and products appear in searches and feeds. Disable temporarily for holidays.
              </p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)} 
              />
              <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
            </label>
          </div>

          {/* Toggle 2: Online Payments */}
          <div className="flex items-center justify-between p-4 bg-[#FAF9F6] rounded-2xl border border-gray-200/70 hover:border-gray-300 transition-colors">
            <div className="pr-4">
              <div className="flex items-center gap-2 mb-0.5">
                <CreditCard className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-bold text-gray-900">Accept Online Payments</h3>
                <span className="text-[10px] font-black bg-violet-100 text-violet-800 px-2 py-0.5 rounded-full">
                  UPI & Cards
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Allow customers to pay instantly using UPI, cards, and netbanking during checkout.
              </p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={acceptsOnline} 
                onChange={(e) => setAcceptsOnline(e.target.checked)} 
              />
              <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF5A36] shadow-inner"></div>
            </label>
          </div>
        </section>

        {/* 5. STORE MANAGEMENT SHORTCUTS */}
        <section className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-gray-50">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Store Management</h2>
              <p className="text-[11px] text-gray-500">Configure business hours, category trees & styling</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {managementShortcuts.map((link) => (
              <button
                key={link.title}
                type="button"
                onClick={() => router.push(link.href)}
                className="flex items-center py-3.5 px-2 w-full text-left transition-all rounded-2xl hover:bg-gray-50 active:scale-[0.99] group"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mr-3.5 shrink-0 border ${link.iconBg}`}>
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#FF5A36] transition-colors truncate">
                      {link.title}
                    </h3>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                      {link.badge}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-500 truncate">{link.description}</p>
                </div>
                <ChevronRight className="w-4.5 h-4.5 text-gray-400 group-hover:text-[#FF5A36] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}

            {/* Public Store Preview Link */}
            {storeData?.id && (
              <button
                type="button"
                onClick={() => router.push(`/store/${storeData.id}`)}
                className="flex items-center py-3.5 px-2 w-full text-left transition-all rounded-2xl hover:bg-gray-50 active:scale-[0.99] group"
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mr-3.5 shrink-0 bg-blue-50 border border-blue-100">
                  <ExternalLink className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#FF5A36] transition-colors truncate">
                      Preview Public Storefront
                    </h3>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                      Live
                    </span>
                  </div>
                  <p className="text-xs font-medium text-gray-500 truncate">
                    See exactly how shoppers experience your store page
                  </p>
                </div>
                <ChevronRight className="w-4.5 h-4.5 text-gray-400 group-hover:text-[#FF5A36] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            )}
          </div>
        </section>

      </main>

      {/* Persistent Bottom Bar / Action Trigger */}
      {isDirty ? (
        <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto z-40 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#18181B] text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-3 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0 pl-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">Unsaved changes</p>
                <p className="text-[10px] text-white/60 truncate">Don't forget to save your updates</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={isUpdating}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isUpdating || !name.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF5A36] to-[#FF7A59] text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 mt-6">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isUpdating || !name.trim()}
            className="w-full bg-[#18181B] hover:bg-black text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm active:scale-[0.99]"
          >
            {isUpdating ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
