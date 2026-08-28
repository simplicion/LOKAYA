'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { useUpdateProfileMutation } from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Phone, Lock, CheckCircle2, User } from 'lucide-react';
import { CountrySelector } from '@/components/ui/country-selector';

export default function OnboardingPage() {
  const { user } = useSelector((state: any) => state.auth);
  
  const [name, setName] = useState(user?.name || '');
  const [identifier, setIdentifier] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('User session not found');
      return;
    }

    try {
      const isPhone = /^\d+$/.test(identifier);
      const phone = identifier ? (isPhone ? `${countryCode}${identifier}` : identifier) : undefined;

      const payload = {
        userId: user.id,
        phone,
        password: password || undefined,
        name: name || undefined,
      };
        
      const updatedUser = await updateProfile(payload).unwrap();
      // Update redux with the new user info
      dispatch(setCredentials({ user: updatedUser }));
      
      toast.success('Onboarding complete!');
      router.push('/allow-location');
    } catch (err: any) {
      toast.error(err.data?.message || err.data?.error || 'Failed to update profile');
    }
  };

  return (
          <div className="flex flex-col min-h-full bg-white text-zinc-900 px-6 pt-16 pb-8">
        <div className="w-full max-w-sm mx-auto flex flex-col flex-1">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Complete Profile 🚀</h1>
            <p className="text-gray-500 font-medium">Just a few more details to secure your account.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="space-y-5">
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-semibold ml-1">Full Name</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <User className="h-5 w-5" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    className="pl-10 h-14 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium text-base"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-gray-700 font-semibold ml-1">Phone Number (Optional)</Label>
                <div className="flex gap-3">
                  <CountrySelector value={countryCode} onChange={setCountryCode} />
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Phone className="h-5 w-5" />
                    </div>
                    <Input
                      id="identifier"
                      type="tel"
                      placeholder="Enter phone number"
                      className="pl-10 h-14 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium text-base"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-semibold ml-1">Set Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    className="pl-10 pr-10 h-14 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium text-base"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-sm text-gray-500 ml-1 mt-1">Required to secure your account for future logins.</p>
              </div>
            </div>

            <div className="mt-8 mb-6">
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 text-lg font-medium shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Complete Onboarding'} <CheckCircle2 className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
      );
}
