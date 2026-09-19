'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useVerifyForgotPasswordOtpMutation, useForgotPasswordOtpMutation } from '@/lib/api';
import { OtpInput } from '@/components/ui/otp-input';

function VerifyOtpContent() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpString = otp.join('');
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get('identifier');
  
  const [verifyOtp, { isLoading }] = useVerifyForgotPasswordOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useForgotPasswordOtpMutation();

  useEffect(() => {
    if (!identifier) {
      router.replace('/forgot-password');
    }
  }, [identifier, router]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent pasting multiple chars in one field (handled by onPaste)
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (index < 6 && /^[0-9]$/.test(char)) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
    const nextEmptyIndex = newOtp.findIndex(val => val === '');
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    try {
      const result = await verifyOtp({ identifier, otp: otpString }).unwrap();
      toast.success('OTP verified successfully!');
      router.push(`/reset-password?token=${result.resetToken}`);
    } catch (err: any) {
      toast.error(err.data?.error || 'Invalid OTP');
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp({ identifier }).unwrap();
      setTimer(30);
      toast.success('OTP resent successfully');
    } catch (err: any) {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-white text-zinc-900 px-6 pt-16 pb-8">
      <div className="w-full max-w-sm mx-auto flex flex-col flex-1">
        {/* Header */}
        <div className="mb-10">
          <button onClick={() => router.back()} className="mb-6 h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Verify OTP</h1>
          <p className="text-gray-500 font-medium">Enter the 6-digit code sent to {identifier}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="mb-8">
            <OtpInput value={otpString} onChange={(val) => setOtp(val.split(''))} length={6} disabled={isLoading} />
          </div>

          <div className="mt-2 mb-6">
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 text-lg font-medium shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all active:scale-[0.98]" 
              disabled={isLoading || otpString.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </div>
        </form>
        
        <div className="mt-auto">
          <div className="text-center text-sm font-medium text-gray-500 pb-4">
            Didn't receive code?{' '}
            {timer > 0 ? (
              <span className="text-gray-400">Resend in {timer}s</span>
            ) : (
              <button 
                type="button" 
                onClick={handleResend}
                disabled={isResending}
                className="text-indigo-600 font-bold hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
        <VerifyOtpContent />
      </Suspense>
      );
}
