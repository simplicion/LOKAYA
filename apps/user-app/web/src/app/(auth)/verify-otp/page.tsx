'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyRegistrationOtpMutation, useSendRegistrationOtpMutation } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { OtpInput } from '@/components/ui/otp-input';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Mail, Phone, Edit2, ShieldCheck, RefreshCw } from 'lucide-react';
import { MotionShake } from '@/components/ui/motion';

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get('identifier') || '';
  const type = searchParams.get('type') || (identifier.includes('@') ? 'email' : 'phone');
  
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(45);
  const [errorCount, setErrorCount] = useState(0);

  const [verifyOtpMut, { isLoading: isVerifying }] = useVerifyRegistrationOtpMutation();
  const [sendOtpMut, { isLoading: isResending }] = useSendRegistrationOtpMutation();

  useEffect(() => {
    if (!identifier) {
      toast.error('No identifier found. Please start sign-up.');
      router.push('/register');
    }
  }, [identifier, router]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    try {
      const isPhone = type === 'phone' || /^\+?\d+$/.test(identifier);
      const payload = isPhone ? { phone: identifier } : { email: identifier };
      await sendOtpMut(payload).unwrap();
      setTimer(45);
      setOtp('');
      toast.success('A new verification code has been sent!');
    } catch (err: any) {
      setErrorCount((prev) => prev + 1);
      toast.error(err.data?.message || err.data?.error || 'Failed to resend code');
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      setErrorCount((prev) => prev + 1);
      toast.error('Please enter the full 6-digit verification code');
      return;
    }

    try {
      const isPhone = type === 'phone' || /^\+?\d+$/.test(identifier);
      const payload = isPhone ? { phone: identifier, otp } : { email: identifier, otp };
      
      await verifyOtpMut(payload).unwrap();
      toast.success('Verification successful!');
      
      // Navigate to dedicated create-password page with verified identifier and otp
      router.push(`/create-password?identifier=${encodeURIComponent(identifier)}&otp=${encodeURIComponent(otp)}`);
    } catch (err: any) {
      setErrorCount((prev) => prev + 1);
      toast.error(err.data?.message || err.data?.error || 'Invalid or expired verification code');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#171717] px-6 py-8">
      <div className="w-full flex flex-col flex-1 mt-4 max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => router.push('/register')} 
              className="h-10 w-10 flex items-center justify-center rounded-full border border-[#E5E2DC] text-[#6B6B6B] hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo className="text-2xl" />
            <div className="w-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-600 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Step 2 of 4: Verification</span>
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight text-[#171717] mb-2">
            Verify your {type === 'email' ? 'email' : 'phone'}
          </h1>
          <p className="text-[#6B6B6B] font-medium text-sm mb-4">
            We sent a 6-digit verification code to
          </p>

          {/* Identifier Badge with Change button */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E2DC]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-orange-100 text-[#FF5A36] flex items-center justify-center shrink-0">
                {type === 'phone' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              </div>
              <span className="font-semibold text-sm text-[#171717] truncate">{identifier}</span>
            </div>
            <button
              onClick={() => router.push('/register')}
              className="flex items-center gap-1 text-xs font-bold text-[#FF5A36] hover:underline shrink-0 ml-2"
            >
              <Edit2 className="w-3 h-3" />
              <span>Change</span>
            </button>
          </div>
        </div>

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="flex flex-col flex-1">
          <div className="mb-8">
            <MotionShake triggerKey={errorCount}>
              <OtpInput value={otp} onChange={setOtp} length={6} disabled={isVerifying} />
            </MotionShake>
          </div>

          <div className="mb-6">
            <Button 
              type="submit" 
              className="w-full bg-[#FF5A36] hover:bg-[#e04d2d] text-white rounded-2xl h-13 text-base font-bold shadow-[0_8px_30px_rgba(255,90,54,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2" 
              disabled={isVerifying || otp.length !== 6}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Verifying code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>

          <div className="mt-auto text-center pb-6">
            <p className="text-sm text-[#6B6B6B] font-medium">
              Didn't receive the code?{' '}
              {timer > 0 ? (
                <span className="font-semibold text-[#999999]">Resend in {timer}s</span>
              ) : (
                <button 
                  type="button" 
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-[#FF5A36] font-bold hover:underline inline-flex items-center gap-1"
                >
                  {isResending ? 'Resending...' : 'Resend Code'}
                </button>
              )}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
