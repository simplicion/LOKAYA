'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useUpdateProfileMutation } from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { setLocation } from '@/lib/features/locationSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  X,
  UserCheck,
  Shield 
} from 'lucide-react';
import { 
  motion, 
  AnimatePresence, 
  PressableScale, 
  triggerCelebrationConfetti 
} from '@/components/ui/motion';

const GENDER_OPTIONS = [
  { id: 'Male', label: 'Male', icon: User },
  { id: 'Female', label: 'Female', icon: UserCheck },
  { id: 'Other', label: 'Other', icon: Sparkles },
  { id: 'Prefer not to say', label: 'Prefer not to say', icon: Shield },
];

const POPULAR_AGES = [18, 21, 24, 28, 35];

interface OnboardingBottomSheetProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function OnboardingBottomSheet({ isOpen, onClose, onSuccess }: OnboardingBottomSheetProps) {
  const { user } = useSelector((state: any) => state.auth);
  const locationState = useSelector((state: any) => state.location);
  const dispatch = useDispatch();

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
      toast.success('Profile saved successfully!');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      toast.error(err.data?.message || err.data?.error || 'Failed to complete profile');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="bg-white w-full max-w-lg rounded-t-[36px] sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col relative z-10 hardware-accelerated"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs font-semibold text-[#FF5A36]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Complete Profile</span>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <h2 className="text-xl font-bold text-[#171717] mb-1">
              Tell us about yourself
            </h2>
            <p className="text-xs text-[#6B6B6B] mb-5">
              Enter your details and tap Auto-Detect to find nearby stores and exclusive local offers.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <Label htmlFor="bs-name" className="text-xs font-bold text-[#171717]">Full Name</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#999999]">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="bs-name"
                    type="text"
                    placeholder="Your full name"
                    className="pl-10 h-11 rounded-2xl bg-[#FAF9F6] border-[#E5E2DC] text-sm font-medium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Age */}
              <div className="space-y-1">
                <Label htmlFor="bs-age" className="text-xs font-bold text-[#171717]">Age</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#999999]">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <Input
                    id="bs-age"
                    type="number"
                    min={13}
                    max={120}
                    placeholder="e.g. 24"
                    className="pl-10 h-11 rounded-2xl bg-[#FAF9F6] border-[#E5E2DC] text-sm font-medium"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-medium text-[#999999] shrink-0">Quick:</span>
                  {POPULAR_AGES.map((a) => (
                    <PressableScale key={a} scale={0.92}>
                      <button
                        type="button"
                        onClick={() => setAge(a)}
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                          Number(age) === a
                            ? 'bg-[#FF5A36] text-white shadow-sm'
                            : 'bg-[#FAF9F6] border border-[#E5E2DC] text-[#6B6B6B]'
                        }`}
                      >
                        {a}
                      </button>
                    </PressableScale>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#171717]">Gender</Label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map((opt) => {
                    const isSelected = gender === opt.id;
                    return (
                      <PressableScale key={opt.id} scale={0.96}>
                        <button
                          type="button"
                          onClick={() => setGender(opt.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-2xl border text-left text-xs transition-all ${
                            isSelected
                              ? 'border-[#FF5A36] bg-[#FF5A36]/5 text-[#FF5A36] ring-2 ring-[#FF5A36]/20 font-bold'
                              : 'border-[#E5E2DC] bg-[#FAF9F6] text-[#171717]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <opt.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FF5A36]' : 'text-[#6B6B6B]'}`} />
                            <span className="font-medium">{opt.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#FF5A36] stroke-[3]" />}
                        </button>
                      </PressableScale>
                    );
                  })}
                </div>
              </div>

              {/* Location with Auto-Detect */}
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-bold text-[#171717]">Location Area</Label>
                <PressableScale scale={0.97}>
                  <button
                    type="button"
                    onClick={handleAutoDetectLocation}
                    disabled={isDetectingLocation}
                    className={`w-full p-2.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm ${
                      locationArea
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-orange-50 border-orange-200 text-[#FF5A36]'
                    }`}
                  >
                    {isDetectingLocation ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin text-[#FF5A36]" />
                        <span>Detecting location...</span>
                      </>
                    ) : locationArea ? (
                      <>
                        <Navigation className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                        <span>Auto-Detected: {locationArea}</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5 text-[#FF5A36]" />
                        <span>Auto-Detect Location (One-Tap)</span>
                      </>
                    )}
                  </button>
                </PressableScale>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#999999]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <Input
                    id="bs-locationArea"
                    type="text"
                    placeholder="Or enter location manually"
                    className="pl-10 h-11 rounded-2xl bg-[#FAF9F6] border-[#E5E2DC] text-xs text-[#171717]"
                    value={locationArea}
                    onChange={(e) => setLocationArea(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3">
                <Button
                  type="submit"
                  className="w-full bg-[#FF5A36] hover:bg-[#e04d2d] text-white rounded-2xl h-12 text-sm font-bold shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
                  disabled={isSaving || !name.trim() || !age || !gender || !locationArea.trim()}
                >
                  {isSaving ? 'Saving...' : (
                    <>
                      <span>Complete Setup</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
