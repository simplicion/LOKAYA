'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { 
  useOnboardDeliveryPartnerMutation, 
  useGetDeliveryProfileQuery,
  useGetMyStoreQuery,
  useGetPricingBenchmarksQuery,
  useUploadMediaMutation,
  useGetOnboardingConfigQuery
} from '@/lib/api';
import { 
  Bike, 
  Car, 
  Truck, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  Camera, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Zap,
  Sparkles,
  Store,
  Footprints,
  Flame,
  BadgePercent,
  Banknote,
  DollarSign,
  Coins,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { LocationService, LocationContext } from '@/lib/services/location.service';
import { logout } from '@/lib/features/authSlice';
import { clearCart } from '@/lib/features/cartSlice';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DeliveryOnboardingPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: profile, isLoading: isProfileLoading, refetch } = useGetDeliveryProfileQuery(undefined, { skip: !user });
  const { data: myStore, isLoading: isStoreLoading } = useGetMyStoreQuery(undefined, { skip: !user });
  const { data: onboardingConfig, isLoading: isOnboardingConfigLoading } = useGetOnboardingConfigQuery();
  const [onboardDeliveryPartner, { isLoading: isSubmitting }] = useOnboardDeliveryPartnerMutation();
  const [uploadMedia] = useUploadMediaMutation();

  // Dynamic policy from admin toggle (defaults to false for startup fast-track)
  const requireRiderDocs = Boolean(onboardingConfig?.requireRiderDocs);

  const [step, setStep] = useState(1);

  // Live Location & Dynamic Country State
  const [locationContext, setLocationContext] = useState<LocationContext | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  const [locationManuallyEdited, setLocationManuallyEdited] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: (user as any)?.age || 24,
    gender: (user as any)?.gender || 'MALE',
    phone: user?.phone || '',
    email: user?.email || '',
    latitude: 28.6139,
    longitude: 77.2090,
    locationArea: '',
    vehicleType: 'MOTORCYCLE',
    vehicleNumber: '',
    perKmRate: 8.0,
    baseFare: 40.0,
    selfieUrl: user?.avatarUrl || '',
    identityDocumentType: 'GOVERNMENT_ID',
    identityDocumentUrl: '',
    vehiclePhotoUrl: '',
    vehicleDocumentUrl: ''
  });

  // Load location automatically on mount
  const handleDetectLocation = useCallback(async (force = false) => {
    setIsDetectingLocation(true);
    try {
      const loc = await LocationService.detectUserLocation(force);
      setLocationContext(loc);
      setFormData(prev => ({
        ...prev,
        latitude: loc.latitude || prev.latitude,
        longitude: loc.longitude || prev.longitude,
        locationArea: (!locationManuallyEdited || !prev.locationArea) 
          ? (loc.formattedAddress || [loc.city, loc.state, loc.country].filter(Boolean).join(', ')) 
          : prev.locationArea,
      }));
      if (force) {
        toast.success(`Location updated: ${loc.city ? `${loc.city}, ` : ''}${loc.state ? `${loc.state}, ` : ''}${loc.country}`);
      }
    } catch (err) {
      console.warn('Failed to detect location:', err);
      toast.error('Unable to auto-detect location. Default region selected.');
    } finally {
      setIsDetectingLocation(false);
    }
  }, [locationManuallyEdited]);

  useEffect(() => {
    handleDetectLocation();
  }, [handleDetectLocation]);

  // Pre-fill user details from auth
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  // If user has no phone and location dial code is available, pre-fill country calling code
  useEffect(() => {
    if (locationContext?.callingCode && !formData.phone) {
      setFormData(prev => ({
        ...prev,
        phone: `${locationContext.callingCode} `,
      }));
    }
  }, [locationContext, formData.phone]);

  const { data: benchmarkData } = useGetPricingBenchmarksQuery(
    { lat: formData.latitude, lng: formData.longitude }
  );

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // If already approved, redirect to dashboard
  useEffect(() => {
    if (profile && profile.status === 'APPROVED') {
      router.push('/delivery');
    }
  }, [profile, router]);

  // Handle GPS detection with high accuracy reverse geocoding
  const handleDetectGPS = async () => {
    await handleDetectLocation(true);
  };

  // Upload handler for documents
  const handleFileUpload = async (field: 'selfieUrl' | 'identityDocumentUrl' | 'vehiclePhotoUrl' | 'vehicleDocumentUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await uploadMedia(data).unwrap();
      const finalUrl = res?.publicUrl || res?.url;
      if (finalUrl) {
        setFormData((prev) => ({ ...prev, [field]: finalUrl }));
        toast.success('File uploaded successfully!');
      } else {
        throw new Error('Upload missing public URL');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingField(null);
    }
  };

  const currentFloor = benchmarkData?.floors?.[formData.vehicleType] || 3.0;
  const currencySym = locationContext?.currencySymbol || benchmarkData?.benchmark?.currencySymbol || '₹';

  const handleSubmit = async () => {
    if (requireRiderDocs) {
      if (!formData.selfieUrl) {
        toast.error('Please upload your Selfie photo.');
        return;
      }
      if (!formData.identityDocumentUrl) {
        toast.error('Please upload your Government ID document.');
        return;
      }
      const isEco = formData.vehicleType === 'WALKER' || formData.vehicleType === 'BICYCLE';
      if (!isEco && !formData.vehicleDocumentUrl) {
        toast.error('Please upload your vehicle registration paper / RC.');
        setStep(2);
        return;
      }
    }

    try {
      const defaultFloor = benchmarkData?.floors?.[formData.vehicleType] || 3.0;
      const defaultBase = benchmarkData?.benchmark?.minDeliveryFloor || 50.0;
      const defaultKm = Math.max(defaultFloor, benchmarkData?.benchmark?.standardPerKmRate ? benchmarkData.benchmark.standardPerKmRate / 2 : 8.0);
      const isEco = formData.vehicleType === 'WALKER' || formData.vehicleType === 'BICYCLE';

      const payload = {
        name: formData.name.trim(),
        age: Number(formData.age) || 24,
        gender: (formData.gender || 'MALE').toUpperCase(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
        latitude: formData.latitude,
        longitude: formData.longitude,
        locationArea: formData.locationArea,
        // Detected location & currency metadata
        country: locationContext?.country,
        countryCode: locationContext?.countryCode,
        state: locationContext?.state,
        city: locationContext?.city,
        currency: locationContext?.currency,
        currencySymbol: locationContext?.currencySymbol,
        // Vehicle & Pricing
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber?.trim() || (isEco ? formData.vehicleType : 'RC_AUTO'),
        perKmRate: formData.perKmRate || defaultKm,
        baseFare: formData.baseFare || defaultBase,
        selfieUrl: formData.selfieUrl || undefined,
        identityDocumentType: formData.identityDocumentType || 'GOVERNMENT_ID',
        identityDocumentUrl: formData.identityDocumentUrl || undefined,
        vehiclePhotoUrl: formData.vehiclePhotoUrl || undefined,
        vehicleDocumentUrl: formData.vehicleDocumentUrl || undefined
      };

      await onboardDeliveryPartner(payload).unwrap();
      if (!requireRiderDocs) {
        toast.success('🎉 Account approved! Welcome to the Lokaya Rider Fleet.');
        window.location.href = '/delivery';
      } else {
        toast.success('🎉 Application submitted for verification!');
        setStep(4);
      }
    } catch (err: any) {
      const msg = err?.data?.message || (err?.data?.errors?.[0]?.message ? `${err.data.errors[0].path.join('.')}: ${err.data.errors[0].message}` : null) || err?.message || 'Failed to submit onboarding application';
      toast.error(msg);
    }
  };

  const vehicleOptions = [
    { 
      type: 'MOTORCYCLE', 
      label: 'Motorbike (100-150cc)', 
      icon: Bike,
      mileage: '50-55 km/L',
      fuelCost: `~${currencySym}1.80/km`,
      desc: 'High speed, 0-15km operating range'
    },
    { 
      type: 'SCOOTER', 
      label: 'Scooty / Activa (110-125cc)', 
      icon: Bike,
      mileage: '38-45 km/L',
      fuelCost: `~${currencySym}2.20/km`,
      desc: 'City commuter, 0-10km operating range'
    },
    { 
      type: 'BICYCLE', 
      label: 'Bicycle / Cycle', 
      icon: Bike,
      mileage: '0 Fuel (Eco)',
      fuelCost: `${currencySym}0.00 fuel`,
      desc: 'Rapid hyperlocal dispatch, 0-3.5km range'
    },
    { 
      type: 'WALKER', 
      label: 'Walker / Footwalk', 
      icon: Footprints,
      mileage: '0 Fuel (Walking)',
      fuelCost: `${currencySym}0.00 fuel`,
      desc: 'Ultra-hyperlocal market orders, 0-1.5km range'
    },
  ];

  if (isStoreLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

  // If user already owns a store, show single-role exclusivity block
  if (myStore) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#FAF9F6]">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E2DC] shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
            <Store className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              Single Role Policy
            </span>
            <h1 className="text-xl font-black text-[#171717]">You are already a Store Merchant</h1>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Lokaya operates on a strict single-role policy. This account is registered to <strong>{myStore.name}</strong>. 
              To deliver orders as a partner rider, please create or log in with a dedicated personal account.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Button
              onClick={() => router.push('/seller')}
              className="w-full h-11 rounded-xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-xs shadow-xs"
            >
              Go to Store Seller Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                dispatch(logout());
                dispatch(clearCart());
                router.push('/login');
              }}
              className="w-full h-11 rounded-xl border-[#E5E2DC] text-[#171717] font-bold text-xs hover:bg-gray-50"
            >
              Log Out & Switch Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#FF5A36] text-xs font-bold border border-orange-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lokaya Fleet Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#171717]">Delivery Partner Onboarding</h1>
          <p className="text-xs text-[#6B6B6B] max-w-sm mx-auto">
            Earn with round-trip 2-way delivery charges, customizable per-km rates, and local merchant connections.
          </p>
        </div>

        {/* ONE-LINE DYNAMIC LOCATION & CURRENCY BANNER */}
        <div className="bg-[#FAF9F6] border border-[#E5E2DC] rounded-2xl p-3 md:p-3.5 shadow-sm">
          {isDetectingLocation ? (
            <div className="flex items-center justify-center gap-2 py-1 text-xs text-[#6B6B6B]">
              <Loader2 className="w-4 h-4 text-[#FF5A36] animate-spin" />
              <span>Detecting your live location...</span>
            </div>
          ) : locationContext ? (
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Left: Flag + Country + Code + Currency + Symbol in one line */}
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

              {/* Right: Refresh Button */}
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
                variant="ghost"
                size="sm"
                onClick={() => handleDetectLocation(true)}
                className="h-7 text-xs text-[#FF5A36] hover:text-[#e04d2d]"
              >
                Retry
              </Button>
            </div>
          )}
        </div>

        {/* Stepper Progress */}
        {step < 4 && (
          <div className="flex items-center justify-between px-6 max-w-md mx-auto">
            {(requireRiderDocs
              ? [
                  { num: 1, label: 'Personal' },
                  { num: 2, label: 'Vehicle & Papers' },
                  { num: 3, label: 'Identity KYC' },
                ]
              : [
                  { num: 1, label: 'Personal' },
                  { num: 2, label: 'Vehicle Setup' },
                ]
            ).map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step >= s.num
                      ? 'bg-[#FF5A36] text-white shadow-xs'
                      : 'bg-white text-[#6B6B6B] border border-[#E5E2DC]'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${step >= s.num ? 'text-[#171717]' : 'text-[#A3A3A3]'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: Personal Info & GPS */}
        {step === 1 && (
          <div className="bg-white rounded-3xl p-6 border border-[#E5E2DC] shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#171717] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF5A36] text-xs font-black flex items-center justify-center">1</span>
              Personal & Operating Location
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#E5E2DC] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] font-medium text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#171717] block mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    min={18}
                    max={80}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#E5E2DC] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#171717] block mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-[#E5E2DC] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] font-medium text-xs bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={locationContext?.callingCode ? `${locationContext.callingCode} 98XXXXXXXX` : '+977 98XXXXXXXX'}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#E5E2DC] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] font-medium text-xs"
                />
              </div>

              {/* Live Location Capture */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#171717]">Operating Base Area (GPS)</label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={isDetectingLocation}
                    className="text-[11px] font-extrabold text-[#FF5A36] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isDetectingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                    <span>Auto-Detect GPS</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.locationArea}
                  onChange={(e) => {
                    setLocationManuallyEdited(true);
                    setFormData({ ...formData, locationArea: e.target.value });
                  }}
                  placeholder="e.g. Kathmandu, Bagmati, Nepal"
                  className="w-full h-11 px-3.5 rounded-xl border border-[#E5E2DC] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] font-medium text-xs"
                />
              </div>
            </div>

            <Button
              onClick={() => {
                if (!formData.name || !formData.phone) {
                  toast.error('Please provide your name and phone number.');
                  return;
                }
                setStep(2);
              }}
              className="w-full h-12 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md mt-4"
            >
              <span>{requireRiderDocs ? 'Continue to Vehicle Details & Papers' : 'Continue to Vehicle Setup'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: Vehicle Mode & Vehicle Documents / Papers */}
        {step === 2 && (
          <div className="bg-white rounded-3xl p-6 border border-[#E5E2DC] shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#171717] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF5A36] text-xs font-black flex items-center justify-center">2</span>
              {requireRiderDocs ? 'Vehicle Details & Papers' : 'Vehicle Mode & Setup'}
            </h2>

            <div className="space-y-3">
              <label className="text-xs font-bold text-[#171717] block">Select Your Delivery Vehicle Mode</label>
              
              <div className="relative">
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                  className="w-full h-12 rounded-2xl bg-[#F2EFE9] border-none px-4 pr-10 text-xs font-bold text-[#171717] outline-none focus:ring-2 focus:ring-[#FF5A36] cursor-pointer appearance-none transition-all"
                >
                  {vehicleOptions.map((v) => (
                    <option key={v.type} value={v.type}>
                      {v.label} — {v.mileage}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Active Selected Vehicle Card Preview */}
              {(() => {
                const selected = vehicleOptions.find((v) => v.type === formData.vehicleType) || vehicleOptions[0];
                const Icon = selected.icon;
                return (
                  <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#FF5A36] text-white flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#171717]">{selected.label}</p>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                            {selected.mileage}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B6B6B] mt-0.5">{selected.desc}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-[#FF5A36]">{selected.fuelCost}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Vehicle Registration Number Input */}
              {formData.vehicleType !== 'WALKER' && formData.vehicleType !== 'BICYCLE' && (
                <div className="pt-1">
                  <label className="text-xs font-bold text-[#171717] block mb-1">
                    Vehicle Registration / Plate Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    placeholder="e.g. DL 01 AB 1234 or BA 2 PA 1234"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#E5E2DC] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] font-medium text-xs uppercase"
                  />
                </div>
              )}

              {/* Fast-Track Startup Mode Notice or Strict KYC Document Uploads */}
              {!requireRiderDocs ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 space-y-1 mt-2">
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    Fast-Track Rider Verification Active
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Document uploads (vehicle papers, RC, and identity scans) are bypassed. You will be automatically approved and activated upon submission!
                  </p>
                </div>
              ) : formData.vehicleType !== 'WALKER' && formData.vehicleType !== 'BICYCLE' ? (
                <>
                  {/* Vehicle Papers / RC Document Upload */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-[#171717] block mb-1.5">
                      Upload Vehicle Registration / RC Document (Papers)
                    </label>
                    <div className="p-3.5 rounded-2xl border border-dashed border-[#E5E2DC] bg-[#FAF9F6] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#171717] truncate">Vehicle RC / Papers</p>
                          <p className="text-[10px] text-[#6B6B6B]">RC, Bluebook, or Insurance document</p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {formData.vehicleDocumentUrl ? (
                          <div className="flex items-center gap-2">
                            <img src={formData.vehicleDocumentUrl} alt="RC Document" className="w-10 h-10 rounded-lg object-cover border" />
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={(e) => handleFileUpload('vehicleDocumentUrl', e)}
                            />
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E5E2DC] text-[#171717] text-xs font-bold hover:bg-gray-50 shadow-xs">
                              {uploadingField === 'vehicleDocumentUrl' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                              Upload Document
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Photo Upload */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-[#171717] block mb-1.5">
                      Upload Photo of Your Vehicle
                    </label>
                    <div className="p-3.5 rounded-2xl border border-dashed border-[#E5E2DC] bg-[#FAF9F6] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF5A36] flex items-center justify-center border border-orange-100">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#171717]">Vehicle Photo</p>
                          <p className="text-[10px] text-[#6B6B6B]">JPG or PNG format</p>
                        </div>
                      </div>

                      {formData.vehiclePhotoUrl ? (
                        <div className="flex items-center gap-2">
                          <img src={formData.vehiclePhotoUrl} alt="Vehicle" className="w-10 h-10 rounded-lg object-cover border" />
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload('vehiclePhotoUrl', e)}
                          />
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E5E2DC] text-[#171717] text-xs font-bold hover:bg-gray-50 shadow-xs">
                            {uploadingField === 'vehiclePhotoUrl' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            Upload Photo
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 space-y-1">
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Eco-Friendly Zero-Fuel Delivery Mode
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Walking and bicycle delivery partners do not require vehicle registration papers, RC, or vehicle photos.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-12 rounded-2xl border-[#E5E2DC] text-[#171717] font-bold text-sm"
              >
                Back
              </Button>
              {requireRiderDocs ? (
                <Button
                  onClick={() => {
                    const isEco = formData.vehicleType === 'WALKER' || formData.vehicleType === 'BICYCLE';
                    if (!isEco && !formData.vehicleDocumentUrl) {
                      toast.error('Please upload your vehicle registration paper / RC document.');
                      return;
                    }
                    if (!isEco && !formData.vehiclePhotoUrl) {
                      toast.error('Please upload a photo of your vehicle.');
                      return;
                    }
                    setStep(3);
                  }}
                  className="flex-1 h-12 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Continue to KYC Documents</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Account...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Complete & Start Delivering</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: KYC Documents */}
        {step === 3 && requireRiderDocs && (
          <div className="bg-white rounded-3xl p-6 border border-[#E5E2DC] shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#171717] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-[#FF5A36] text-xs font-black flex items-center justify-center">3</span>
              KYC Document Verification
            </h2>

            <div className="space-y-3">
              {/* Document 1: Selfie */}
              <div className="p-3.5 rounded-2xl border border-[#E5E2DC] bg-[#FAF9F6] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF5A36] flex items-center justify-center shrink-0 border border-orange-100">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#171717] truncate">1. Rider Photo (Selfie)</p>
                    <p className="text-[10px] text-[#6B6B6B]">Clear face portrait</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {formData.selfieUrl ? (
                    <div className="flex items-center gap-2">
                      <img src={formData.selfieUrl} alt="Selfie" className="w-8 h-8 rounded-lg object-cover border" />
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload('selfieUrl', e)}
                      />
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E5E2DC] text-[#171717] text-xs font-bold hover:bg-gray-50 shadow-xs">
                        {uploadingField === 'selfieUrl' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        Upload
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Document 2: Government ID */}
              <div className="p-3.5 rounded-2xl border border-[#E5E2DC] bg-[#FAF9F6] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#171717] truncate">2. Government ID</p>
                    <p className="text-[10px] text-[#6B6B6B]">Aadhaar, License, Voter ID, or National ID</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {formData.identityDocumentUrl ? (
                    <div className="flex items-center gap-2">
                      <img src={formData.identityDocumentUrl} alt="Govt ID" className="w-8 h-8 rounded-lg object-cover border" />
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileUpload('identityDocumentUrl', e)}
                      />
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E5E2DC] text-[#171717] text-xs font-bold hover:bg-gray-50 shadow-xs">
                        {uploadingField === 'identityDocumentUrl' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        Upload
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 h-12 rounded-2xl border-[#E5E2DC] text-[#171717] font-bold text-sm"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Application</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Success Confirmation */}
        {step === 4 && (
          <div className="bg-white rounded-3xl p-8 border border-[#E5E2DC] shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-[#171717]">Application Submitted!</h2>
              <p className="text-xs text-[#6B6B6B] leading-relaxed max-w-xs mx-auto">
                Thank you for applying to become a Lokaya Delivery Partner. Your documents have been submitted for verification.
              </p>
            </div>

            <Button
              onClick={() => router.push('/delivery')}
              className="w-full h-12 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-sm shadow-md"
            >
              Open Delivery Dashboard
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
