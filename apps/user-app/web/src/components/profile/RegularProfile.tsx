'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { logout, setCredentials } from '@/lib/features/authSlice';
import { 
  useGetPresignedUrlMutation, 
  useUpdateProfileMutation, 
  useGetMyStoreQuery,
  useUploadMediaMutation 
} from '@/lib/api';
import { toast } from 'sonner';
import { 
  Bell, 
  Camera, 
  ChevronRight,
  Wallet,
  CheckCircle,
  Package,
  MapPin,
  CreditCard,
  Star,
  Heart,
  Clock,
  Store,
  LayoutDashboard,
  Headphones,
  ShieldCheck,
  FileText,
  LogOut,
  ShoppingBag,
  XCircle,
  RotateCcw,
  Users,
  Loader2,
  User as UserIcon
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function RegularProfile() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();
  const [updateProfile] = useUpdateProfileMutation();

  const { data: myStore, isLoading: isStoreLoading } = useGetMyStoreQuery();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setAvatarError(false);

    try {
      let finalAvatarUrl = '';

      try {
        // 1. Direct Multipart upload (fastest & bypasses browser CORS)
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await uploadMedia(formData).unwrap();
        finalAvatarUrl = uploadRes.publicUrl || uploadRes.url;
      } catch (directErr) {
        console.warn('Direct upload failed, trying presigned URL:', directErr);
        // 2. Presigned URL fallback
        const { uploadUrl, publicUrl } = await getPresignedUrl({
          filename: `avatar-${Date.now()}.${file.name.split('.').pop()}`,
          contentType: file.type,
        }).unwrap();

        await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        finalAvatarUrl = publicUrl;
      }

      if (!finalAvatarUrl) {
        throw new Error('Could not get avatar image URL');
      }

      // 3. Update user profile
      const result = await updateProfile({ avatarUrl: finalAvatarUrl }).unwrap();
      dispatch(setCredentials({ user: result.user }));
      toast.success('Profile picture updated!');
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      toast.error(err?.data?.message || err?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const hasAvatar = !!user?.avatarUrl && !avatarError;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] pb-24 md:pb-8">
      <div className="px-4 space-y-4 max-w-5xl mx-auto w-full pt-4">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E5E2DC] relative">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-[#F2EFE9] border-2 border-white shadow-sm flex items-center justify-center">
                {isUploading ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Loader2 className="w-6 h-6 text-[#FF5A36] animate-spin" />
                  </div>
                ) : hasAvatar ? (
                  <img 
                    src={user!.avatarUrl} 
                    alt={user?.name || "Profile Avatar"} 
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 text-[#FF5A36] font-bold text-2xl">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-8 h-8 text-gray-400" />}
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 text-[#171717] hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-[#171717]">
                {user?.name || 'User'}
              </h2>
              <p className="text-sm font-medium text-[#6B6B6B] mt-0.5">
                {user?.email || user?.phone || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Seller Promo */}
        <div className="bg-[#F2EFE9] rounded-3xl p-5 border border-[#E5E2DC] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="pr-4">
              <h3 className="font-bold text-[#FF5A36] text-lg mb-1">
                {myStore ? 'Seller Dashboard' : 'Become a Seller!'}
              </h3>
              <p className="text-sm text-[#6B6B6B] font-medium mb-4">
                {myStore ? 'Manage your store, products, orders and more.' : 'Open your store today and start selling to millions of customers.'}
              </p>
            </div>
            {/* 3D Store Illustration Placeholder */}
            <div className="w-24 h-24 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
               <Store className="w-12 h-12 text-[#FF5A36] opacity-50" />
               {/* Decorative elements to mimic 3D */}
               <div className="absolute top-0 w-full h-4 bg-orange-200"></div>
               <div className="absolute bottom-2 w-16 h-8 bg-orange-300 rounded mx-auto left-0 right-0"></div>
            </div>
          </div>

          {!myStore ? (
            <Link href="/seller/onboarding" className="block bg-[#FF5A36] text-white text-center rounded-2xl p-4 font-bold shadow-sm hover:bg-[#e04d2d] transition-colors">
              Set Up Your Shop Now
            </Link>
          ) : (
            <Link href="/seller" className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#171717] rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                    {myStore.logoUrl ? <img src={myStore.logoUrl} alt="Store logo" className="w-full h-full object-cover" /> : myStore.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#171717] text-sm">{myStore.name}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs font-bold text-[#FF5A36]">{myStore.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-[#FF5A36]">
                  <span className="text-xs font-bold">Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* My Orders Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#E5E2DC]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[#171717]">My Orders</h3>
            <button 
              onClick={() => router.push('/orders')}
              className="text-[#FF5A36] text-sm font-semibold flex items-center gap-1 hover:underline"
            >
              View All Orders <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex justify-between items-center text-center overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex flex-col items-center gap-2 min-w-[70px]">
              <div className="relative">
                <Package className="w-7 h-7 text-[#171717]" strokeWidth={1.5} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5A36] text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                  2
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#171717]">Ordered</span>
            </div>
            <div className="flex flex-col items-center gap-2 min-w-[70px]">
              <CheckCircle className="w-7 h-7 text-[#171717]" strokeWidth={1.5} />
              <span className="text-[11px] font-medium text-[#6B6B6B]">Delivered</span>
            </div>
            <div className="flex flex-col items-center gap-2 min-w-[70px]">
              <XCircle className="w-7 h-7 text-[#171717]" strokeWidth={1.5} />
              <span className="text-[11px] font-medium text-[#6B6B6B]">Cancelled</span>
            </div>
            <div className="flex flex-col items-center gap-2 min-w-[70px]">
              <RotateCcw className="w-7 h-7 text-[#171717]" strokeWidth={1.5} />
              <span className="text-[11px] font-medium text-[#6B6B6B]">Returned</span>
            </div>
          </div>
        </div>

        {/* Quick Links Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E2DC] overflow-hidden mb-4">
          <h3 className="font-bold text-[#171717] p-5 pb-2">Quick Links</h3>
          <div className="flex flex-col">
            <QuickLinkItem icon={MapPin} label="My Addresses" href="/checkout/address" />
            <QuickLinkItem icon={CreditCard} label="Payment Methods" href="/checkout/payment" />
            <QuickLinkItem icon={Star} label="My Reviews" />
            <QuickLinkItem icon={Heart} label="Wishlist" />
            <QuickLinkItem icon={Clock} label="Recently Viewed" />
            <QuickLinkItem icon={Store} label="Followed Stores" borderBottom={false} />
          </div>
        </div>

        {/* Footer Links Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E2DC] overflow-hidden mb-6">
          <div className="flex flex-col">
            <QuickLinkItem icon={Bell} label="Notifications" />
            <QuickLinkItem icon={Headphones} label="Help & Support" />
            <QuickLinkItem icon={ShieldCheck} label="Privacy Policy" />
            <QuickLinkItem icon={FileText} label="Terms & Conditions" />
            
            <div 
              onClick={handleLogout}
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <LogOut className="w-5 h-5 text-[#FF5A36]" strokeWidth={1.5} />
                <span className="font-bold text-[#FF5A36] text-sm">Log Out</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function QuickLinkItem({ icon: Icon, label, href, borderBottom = true }: { icon: any, label: string, href?: string, borderBottom?: boolean }) {
  const content = (
    <div className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${borderBottom ? 'border-b border-gray-100' : ''}`}>
      <div className="flex items-center gap-4">
        <Icon className="w-5 h-5 text-[#171717]" strokeWidth={1.5} />
        <span className="font-bold text-[#171717] text-sm">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
