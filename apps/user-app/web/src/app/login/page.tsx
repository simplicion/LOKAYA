'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleLoginMutation } from '@/lib/api';
import { Eye, EyeOff, Mail, Phone, Lock, ArrowLeft } from 'lucide-react';
import { CountrySelector } from '@/components/ui/country-selector';
import { GoogleIcon } from '@/components/ui/icons';
import { AuthLayout } from '@/components/layout/auth-layout';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [login, { isLoading }] = useLoginMutation();
  const [googleLoginMut, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const result = await googleLoginMut({ token: tokenResponse.access_token }).unwrap();
        dispatch(setCredentials({ token: result.token, user: result.user }));
        toast.success('Login with Google successful');
        if (result.isNewUser || !result.user.phone) {
          router.push('/onboarding');
        } else {
          router.push(result.user.role === 'BUYER' ? '/buyer' : '/seller');
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
      dispatch(setCredentials({ token: result.token, user: result.user }));
      toast.success('Logged in successfully');
      router.push(result.user.role === 'BUYER' ? '/buyer' : '/seller');
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to login');
    }
  };

  const isPhoneInput = /^\d+$/.test(identifier);

  return (
    <AuthLayout>
      <div className="flex flex-col min-h-full bg-white text-zinc-900 px-6 pt-16 pb-8">
        <div className="w-full max-w-sm mx-auto flex flex-col flex-1">
          {/* Header */}
        <div className="mb-10">
          <button onClick={() => router.back()} className="mb-6 h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Welcome Back 👋</h1>
          <p className="text-gray-500 font-medium">Please enter your details to sign in.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-gray-700 font-semibold ml-1">Email Address or Phone Number</Label>
              <div className="flex gap-3">
                {isPhoneInput && (
                  <CountrySelector value={countryCode} onChange={setCountryCode} />
                )}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    {isPhoneInput ? <Phone className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                  </div>
                  <Input
                    id="identifier"
                    type={isPhoneInput ? "tel" : "text"}
                    placeholder="Enter email or phone number"
                    className="pl-10 h-14 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium text-base"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-semibold ml-1">Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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
              <div className="flex justify-end mt-1">
                <Link href="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 mb-6">
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 text-lg font-medium shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all active:scale-[0.98]" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </form>
        
        <div className="mt-auto">
          <div className="relative w-full mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-14 rounded-2xl border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-semibold text-base mb-8 transition-colors"
            onClick={() => handleGoogleLogin()}
            disabled={isGoogleLoading}
          >
            <GoogleIcon className="mr-3 h-5 w-5" />
            Sign in with Google
          </Button>

          <div className="text-center text-sm font-medium text-gray-500 pb-4">
            Don't have an account?{' '}
            <Link href="/register" className="text-indigo-600 font-bold hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      </div>
    </AuthLayout>
  );
}

