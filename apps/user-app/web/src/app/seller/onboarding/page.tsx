'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Store, 
  Phone, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  Globe2, 
  Camera, 
  RefreshCw,
  Coins,
  Sparkles,
  Bike,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Zap,
  Lock,
  Unlock
} from 'lucide-react';
import { 
  useOnboardStoreMutation, 
  useGetPresignedUrlMutation, 
  useUploadMediaMutation,
  useGetDeliveryProfileQuery,
  useGetOnboardingConfigQuery,
  useGetMyStoreQuery
} from '@/lib/api';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { logout } from '@/lib/features/authSlice';
import { clearCart } from '@/lib/features/cartSlice';
import { LocationService, LocationContext } from '@/lib/services/location.service';
import { StoreLocationPicker } from '@/components/seller/StoreLocationPicker';

export default function SellerOnboardingPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: myStore, isLoading: isMyStoreLoading } = useGetMyStoreQuery(undefined, { skip: !user });
  const { data: deliveryProfile, isLoading: isDeliveryProfileLoading } = useGetDeliveryProfileQuery(undefined, { skip: !user });
  const { data: onboardingConfig, isLoading: isOnboardingConfigLoading } = useGetOnboardingConfigQuery();

  useEffect(() => {
    if (myStore) {
      router.replace('/seller');
    }
  }, [myStore, router]);

  // Dynamic policy from admin setting (defaults to false for startup fast-track)
  const requireDocs = Boolean(onboardingConfig?.requireSellerDocs);

  // Wizard Step (1: Store Basics & Location, 2: Verification Documents)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Live Location & Dynamic Country State
  const [locationContext, setLocationContext] = useState<LocationContext | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    contactPhone: '',
    category: 'Handmade & Crafts',
    customCategory: '',
    address: '',
    ownerIdFrontUrl: '',
    ownerIdBackUrl: '',
    ownerPhotoUrl: '',
    businessDocUrl: '',
  });

  const [addressManuallyEdited, setAddressManuallyEdited] = useState(false);

  // Uploading states
  const [uploadingOwnerIdFront, setUploadingOwnerIdFront] = useState(false);
  const [uploadingOwnerIdBack, setUploadingOwnerIdBack] = useState(false);
  const [uploadingOwnerPhoto, setUploadingOwnerPhoto] = useState(false);
  const [uploadingBusinessDoc, setUploadingBusinessDoc] = useState(false);

  // Load location automatically on mount
  const handleDetectLocation = useCallback(async (force = false) => {
    setIsDetectingLocation(true);
    try {
      const loc = await LocationService.detectUserLocation(force);
      setLocationContext(loc);
      if (force) {
        toast.success(`Location updated: ${loc.city ? `${loc.city}, ` : ''}${loc.state ? `${loc.state}, ` : ''}${loc.country}`);
      }
    } catch (err) {
      console.warn('Failed to detect location:', err);
      toast.error('Unable to auto-detect location. Default region selected.');
    } finally {
      setIsDetectingLocation(false);
    }
  }, []);

  useEffect(() => {
    handleDetectLocation();
  }, [handleDetectLocation]);

  // Pre-fill store name & contact phone
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        contactPhone: prev.contactPhone || user.phone || '',
      }));
    }
  }, [user]);

  // If user has no phone and location dial code is available, suggest calling code
  useEffect(() => {
    if (locationContext?.callingCode && !formData.contactPhone) {
      setFormData(prev => ({
        ...prev,
        contactPhone: prev.contactPhone || `${locationContext.callingCode} `,
      }));
    }
  }, [locationContext, formData.contactPhone]);

  // Auto-fill address from live OpenStreetMap location
  useEffect(() => {
    if (locationContext && !addressManuallyEdited) {
      setFormData(prev => ({
        ...prev,
        address: prev.address || locationContext.formattedAddress || [locationContext.city, locationContext.state, locationContext.country].filter(Boolean).join(', '),
      }));
    }
  }, [locationContext, addressManuallyEdited]);

  const [onboardStore, { isLoading: isSubmitting }] = useOnboardStoreMutation();
  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();

  const handleFileUpload = async (file: File, type: string) => {
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast.error('Please select an image or PDF file');
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return null;
    }

    try {
      // 1. Direct Multipart Upload
      const data = new FormData();
      data.append('file', file);

      const res = await uploadMedia(data).unwrap();
      const finalUrl = res?.publicUrl || res?.url;
      if (finalUrl) return finalUrl;
      throw new Error('Upload response missing URL');
    } catch (err: any) {
      console.warn('Direct upload attempt failed, trying presigned fallback:', err);
      try {
        // 2. Fallback to Presigned URL upload
        const res = await getPresignedUrl({
          filename: `${type}-${Date.now()}.${file.name.split('.').pop()}`,
          contentType: file.type,
        }).unwrap();

        const uploadUrl = res.uploadUrl || res.signedUrl;
        const publicUrl = res.publicUrl || res.url;

        if (!uploadUrl) {
          throw new Error('No upload URL returned from server');
        }

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadRes.ok) {
          throw new Error(`Storage upload failed (${uploadRes.status})`);
        }

        return publicUrl;
      } catch (fallbackErr: any) {
        console.error('File upload failed:', fallbackErr);
        toast.error('Failed to upload file to storage');
        return null;
      }
    }
  };

  const onOwnerIdFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingOwnerIdFront(true);
    const url = await handleFileUpload(file, 'owner-id-front');
    if (url) {
      setFormData(prev => ({ ...prev, ownerIdFrontUrl: url }));
      toast.success('Identity document (Front) uploaded');
    }
    setUploadingOwnerIdFront(false);
  };

  const onOwnerIdBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingOwnerIdBack(true);
    const url = await handleFileUpload(file, 'owner-id-back');
    if (url) {
      setFormData(prev => ({ ...prev, ownerIdBackUrl: url }));
      toast.success('Identity document (Back) uploaded');
    }
    setUploadingOwnerIdBack(false);
  };

  const onOwnerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingOwnerPhoto(true);
    const url = await handleFileUpload(file, 'owner-photo');
    if (url) {
      setFormData(prev => ({ ...prev, ownerPhotoUrl: url }));
      toast.success('Owner photograph uploaded');
    }
    setUploadingOwnerPhoto(false);
  };

  const onBusinessDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBusinessDoc(true);
    const url = await handleFileUpload(file, 'business-license');
    if (url) {
      setFormData(prev => ({ ...prev, businessDocUrl: url }));
      toast.success('Business certificate uploaded');
    }
    setUploadingBusinessDoc(false);
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter your store name');
      return false;
    }
    if (!formData.contactPhone.trim()) {
      toast.error('Please enter your contact phone number');
      return false;
    }
    const finalCategory = (formData.category === '__CUSTOM__' ? formData.customCategory : formData.category).trim();
    if (!finalCategory) {
      toast.error('Please select or specify your store category');
      return false;
    }
    if (!formData.address.trim()) {
      toast.error('Please provide your store address');
      return false;
    }
    return true;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;

    if (requireDocs) {
      // Advance to Document Verification step
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Fast-Track Startup Mode: Submit directly without document requirements
      executeSubmission();
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    if (!formData.ownerIdFrontUrl) {
      return toast.error('Please upload your Government Identity Document (Front Side)');
    }
    if (!formData.ownerIdBackUrl) {
      return toast.error('Please upload your Government Identity Document (Back Side)');
    }
    if (!formData.ownerPhotoUrl) {
      return toast.error('Please upload the Owner Identity Photograph');
    }

    executeSubmission();
  };

  const executeSubmission = async () => {
    const finalCategory = (formData.category === '__CUSTOM__' ? formData.customCategory : formData.category).trim();

    const payload = {
      name: formData.name.trim(),
      contactPhone: formData.contactPhone.trim(),
      category: finalCategory,
      address: formData.address.trim(),
      // Universal documents
      ownerIdFrontUrl: formData.ownerIdFrontUrl || undefined,
      ownerIdBackUrl: formData.ownerIdBackUrl || undefined,
      ownerPhotoUrl: formData.ownerPhotoUrl || undefined,
      businessDocUrl: formData.businessDocUrl || undefined,
      // Backward-compatible mappings
      aadhaarFrontUrl: formData.ownerIdFrontUrl || undefined,
      aadhaarBackUrl: formData.ownerIdBackUrl || undefined,
      panCardUrl: formData.ownerPhotoUrl || undefined,
      gstOrLicenseUrl: formData.businessDocUrl || undefined,
      // Detected Location Metadata
      latitude: locationContext?.latitude,
      longitude: locationContext?.longitude,
      country: locationContext?.country,
      countryCode: locationContext?.countryCode,
      state: locationContext?.state,
      city: locationContext?.city,
      currency: locationContext?.currency,
      currencySymbol: locationContext?.currencySymbol,
    };

    try {
      const res = await onboardStore(payload).unwrap();
      const isVerified = res?.store?.status === 'VERIFIED' || res?.status === 'VERIFIED' || !requireDocs;
      if (isVerified) {
        toast.success('🎉 Store activated! Welcome to your Seller Workspace.');
      } else {
        toast.success('Store application submitted! Waiting for admin review.');
      }
      window.location.href = '/seller';
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to submit store onboarding');
    }
  };

  const isUploadingAny = uploadingOwnerIdFront || uploadingOwnerIdBack || uploadingOwnerPhoto || uploadingBusinessDoc;

  if (isDeliveryProfileLoading || isOnboardingConfigLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

  // Single Operational Role Rule: If user is already a Delivery Partner
  if (deliveryProfile) {
    const handleLogoutAndRegisterSeller = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1'}/identity/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch {}
      dispatch(logout());
      dispatch(clearCart());
      toast.info('Logged out. Please register or sign in with your separate seller account.');
      router.push('/register');
    };

    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center shadow-sm">
          <Bike className="w-10 h-10 text-[#FF6B00]" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider rounded-full">
            Single Operational Role Policy
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Already a Delivery Partner
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your account is currently registered as a <span className="font-bold text-slate-900">Lokaya Delivery Partner</span> ({deliveryProfile.vehicleType || 'Rider'} • {deliveryProfile.vehicleNumber || 'Active'}).
          </p>
          <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            Under Lokaya’s account architecture, each account is dedicated to a single operational role (Buyer, Seller, or Delivery Partner) to ensure clear financial settlement, payout accounting, and dispatch integrity.
          </p>
        </div>

        <div className="w-full space-y-3 pt-2">
          <Button
            onClick={() => router.push('/delivery')}
            className="w-full h-13 py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Bike className="w-4 h-4 text-[#FF6B00]" />
            <span>Go to Delivery Partner Dashboard</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/profile')}
            className="w-full h-12 rounded-2xl font-bold text-xs text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            Return to Profile
          </Button>

          <button
            type="button"
            onClick={handleLogoutAndRegisterSeller}
            className="w-full text-center text-xs font-bold text-[#FF5A36] hover:underline pt-2 cursor-pointer"
          >
            Switch Account to Open a Seller Store →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 md:py-10 px-4 md:px-0">
      
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#171717] tracking-tight mb-1.5">
          {requireDocs ? (currentStep === 1 ? 'Set up your Store' : 'Verify your Business') : 'Set up your Store'}
        </h1>
        {requireDocs && (
          <p className="text-[#6B6B6B] text-sm md:text-base">
            {currentStep === 1 ? 'Step 1: Enter your store & location details.' : 'Step 2: Upload documents for KYC verification.'}
          </p>
        )}
      </div>

      {/* Dynamic Stepper Bar */}
      {requireDocs && (
        <div className="flex items-center justify-center gap-3 md:gap-6 mb-6">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl transition-all cursor-pointer ${
              currentStep === 1 
                ? 'bg-[#171717] text-white shadow-xs font-bold' 
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              currentStep === 1 ? 'bg-white text-[#171717]' : 'bg-emerald-600 text-white'
            }`}>
              {currentStep === 2 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </div>
            <span className="text-xs font-bold">1. Store Basics</span>
          </button>

          <div className="w-8 h-0.5 bg-[#E5E2DC]" />

          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl transition-all ${
            currentStep === 2 
              ? 'bg-[#171717] text-white shadow-xs font-bold' 
              : 'bg-white text-gray-400 border border-[#E5E2DC]'
          }`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
              currentStep === 2 ? 'bg-[#FF5A36] text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              2
            </div>
            <span className="text-xs font-bold">2. Verification Docs</span>
          </div>
        </div>
      )}

      {/* ONE-LINE DYNAMIC LOCATION & CURRENCY BANNER (OpenStreetMap Live) */}
      <div className="mb-6 bg-[#FAF9F6] border border-[#E5E2DC] rounded-2xl p-3 md:p-3.5 shadow-sm">
        {isDetectingLocation ? (
          <div className="flex items-center justify-center gap-2 py-1 text-xs text-[#6B6B6B]">
            <Loader2 className="w-4 h-4 text-[#FF5A36] animate-spin" />
            <span>Detecting your live location...</span>
          </div>
        ) : locationContext ? (
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center flex-wrap gap-2 text-xs md:text-sm text-[#171717]">
              <span className="text-xl leading-none select-none" role="img" aria-label={locationContext.country}>
                {locationContext.flag}
              </span>
              <span className="font-bold text-[#171717]">{locationContext.country}</span>
              <span className="text-[#888]">•</span>
              <span className="font-semibold text-[#555] bg-[#EFECE6] px-1.5 py-0.5 rounded text-xs">
                {locationContext.countryCode}
              </span>
              <span className="text-[#888]">•</span>
              <div className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md text-xs">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>Currency: {locationContext.currency} {locationContext.currencySymbol ? `(${locationContext.currencySymbol})` : ''}</span>
              </div>
              {locationContext.state && (
                <>
                  <span className="text-[#888] hidden sm:inline">•</span>
                  <span className="text-xs text-[#666] hidden sm:inline font-medium">
                    State: {locationContext.state}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => handleDetectLocation(true)}
                title="Refresh live location"
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#171717] hover:bg-[#EFECE6] border border-[#E5E2DC] bg-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#FF5A36]" />
              Location service offline.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDetectLocation(true)}
              className="h-7 text-xs rounded-lg cursor-pointer"
            >
              Retry Detection
            </Button>
          </div>
        )}
      </div>

      {/* STEP 1: STORE BASICS & LOCATION */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-[#E5E2DC] animate-in fade-in duration-200">
          <form onSubmit={handleStep1Submit} className="space-y-6">
            
            {/* Store Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#171717] font-semibold text-sm">
                Store / Business Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#6B6B6B]">
                  <Store className="h-5 w-5" />
                </div>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Kathmandu Handicrafts & Studio"
                  required
                  className="pl-11 h-14 rounded-2xl bg-[#F2EFE9] border-none focus-visible:ring-1 focus-visible:ring-[#FF5A36]"
                />
              </div>
            </div>

            {/* Contact Phone */}
            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="text-[#171717] font-semibold text-sm">
                Business Contact Phone <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#6B6B6B]">
                  <Phone className="h-5 w-5" />
                </div>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  placeholder={locationContext?.callingCode ? `${locationContext.callingCode} 9801234567` : '+977 9801234567'}
                  required
                  className="pl-11 h-14 rounded-2xl bg-[#F2EFE9] border-none focus-visible:ring-1 focus-visible:ring-[#FF5A36]"
                />
              </div>
            </div>

            {/* Store Primary Category Dropdown & Custom Category */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category" className="text-[#171717] font-semibold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF5A36]" />
                  Primary Store Category <span className="text-red-500">*</span>
                </Label>
                {formData.category === '__CUSTOM__' && (
                  <span className="text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                    Custom Category
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-14 rounded-2xl bg-[#F2EFE9] border-none px-4 text-sm font-semibold text-[#171717] outline-none focus:ring-1 focus:ring-[#FF5A36] cursor-pointer"
                >
                  <option value="Handmade & Crafts">Handmade & Crafts</option>
                  <option value="Fashion & Apparel">Fashion & Apparel</option>
                  <option value="Footwear & Shoes">Footwear & Shoes</option>
                  <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                  <option value="Grocery & Food">Grocery & Food</option>
                  <option value="Health & Beauty">Health & Beauty</option>
                  <option value="Home & Decor">Home & Decor</option>
                  <option value="Jewelry & Accessories">Jewelry & Accessories</option>
                  <option value="Art & Collectibles">Art & Collectibles</option>
                  <option value="Books & Stationery">Books & Stationery</option>
                  <option value="Sports & Fitness">Sports & Fitness</option>
                  <option value="Toys & Baby Products">Toys & Baby Products</option>
                  <option value="Pet Supplies">Pet Supplies</option>
                  <option value="Automotive & Hardware">Automotive & Hardware</option>
                  <option value="__CUSTOM__">✨ + Create Custom Category...</option>
                </select>

                {formData.category === '__CUSTOM__' && (
                  <div className="relative">
                    <Input
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      placeholder="Enter your custom store category (e.g. Organic Herbal Teas & Spices)"
                      required
                      className="h-14 rounded-2xl bg-[#F2EFE9] border border-orange-200 focus-visible:ring-1 focus-visible:ring-[#FF5A36] text-sm"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                      Custom
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Store Location / Address (Auto-filled from OpenStreetMap) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="address" className="text-[#171717] font-semibold text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Store Location / Physical Address <span className="text-red-500">*</span>
                </Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#6B6B6B]">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => {
                    setAddressManuallyEdited(true);
                    setFormData({ ...formData, address: e.target.value });
                  }}
                  placeholder="Shop number, street, locality, landmark, city"
                  required
                  className="pl-11 h-14 rounded-2xl bg-[#F2EFE9] border-none focus-visible:ring-1 focus-visible:ring-[#FF5A36] text-sm"
                />
              </div>

              {/* Interactive Map Pinpoint Picker */}
              <div className="pt-2">
                <StoreLocationPicker
                  initialLat={locationContext?.latitude}
                  initialLng={locationContext?.longitude}
                  initialAddress={formData.address}
                  onLocationSelect={(loc) => {
                    setAddressManuallyEdited(true);
                    setFormData(prev => ({ ...prev, address: loc.address }));
                    setLocationContext(prev => prev ? {
                      ...prev,
                      latitude: loc.lat,
                      longitude: loc.lng,
                      city: loc.city || prev.city,
                      state: loc.state || prev.state,
                      formattedAddress: loc.address,
                    } : {
                      latitude: loc.lat,
                      longitude: loc.lng,
                      country: 'Default',
                      countryCode: '',
                      state: loc.state || '',
                      city: loc.city || '',
                      currency: 'NPR',
                      currencySymbol: '',
                      flag: '🌐',
                      callingCode: '+977',
                      formattedAddress: loc.address,
                      source: 'gps'
                    });
                  }}
                />
              </div>
            </div>

            {/* Step 1 Action Button */}
            <div className="pt-3">
              {requireDocs ? (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white text-base font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Document Verification</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white text-base font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating your store...
                    </span>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-white" />
                      <span>Launch Store & Start Selling (Instant)</span>
                    </>
                  )}
                </Button>
              )}
            </div>

          </form>
        </div>
      )}

      {/* STEP 2: IDENTITY & BUSINESS VERIFICATION (Only shown when requireDocs is true) */}
      {currentStep === 2 && requireDocs && (
        <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-[#E5E2DC] animate-in fade-in duration-200">
          <form onSubmit={handleStep2Submit} className="space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Store Basics</span>
              </button>

              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                Step 2 of 2: KYC Review
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-[#171717] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FF5A36]" />
                Identity & Business Verification
              </h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Universal seller verification accepted globally. Please upload clear scans or photographs.
              </p>
            </div>

            {/* DOCUMENT 1: Government-Issued Identity Document (Front & Back) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#171717] font-semibold text-sm flex items-center gap-1.5">
                    <Globe2 className="w-4 h-4 text-[#FF5A36]" />
                    Government-Issued Identity Document <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-[11px] text-[#777] mt-0.5">
                    Citizenship Card, Passport, National ID, or Driver&apos;s License
                  </p>
                </div>
                <span className="text-[11px] font-medium text-[#777] bg-[#F2EFE9] px-2 py-0.5 rounded-full shrink-0">
                  Front & Back Required
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ID Front */}
                <div className="border-2 border-dashed border-[#E5E2DC] rounded-2xl p-4 text-center transition-all bg-[#FAF9F6] hover:bg-[#F2EFE9]/60">
                  {formData.ownerIdFrontUrl ? (
                    <div className="flex flex-col items-center justify-center p-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold text-emerald-800 mb-1">ID (Front / Info Page) Uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(p => ({ ...p, ownerIdFrontUrl: '' }))}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 mt-1 cursor-pointer"
                      >
                        Remove / Re-upload
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-2">
                      <input type="file" id="ownerIdFront" accept="image/*,.pdf" className="hidden" onChange={onOwnerIdFrontUpload} />
                      <Label htmlFor="ownerIdFront" className="cursor-pointer flex flex-col items-center gap-1.5 w-full">
                        {uploadingOwnerIdFront ? (
                          <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin mb-1" />
                        ) : (
                          <FileText className="w-8 h-8 text-[#888888] mb-1" />
                        )}
                        <span className="text-xs font-bold text-[#171717]">ID (Front / Info Page)</span>
                        <span className="text-[11px] font-medium text-[#FF5A36]">Click to upload</span>
                        <span className="text-[10px] text-[#999999]">JPG, PNG or PDF (Max 10MB)</span>
                      </Label>
                    </div>
                  )}
                </div>

                {/* ID Back */}
                <div className="border-2 border-dashed border-[#E5E2DC] rounded-2xl p-4 text-center transition-all bg-[#FAF9F6] hover:bg-[#F2EFE9]/60">
                  {formData.ownerIdBackUrl ? (
                    <div className="flex flex-col items-center justify-center p-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold text-emerald-800 mb-1">ID (Back / Address Page) Uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(p => ({ ...p, ownerIdBackUrl: '' }))}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 mt-1 cursor-pointer"
                      >
                        Remove / Re-upload
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-2">
                      <input type="file" id="ownerIdBack" accept="image/*,.pdf" className="hidden" onChange={onOwnerIdBackUpload} />
                      <Label htmlFor="ownerIdBack" className="cursor-pointer flex flex-col items-center gap-1.5 w-full">
                        {uploadingOwnerIdBack ? (
                          <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin mb-1" />
                        ) : (
                          <FileText className="w-8 h-8 text-[#888888] mb-1" />
                        )}
                        <span className="text-xs font-bold text-[#171717]">ID (Back / Address Page)</span>
                        <span className="text-[11px] font-medium text-[#FF5A36]">Click to upload</span>
                        <span className="text-[10px] text-[#999999]">JPG, PNG or PDF (Max 10MB)</span>
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DOCUMENT 2: Owner Identity Photograph */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#171717] font-semibold text-sm flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#FF5A36]" />
                    Owner Identity Photograph <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-[11px] text-[#777] mt-0.5">
                    Clear color portrait or selfie of the store owner / authorized representative
                  </p>
                </div>
                <span className="text-[11px] font-medium text-[#777] bg-[#F2EFE9] px-2 py-0.5 rounded-full shrink-0">
                  Owner Photo Required
                </span>
              </div>

              <div className="border-2 border-dashed border-[#E5E2DC] rounded-2xl p-4 text-center transition-all bg-[#FAF9F6] hover:bg-[#F2EFE9]/60">
                {formData.ownerPhotoUrl ? (
                  <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-semibold">Owner Photograph Uploaded Successfully</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(p => ({ ...p, ownerPhotoUrl: '' }))}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 cursor-pointer"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-2">
                    <input type="file" id="ownerPhoto" accept="image/*" className="hidden" onChange={onOwnerPhotoUpload} />
                    <Label htmlFor="ownerPhoto" className="cursor-pointer flex flex-col items-center gap-1.5 w-full">
                      {uploadingOwnerPhoto ? (
                        <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin mb-1" />
                      ) : (
                        <Camera className="w-8 h-8 text-[#888888] mb-1" />
                      )}
                      <span className="text-xs font-bold text-[#171717]">Upload Owner Photo / Selfie</span>
                      <span className="text-[11px] font-medium text-[#FF5A36]">Click to browse files</span>
                      <span className="text-[10px] text-[#999999]">Clear face portrait • JPG or PNG (Max 10MB)</span>
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* DOCUMENT 3: Business Registration & Tax Certificate (Optional / Recommended) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#171717] font-semibold text-sm flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#6B6B6B]" />
                    Business Registration & Tax Certificate
                  </Label>
                  <p className="text-[11px] text-[#777] mt-0.5">
                    Trade License, Incorporation Certificate, or Tax Registration (VAT, PAN, GST, EIN)
                  </p>
                </div>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  Commercial Proof (Optional)
                </span>
              </div>

              <div className="border-2 border-dashed border-[#E5E2DC] rounded-2xl p-4 text-center transition-all bg-[#FAF9F6] hover:bg-[#F2EFE9]/60">
                {formData.businessDocUrl ? (
                  <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-semibold">Business Certificate / License Uploaded</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(p => ({ ...p, businessDocUrl: '' }))}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 cursor-pointer"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-2">
                    <input type="file" id="businessDoc" accept="image/*,.pdf" className="hidden" onChange={onBusinessDocUpload} />
                    <Label htmlFor="businessDoc" className="cursor-pointer flex flex-col items-center gap-1.5 w-full">
                      {uploadingBusinessDoc ? (
                        <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin mb-1" />
                      ) : (
                        <FileText className="w-8 h-8 text-[#888888] mb-1" />
                      )}
                      <span className="text-xs font-semibold text-[#555555]">
                        Click to upload Trade License or Tax Registration <span className="text-[#888] font-normal">(Optional)</span>
                      </span>
                      <span className="text-[10px] text-[#999999]">JPG, PNG or PDF (Max 10MB)</span>
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2 Submit Action */}
            <div className="pt-3">
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploadingAny}
                className="w-full h-14 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white text-base font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting application...
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Submit Application for Review</span>
                  </>
                )}
              </Button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
