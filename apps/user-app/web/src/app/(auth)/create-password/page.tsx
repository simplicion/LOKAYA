'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useRegisterMutation, useSetPasswordMutation } from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, ArrowLeft, ArrowRight, KeyRound, Check, CheckCircle2 } from 'lucide-react';

export default function CreatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);

  const identifier = searchParams.get('identifier') || '';
  const otp = searchParams.get('otp') || '';
  const source = searchParams.get('source') || (user ? 'google' : '');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [registerMut, { isLoading: isRegistering }] = useRegisterMutation();
  const [setPasswordMut, { isLoading: isSettingPassword }] = useSetPasswordMutation();

  const isSubmitting = isRegistering || isSettingPassword;

  // Validation rules
  const hasMinLength = password.length >= 6;
  const hasNumberOrSpecial = /[0-9!@#$%^&*]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMinLength) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      if (source === 'google' || (user && !identifier)) {
        // Logged-in Google user setting password
        await setPasswordMut({ password }).unwrap();
        toast.success('Password created successfully!');
        router.push('/onboarding');
      } else {
        // Email / Phone sign-up flow completing with OTP & Password
        if (!identifier || !otp) {
          toast.error('Missing verification details. Please start sign-up again.');
          router.push('/register');
          return;
        }

        const isPhone = /^\+?\d+$/.test(identifier);
        const payload = isPhone
          ? { phone: identifier, otp, password, role: 'USER' }
          : { email: identifier, otp, password, role: 'USER' };

        const result = await registerMut(payload).unwrap();
        dispatch(setCredentials({ user: result.user }));
        toast.success('Account created successfully!');
        router.push('/onboarding');
      }
    } catch (err: any) {
      toast.error(err.data?.message || err.data?.error || 'Failed to create password');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#171717] px-6 py-8">
      <div className="w-full flex flex-col flex-1 mt-4 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => router.back()} 
              className="h-10 w-10 flex items-center justify-center rounded-full border border-[#E5E2DC] text-[#6B6B6B] hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo className="text-2xl" />
            <div className="w-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-xs font-semibold text-[#FF5A36] mb-3">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Step 3 of 4: Security</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#171717] mb-2">
            Create a password
          </h1>
          <p className="text-[#6B6B6B] font-medium text-sm">
            {source === 'google' 
              ? 'Set a secure password so you can also log in directly using your email.' 
              : 'Choose a strong password to protect your Lokaya account.'}
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#171717] font-bold ml-1 text-sm">
                New Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#999999]">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password (min 6 characters)"
                  className="pl-11 pr-11 h-13 rounded-2xl bg-[#FAF9F6] border-[#E5E2DC] focus:border-[#FF5A36] focus:bg-white focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-medium text-base text-[#171717] placeholder:text-[#999999]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#999999] hover:text-[#171717] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#171717] font-bold ml-1 text-sm">
                Confirm Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#999999]">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  className="pl-11 pr-11 h-13 rounded-2xl bg-[#FAF9F6] border-[#E5E2DC] focus:border-[#FF5A36] focus:bg-white focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-medium text-base text-[#171717] placeholder:text-[#999999]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#999999] hover:text-[#171717] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Password Validation Hints */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC] space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasMinLength ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className={hasMinLength ? 'text-emerald-600 font-medium' : 'text-[#6B6B6B]'}>
                  At least 6 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${hasNumberOrSpecial ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className={hasNumberOrSpecial ? 'text-emerald-600 font-medium' : 'text-[#6B6B6B]'}>
                  Includes a number or symbol (recommended)
                </span>
              </div>
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordsMatch ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {passwordsMatch ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <span className="text-[10px]">✕</span>}
                  </div>
                  <span className={passwordsMatch ? 'text-emerald-600 font-medium' : 'text-rose-500 font-medium'}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 mb-6">
            <Button 
              type="submit" 
              className="w-full bg-[#FF5A36] hover:bg-[#e04d2d] text-white rounded-2xl h-13 text-base font-bold shadow-[0_8px_30px_rgba(255,90,54,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2" 
              disabled={isSubmitting || !hasMinLength || (confirmPassword.length > 0 && !passwordsMatch)}
            >
              {isSubmitting ? 'Securing Account...' : (
                <>
                  <span>Create Password & Continue</span>
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
