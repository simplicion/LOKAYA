'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useRegisterMutation } from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { useGoogleLoginMutation } from '@/lib/api';
import { Eye, EyeOff, Mail, Phone, Lock, ArrowLeft, User, ArrowRight } from 'lucide-react';
import { CountrySelector } from '@/components/ui/country-selector';
import { GoogleIcon } from '@/components/ui/icons';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('USER'); // Simplified to user by default for this flow
  
  const [register, { isLoading }] = useRegisterMutation();
  const [googleLoginMut, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const result = await googleLoginMut({ token: tokenResponse.access_token, role }).unwrap();
        dispatch(setCredentials({ token: result.token, user: result.user }));
        toast.success('Registration with Google successful');
        if (result.isNewUser || !result.user.phone) {
          router.push('/onboarding');
        } else {
          router.push('/');
        }
      } catch (err: any) {
        toast.error(err.data?.message || err.data?.error || 'Google registration failed');
      }
    },
    onError: () => toast.error('Google Registration Failed'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isPhone = /^\d+$/.test(identifier);
      const payload = isPhone 
        ? { name, phone: `${countryCode}${identifier}`, password, role }
        : { name, email: identifier, password, role };
        
      const result = await register(payload).unwrap();
      dispatch(setCredentials({ token: result.token, user: result.user }));
      toast.success('Registration successful');
      router.push('/');
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to register');
    }
  };

  const isPhoneInput = /^\d+$/.test(identifier);

  return (
          <div className="flex flex-col h-full justify-center bg-white text-zinc-900 px-6">
        <div className="w-full max-w-sm mx-auto flex flex-col">
          {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-2xl font-black text-indigo-600 tracking-tight">LOKAYA</span>
            <div className="w-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Create Account ✨</h1>
          <p className="text-gray-500 font-medium">Join us and start shopping locally.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col">
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



          </div>

          <div className="mt-8 mb-6">
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 text-lg font-medium shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2" 
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
        
        <div className="mt-6">
          <div className="relative w-full mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-500 font-medium">
                Or sign up with
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
            Sign up with Google
          </Button>

          <div className="text-center text-sm font-medium text-gray-500 pb-4">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
      </div>
      );
}


