'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { useUpdateProfileMutation } from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { setLocation } from '@/lib/features/locationSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';
import { 
  User, 
  MapPin, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Compass, 
  Navigation, 
  RotateCw,
  Calendar,
  UserCheck,
  Shield
} from 'lucide-react';
import { PressableScale, triggerCelebrationConfetti } from '@/components/ui/motion';

const GENDER_OPTIONS = [
  { id: 'Male', label: 'Male', icon: User },
  { id: 'Female', label: 'Female', icon: UserCheck },
  { id: 'Other', label: 'Other', icon: Sparkles },
  { id: 'Prefer not to say', label: 'Prefer not to say', icon: Shield },
];

const POPULAR_AGES = [18, 21, 24, 28, 35];

export default function OnboardingPage() {
  const { user } = useSelector((state: any) => state.auth);
  const locationState = useSelector((state: any) => state.location);
  const dispatch = useDispatch();
  const router = useRouter();

  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState<number | string>(user?.age || '');
  const [gender, setGender] = useState<string>(user?.gender || '');
  const [locationArea, setLocationArea] = useState<string>(user?.locationArea || locationState?.address || '');
  const [city, setCity] = useState<string>(user?.city || '');
  const [state, setState] = useState<string>(user?.state || '');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    user?.latitude && user?.longitude ? { lat: user.latitude, lng: user.longitude } : null
  );

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [updateProfileMut, { isLoading: isSaving }] = useUpdateProfileMutation();

  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name);
    }
  }, [user, name]);

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          // Reverse geocode with OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.village || addr.town || addr.city_district || '';
            const detectedCity = addr.city || addr.town || addr.county || addr.state_district || '';
            const detectedState = addr.state || '';

            const areaParts = [suburb, detectedCity].filter(Boolean);
            const detectedArea = areaParts.length > 0 ? areaParts.join(', ') : (data.display_name?.split(',').slice(0, 2).join(', ') || 'Current Location');

            setLocationArea(detectedArea);
            setCity(detectedCity);
            setState(detectedState);

            // Update redux location slice
            dispatch(setLocation({ latitude, longitude, address: detectedArea }));
            toast.success(`Location detected: ${detectedArea}`);
          } else {
            const fallbackArea = 'Current Location';
            setLocationArea(fallbackArea);
            dispatch(setLocation({ latitude, longitude, address: fallbackArea }));
            toast.success('Location detected!');
          }
        } catch (err) {
          console.error('Reverse geocode error:', err);
          const fallbackArea = 'Current Location';
          setLocationArea(fallbackArea);
          dispatch(setLocation({ latitude, longitude, address: fallbackArea }));
          toast.success('Location detected!');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Could not detect location. Please allow permission or enter manually.');
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!age || Number(age) < 13 || Number(age) > 120) {
      toast.error('Please enter a valid age (13+)');
      return;
    }
    if (!gender) {
      toast.error('Please select your gender');
      return;
    }
    if (!locationArea.trim()) {
      toast.error('Please detect or enter your location area');
      return;
    }

    try {
      const payload: any = {
        name: name.trim(),
        age: Number(age),
        gender,
        locationArea: locationArea.trim(),
        city: city || undefined,
        state: state || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
      };

      const result = await updateProfileMut(payload).unwrap();
      
      if (result.user) {
        dispatch(setCredentials({ user: result.user }));
      }
      
      if (coords && locationArea) {
        dispatch(setLocation({ latitude: coords.lat, longitude: coords.lng, address: locationArea }));
      }

      triggerCelebrationConfetti();
      toast.success('Profile completed! Welcome to Lokaya');
      router.push('/home');
    } catch (err: any) {
      toast.error(err.data?.message || err.data?.error || 'Failed to complete profile');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#171717] px-6 py-8">
      <div className="w-full flex flex-col flex-1 mt-2 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Logo className="text-2xl" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-600">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 4 of 4: Profile</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#171717] mb-1.5">
            Tell us about yourself
          </h1>
          <p className="text-[#6B6B6B] font-medium text-sm">
            Personalize your experience to discover local stores, deals, and creator reels nearby.
          </p>
        </div>

        {/* Onboarding Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 space-y-5">
          {/* 1. Name Field */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[#171717] font-bold ml-1 text-sm flex items-center justify-between">
              <span>Your Name</span>
              <span className="text-xs text-[#999999] font-normal">Required</span>
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#999999]">
                <User className="h-5 w-5" />
              </div>
              <Input
                id="name"
                type="text"
                placeholder="What should we call you?"
                className="pl-11 h-12 rounded-2xl bg-[#FAF9F6] border-[#E5E2DC] focus:border-[#FF5A36] focus:bg-white focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-medium text-base text-[#171717] placeholder:text-[#999999]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 2. Age Field */}
          <div className="space-y-1.5">
            <Label htmlFor="age" className="text-[#171717] font-bold ml-1 text-sm flex items-center justify-between">
              <span>Your Age</span>
              <span className="text-xs text-[#999999] font-normal">For personalized recommendations</span>
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#999999]">
                <Calendar className="h-5 w-5" />
              </div>
              <Input
                id="age"
                type="number"
                min={13}
                max={120}
                placeholder="e.g. 24"
                className="pl-11 h-12 rounded-2xl bg-[#FAF9F6] border-[#E5E2DC] focus:border-[#FF5A36] focus:bg-white focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-medium text-base text-[#171717] placeholder:text-[#999999]"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>
            {/* Quick age pill selectors */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
              <span className="text-xs font-semibold text-[#999999] shrink-0">Quick:</span>
              {POPULAR_AGES.map((a) => (
                <PressableScale key={a} scale={0.92}>
                  <button
                    type="button"
                    onClick={() => setAge(a)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      Number(age) === a
                        ? 'bg-[#FF5A36] text-white shadow-sm shadow-orange-500/20'
                        : 'bg-[#FAF9F6] border border-[#E5E2DC] text-[#6B6B6B] hover:bg-gray-100'
                    }`}
                  >
                    {a}
                  </button>
                </PressableScale>
              ))}
            </div>
          </div>

          {/* 3. Gender Selection */}
          <div className="space-y-1.5">
            <Label className="text-[#171717] font-bold ml-1 text-sm">Gender</Label>
            <div className="grid grid-cols-2 gap-2">
              {GENDER_OPTIONS.map((opt) => {
                const isSelected = gender === opt.id;
                return (
                  <PressableScale key={opt.id} scale={0.96}>
                    <button
                      type="button"
                      onClick={() => setGender(opt.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                        isSelected
                          ? 'border-[#FF5A36] bg-[#FF5A36]/5 text-[#FF5A36] ring-2 ring-[#FF5A36]/20 font-bold'
                          : 'border-[#E5E2DC] bg-[#FAF9F6] hover:bg-gray-50 text-[#171717] font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <opt.icon className={`w-4 h-4 ${isSelected ? 'text-[#FF5A36]' : 'text-[#6B6B6B]'}`} />
                        <span className="text-sm">{opt.label}</span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#FF5A36] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  </PressableScale>
                );
              })}
            </div>
          </div>

          {/* 4. Location Section with Auto-Detect */}
          <div className="space-y-2 pt-1">
            <Label className="text-[#171717] font-bold ml-1 text-sm flex items-center justify-between">
              <span>Your Location</span>
              <span className="text-xs text-[#FF5A36] font-semibold">Powers local feed & delivery</span>
            </Label>

            {/* Auto-detect button */}
            <button
              type="button"
              onClick={handleAutoDetectLocation}
              disabled={isDetectingLocation}
              className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-center gap-2.5 text-sm font-bold shadow-sm ${
                locationArea
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-gradient-to-r from-orange-50 to-amber-50 border-[#FF5A36]/30 text-[#FF5A36] hover:from-orange-100 hover:to-amber-100 ring-2 ring-[#FF5A36]/10'
              }`}
            >
              {isDetectingLocation ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-[#FF5A36]" />
                  <span>Detecting your location...</span>
                </>
              ) : locationArea ? (
                <>
                  <Navigation className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>Auto-Detected: {locationArea}</span>
                </>
              ) : (
                <>
                  <Compass className="w-5 h-5 text-[#FF5A36] animate-pulse" />
                  <span>Auto-Detect My Location (One-Tap)</span>
                </>
              )}
            </button>

            {/* Manual input / Edit location */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#999999]">
                <MapPin className="h-5 w-5" />
              </div>
              <Input
                id="locationArea"
                type="text"
                placeholder="Or enter area / city manually (e.g. Koramangala, Bengaluru)"
                className="pl-11 h-12 rounded-2xl bg-[#FAF9F6] border-[#E5E2DC] focus:border-[#FF5A36] focus:bg-white focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-medium text-sm text-[#171717] placeholder:text-[#999999]"
                value={locationArea}
                onChange={(e) => setLocationArea(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 pb-6">
            <Button
              type="submit"
              className="w-full bg-[#FF5A36] hover:bg-[#e04d2d] text-white rounded-2xl h-13 text-base font-bold shadow-[0_8px_30px_rgba(255,90,54,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              disabled={isSaving || !name.trim() || !age || !gender || !locationArea.trim()}
            >
              {isSaving ? 'Saving Profile...' : (
                <>
                  <span>Start Exploring Lokaya</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
