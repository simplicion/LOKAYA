'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useRegisterMutation, useSendRegistrationOtpMutation, useGoogleLoginMutation } from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, Mail, Phone, Lock, ArrowLeft, User, ArrowRight } from 'lucide-react';
import { CountrySelector } from '@/components/ui/country-selector';
import { GoogleIcon } from '@/components/ui/icons';
import { OtpInput } from '@/components/ui/otp-input';

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState('USER');
  const [timer, setTimer] = useState(0);
  
  const [sendOtp, { isLoading: isSendingOtp }] = useSendRegistrationOtpMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [googleLoginMut, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const result = await googleLoginMut({ token: tokenResponse.access_token, role }).unwrap();
        dispatch(setCredentials({ user: result.user }));
        toast.success('Registration with Google successful');
        if (result.isNewUser || !result.user.phone) {
          router.push('/onboarding');
        } else {
          router.push(redirectUrl);
        }
      } catch (err: any) {
        toast.error(err.data?.message || err.data?.error || 'Google registration failed');
      }
    },
    onError: () => toast.error('Google Registration Failed'),
  });

  const isPhoneInput = /^\d+$/.test(identifier);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !identifier || !password) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      const payload = isPhoneInput 
        ? { phone: `${countryCode}${identifier}` }
        : { email: identifier };
        
      await sendOtp(payload).unwrap();
      setStep(2);
      setTimer(30);
      toast.success('Verification code sent');
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }
    try {
      const payload = isPhoneInput 
        ? { name, phone: `${countryCode}${identifier}`, password, role, otp }
        : { name, email: identifier, password, role, otp };
        
      const result = await register(payload).unwrap();
      dispatch(setCredentials({ user: result.user }));
      toast.success('Account created successfully!');
      router.push(redirectUrl);
    } catch (err: any) {
      toast.error(err.data?.message || 'Invalid or expired code');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#171717] px-6 py-8">
      <div className="w-full flex flex-col flex-1 mt-4 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => step === 2 ? setStep(1) : router.push('/')} 
              className="h-10 w-10 flex items-center justify-center rounded-full border border-[#E5E2DC] text-[#6B6B6B] hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo className="text-2xl" />
            <div className="w-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717] mb-2">
            {step === 1 ? 'Create Account' : 'Verify Code'}
          </h1>
          <p className="text-[#6B6B6B] font-medium">
            {step === 1 ? 'Join us and start shopping locally.' : `Enter the 6-digit code sent to ${identifier}`}
          </p>
        </div>

        {/* Form */}
        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="flex flex-col">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#171717] font-bold ml-1">Full Name</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#999999]">
                    <User className="h-5 w-5" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10 h-12 rounded-xl bg-[#FAF9F6] border-[#E5E2DC] focus:border-[#FF5A36] focus:bg-white focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-medium text-base text-[#171717] placeholder:text-[#999999]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-[#171717] font-bold ml-1">Email Address or Phone Number</Label>
                <div className="flex gap-3">
                  {isPhoneInput && identifier.length > 0 && (
                    <CountrySelector value={countryCode} onChange={setCountryCode} />
                  )}
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#999999]">
                      {isPhoneInput && identifier.length > 0 ? <Phone className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                    </div>
                    <Input
                      id="identifier"
                      type={isPhoneInput && identifier.length > 0 ? "tel" : "text"}
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
                <Label htmlFor="password" className="text-[#171717] font-bold ml-1">Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#999999]">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="pl-10 pr-10 h-12 rounded-xl bg-[#FAF9F6] border-[#E5E2DC] focus:border-[#FF5A36] focus:bg-white focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-medium text-base text-[#171717] placeholder:text-[#999999]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#999999] hover:text-[#171717] transition-colors"
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
                disabled={isSendingOtp}
              >
                {isSendingOtp ? 'Sending code...' : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister} className="flex flex-col flex-1">
            <div className="mb-6">
              <OtpInput value={otp} onChange={setOtp} length={6} disabled={isRegistering} />
            </div>

            <div className="mt-2 mb-6">
              <Button 
                type="submit" 
                className="w-full bg-[#FF5A36] hover:bg-[#e04d2d] text-white rounded-xl h-12 text-base font-bold shadow-[0_8px_30px_rgba(255,90,54,0.2)] transition-all active:scale-[0.98]" 
                disabled={isRegistering || otp.length !== 6}
              >
                {isRegistering ? 'Creating Account...' : 'Verify & Complete'}
              </Button>
            </div>

            <div className="mt-auto">
              <div className="text-center text-sm font-medium text-[#6B6B6B] pb-4">
                Didn't receive code?{' '}
                {timer > 0 ? (
                  <span className="text-[#999999]">Resend in {timer}s</span>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="text-[#FF5A36] font-bold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
        
        {step === 1 && (
          <div className="mt-4">
            <div className="relative w-full mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#E5E2DC]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-[#6B6B6B] font-medium">
                  Or sign up with
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
              Sign up with Google
            </Button>

            <div className="text-center text-sm font-medium text-[#6B6B6B]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#FF5A36] font-bold hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
