'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useSendRegistrationOtpMutation, useGoogleLoginMutation } from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Phone, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { CountrySelector } from '@/components/ui/country-selector';
import { GoogleIcon } from '@/components/ui/icons';

export default function RegisterPage() {
  const [identifier, setIdentifier] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [role] = useState('USER');
  
  const [sendOtp, { isLoading: isSendingOtp }] = useSendRegistrationOtpMutation();
  const [googleLoginMut, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/home';

  useEffect(() => {
    if (user && user.hasPassword !== false && user.age && user.gender && user.locationArea) {
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const result = await googleLoginMut({ token: tokenResponse.access_token, role }).unwrap();
        dispatch(setCredentials({ user: result.user }));
        toast.success('Signed in with Google');
        
        if (!result.hasPassword) {
          router.push('/create-password?source=google');
        } else if (result.needsOnboarding) {
          router.push('/onboarding');
        } else {
          router.push(redirectUrl);
        }
      } catch (err: any) {
        toast.error(err.data?.message || err.data?.error || 'Google sign-up failed');
      }
    },
    onError: () => toast.error('Google Sign-up Failed'),
  });

  const isPhoneInput = /^\d+$/.test(identifier.trim());

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      toast.error('Please enter your email or phone number');
      return;
    }

    try {
      const isPhone = /^\d+$/.test(cleanId);
      const formattedIdentifier = isPhone ? `${countryCode}${cleanId}` : cleanId;
      const payload = isPhone ? { phone: formattedIdentifier } : { email: formattedIdentifier };
        
      await sendOtp(payload).unwrap();
      toast.success('Verification code sent');
      
      router.push(`/verify-otp?identifier=${encodeURIComponent(formattedIdentifier)}&type=${isPhone ? 'phone' : 'email'}`);
    } catch (err: any) {
      toast.error(err.data?.message || err.data?.error || 'Failed to send OTP');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#171717] px-6 py-8">
      <div className="w-full flex flex-col flex-1 mt-4 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => router.push('/')} 
              className="h-10 w-10 flex items-center justify-center rounded-full border border-[#E5E2DC] text-[#6B6B6B] hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo className="text-2xl" />
            <div className="w-10" />
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs font-semibold text-[#FF5A36] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join Lokaya Today</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717] mb-2">
            Create your account
          </h1>
          <p className="text-[#6B6B6B] font-medium text-sm">
            Enter your email or phone number. We will send you a one-time verification code.
          </p>
        </div>

        {/* Email / Phone Form */}
        <form onSubmit={handleContinue} className="flex flex-col">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-[#171717] font-bold ml-1 text-sm">
                Email Address or Mobile Number
              </Label>
              <div className="flex gap-2">
                {isPhoneInput && identifier.length > 0 && (
                  <CountrySelector value={countryCode} onChange={setCountryCode} />
                )}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#999999]">
                    {isPhoneInput && identifier.length > 0 ? <Phone className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                  </div>
                  <Input
                    id="identifier"
                    type={isPhoneInput && identifier.length > 0 ? "tel" : "text"}
                    placeholder="name@example.com or 9876543210"
                    className="pl-11 h-13 rounded-2xl bg-[#FAF9F6] border-[#E5E2DC] focus:border-[#FF5A36] focus:bg-white focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-medium text-base text-[#171717] placeholder:text-[#999999]"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 mb-6">
            <Button 
              type="submit" 
              className="w-full bg-[#FF5A36] hover:bg-[#e04d2d] text-white rounded-2xl h-13 text-base font-bold shadow-[0_8px_30px_rgba(255,90,54,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2" 
              disabled={isSendingOtp || !identifier.trim()}
            >
              {isSendingOtp ? 'Sending verification code...' : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </form>
        
        {/* Divider */}
        <div className="relative w-full mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#E5E2DC]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-[#999999] font-medium tracking-wider">
              Or sign up with
            </span>
          </div>
        </div>

        {/* Google Sign-up */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-13 rounded-2xl border-[#E5E2DC] bg-white hover:bg-[#FAF9F6] text-[#171717] font-bold text-base mb-6 transition-colors shadow-sm flex items-center justify-center gap-3"
          onClick={() => handleGoogleLogin()}
          disabled={isGoogleLoading}
        >
          <GoogleIcon className="h-5 w-5" />
          <span>{isGoogleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
        </Button>

        {/* Sign In Link */}
        <div className="text-center text-sm font-medium text-[#6B6B6B] mt-auto pt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-[#FF5A36] font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
