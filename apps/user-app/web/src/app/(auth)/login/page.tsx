'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleLoginMutation } from '@/lib/api';
import { Eye, EyeOff, Mail, Phone, Lock, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { CountrySelector } from '@/components/ui/country-selector';
import { GoogleIcon } from '@/components/ui/icons';

function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const user = useSelector((state: any) => state.auth.user);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectUrl = (rawRedirect.startsWith('/') && !rawRedirect.startsWith('/login')) ? rawRedirect : '/';
  
  useEffect(() => {
    if (user) {
      router.replace(redirectUrl);
    }
  }, [user, router, redirectUrl]);
  
  const [login, { isLoading }] = useLoginMutation();
  const [googleLoginMut, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const dispatch = useDispatch();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const result = await googleLoginMut({ token: tokenResponse.access_token }).unwrap();
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
        toast.error(err.data?.message || err.data?.error || 'Google login failed');
      }
    },
    onError: () => toast.error('Google Login Failed'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isPhone = /^\d+$/.test(identifier);
      const payload = isPhone ? { phone: `${countryCode}${identifier}`, password } : { email: identifier, password };
      
      const result = await login(payload).unwrap();
      dispatch(setCredentials({ user: result.user }));
      toast.success('Logged in successfully');
      if (result.needsOnboarding || !result.user.age || !result.user.gender || !result.user.locationArea) {
        router.push('/onboarding');
      } else {
        router.push(redirectUrl);
      }
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to login');
    }
  };

  const isPhoneInput = /^\d+$/.test(identifier);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#171717] px-6 py-8">
      <div className="w-full flex flex-col flex-1 mt-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.push('/')} className="h-10 w-10 flex items-center justify-center rounded-full border border-[#E5E2DC] text-[#6B6B6B] hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo className="text-2xl" />
            <div className="w-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717] mb-2">Welcome Back</h1>
          <p className="text-[#6B6B6B] font-medium">Please enter your details to sign in.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-[#171717] font-bold ml-1">Email Address or Phone Number</Label>
              <div className="flex gap-3">
                {isPhoneInput && (
                  <CountrySelector value={countryCode} onChange={setCountryCode} />
                )}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#999999]">
                    {isPhoneInput ? <Phone className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                  </div>
                  <Input
                    id="identifier"
                    type={isPhoneInput ? "tel" : "text"}
                    placeholder="Enter email or phone number"
                    className="pl-10 h-12 rounded-xl bg-[#FAF9F6] border-[#E5E2DC] focus:border-[#FF5A36] focus:bg-white focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-medium text-base text-[#171717] placeholder:text-[#999999]"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-[#171717] font-bold">Password</Label>
                <Link href="/forgot-password" className="text-sm font-bold text-[#FF5A36] hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#999999]">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-12 h-12 rounded-xl bg-[#FAF9F6] border-[#E5E2DC] focus:border-[#FF5A36] focus:bg-white focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-medium text-base text-[#171717] placeholder:text-[#999999]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#999999] hover:text-[#171717] transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

          </div>

          <div className="mt-4 mb-6">
            <Button 
              type="submit" 
              className="w-full bg-[#FF5A36] hover:bg-[#e04d2d] text-white rounded-xl h-12 text-base font-bold shadow-[0_8px_30px_rgba(255,90,54,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2" 
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </form>
        
        <div className="mt-4">
          <div className="relative w-full mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#E5E2DC]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-[#6B6B6B] font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-[#E5E2DC] bg-white hover:bg-[#FAF9F6] text-[#171717] font-bold text-base mb-6 transition-colors shadow-sm"
            onClick={() => handleGoogleLogin()}
            disabled={isGoogleLoading}
          >
            <GoogleIcon className="mr-3 h-5 w-5" />
            Sign in with Google
          </Button>

          <div className="text-center text-sm font-medium text-[#6B6B6B]">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#FF5A36] font-bold hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}


