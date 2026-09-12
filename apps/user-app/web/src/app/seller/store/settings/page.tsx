'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { 
  Clock, 
  Wallet, 
  CreditCard, 
  ListTree, 
  ChevronRight,
  ArrowLeft,
  Store,
  FileText,
  Camera,
  Image as ImageIcon,
  Loader2,
  Trash2,
  CheckCircle2
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

export default function StoreSettingsMenuPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { data: storeData } = useGetMyStoreQuery();
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
  const [successMsg, setSuccessMsg] = useState('');
  
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
        // Persist immediately to store
        await updateStoreProfile({
          storeId: storeData.id,
          body: { bannerUrl: finalUrl }
        }).unwrap();
        toast.success('Store banner updated successfully!');
      } else {
        setLogoUrl(finalUrl);
        // Persist immediately to both store logo and user avatar
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

        toast.success('Store logo and profile picture updated!');
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

  const handleSaveProfile = async () => {
    if (!storeData?.id) return;
    try {
      await updateStoreProfile({
        storeId: storeData.id,
        body: { 
          name, 
          description,
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

      setSuccessMsg('Store profile updated successfully!');
      toast.success('Store profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Failed to update store profile:', error);
      toast.error('Failed to save store profile changes');
    }
  };

  const settingsLinks = [
    {
      title: 'Store Hours',
      description: 'Opening, closing, and working days',
      icon: <Clock className="w-6 h-6 text-green-500" />,
      href: '/seller/store/hours',
    },
    {
      title: 'Manage Categories',
      description: 'Add, reorder, and organize categories',
      icon: <ListTree className="w-6 h-6 text-orange-500" />,
      href: '/seller/store/categories',
    },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Store Settings
        </h1>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Store Profile Section */}
        <section>
          <p className="text-sm font-medium text-gray-500 mb-3 ml-1">Store Profile</p>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-4">

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

            {/* Facebook-style Cover Banner & Store Logo Branding Preview */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> Store Branding
                </label>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Cover & Logo
                </span>
              </div>

              {/* Banner Preview & Upload Box */}
              <div className="relative w-full aspect-[16/9] max-h-48 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 shadow-sm ring-1 ring-black/5 overflow-hidden group">
                {bannerUrl ? (
                  <img 
                    src={getMediaUrl(bannerUrl)} 
                    alt="Store Banner" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/80 p-4 text-center">
                    <ImageIcon className="w-8 h-8 mb-1.5 opacity-70" />
                    <p className="text-xs font-bold">Add Cover Banner</p>
                    <p className="text-[10px] text-white/60">Visible at top of your store page</p>
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 pointer-events-none" />

                {/* Banner Loading Overlay */}
                {isUploadingBanner && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                    <Loader2 className="w-6 h-6 animate-spin mb-1 text-white" />
                    <span className="text-xs font-semibold">Uploading Banner...</span>
                  </div>
                )}

                {/* Top Banner Action Buttons */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{bannerUrl ? 'Change Banner' : 'Upload Banner'}</span>
                  </button>
                  {bannerUrl && (
                    <button
                      type="button"
                      onClick={async () => {
                        setBannerUrl('');
                        if (storeData?.id) {
                          try {
                            await updateStoreProfile({ storeId: storeData.id, body: { bannerUrl: '' } }).unwrap();
                            toast.success('Banner removed');
                          } catch (err) {
                            console.error('Failed to remove banner', err);
                          }
                        }
                      }}
                      className="bg-black/60 hover:bg-red-600/80 backdrop-blur-md text-white p-1.5 rounded-full shadow-md active:scale-95 transition-all"
                      title="Remove Banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Store Logo overlapping in bottom mid-left (Facebook Style) */}
                <div className="absolute -bottom-8 left-4 sm:left-6 z-10">
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden cursor-pointer group/logo ring-1 ring-black/10"
                  >
                    {logoUrl ? (
                      <img 
                        src={getMediaUrl(logoUrl)} 
                        alt="Store Logo" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#FF6B00] to-[#FF0000] text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-inner">
                        {name ? name.charAt(0).toUpperCase() : 'S'}
                      </div>
                    )}

                    {/* Hover / Active Camera Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>

                    {/* Logo Upload Spinner */}
                    {isUploadingLogo && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  {/* Small camera badge button anchored on avatar */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      logoInputRef.current?.click();
                    }}
                    className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white hover:bg-indigo-700 active:scale-95 transition-all"
                    title="Change Profile Picture"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Helper description under banner */}
              <div className="pt-10 px-2 flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium">
                  Profile picture is shared across <span className="font-bold text-gray-700">Profile</span> and <span className="font-bold text-gray-700">Store</span>.
                </p>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 shrink-0 ml-2"
                >
                  {logoUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center">
                <Store className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Store Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Store Name"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-gray-900 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Store Category
              </label>
              <input 
                type="text" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Footwear & Shoes, Grocery, Apparel"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-gray-800 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> Store Description
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers about your store..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium resize-none text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Physical Address
              </label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop number, street, city..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Contact Phone
              </label>
              <input 
                type="tel" 
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium text-gray-800"
              />
            </div>

            {/* Quick Toggles */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Available on Lokaya</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Show your store to customers</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Accept Online Orders</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Allow customers to pay online</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={acceptsOnline} onChange={(e) => setAcceptsOnline(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <button 
              onClick={handleSaveProfile}
              disabled={isUpdating || !name.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-70 flex justify-center items-center shadow-md active:scale-[0.98]"
            >
              {isUpdating ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Save Changes'
              )}
            </button>
            {successMsg && (
              <div className="bg-green-50 text-green-700 text-sm font-bold p-3 rounded-lg text-center border border-green-100 animate-in fade-in zoom-in duration-300">
                {successMsg}
              </div>
            )}
          </div>
        </section>

        {/* Configuration Section */}
        <section>
          <p className="text-sm font-medium text-gray-500 mb-3 ml-1">Configuration</p>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {settingsLinks.map((link, idx) => (
              <button
                key={link.title}
                onClick={() => router.push(link.href)}
                className={`flex items-center p-5 w-full text-left transition-colors active:bg-gray-50 hover:bg-gray-50 ${
                  idx !== settingsLinks.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-12 h-12 bg-gray-50/80 rounded-2xl flex items-center justify-center mr-4 shrink-0 border border-gray-100">
                  {link.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-0.5">{link.title}</h3>
                  <p className="text-xs font-medium text-gray-500">{link.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
