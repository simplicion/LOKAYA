'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';
import Link from 'next/link';
import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { CountrySelector } from '@/components/ui/country-selector';
import { useForgotPasswordOtpMutation } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const router = useRouter();
  const [sendOtp, { isLoading }] = useForgotPasswordOtpMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isPhoneInput = /^\d+$/.test(identifier);
      const payloadIdentifier = isPhoneInput ? `${countryCode}${identifier}` : identifier;
      
      await sendOtp({ identifier: payloadIdentifier }).unwrap();
      
      toast.success('If an account exists, a reset link will be sent shortly.');
      router.push(`/verify-reset-otp?identifier=${encodeURIComponent(payloadIdentifier)}`);
    } catch (err: any) {
      toast.error(err.data?.message || err.data?.error || 'Failed to process request');
    }
  };

  const isPhoneInput = /^\d+$/.test(identifier);

  return (
    <div className="flex flex-col min-h-screen justify-center bg-white text-[#171717] px-6 py-8">
      <div className="w-full max-w-sm mx-auto flex flex-col flex-1 pt-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full border border-[#E5E2DC] text-[#6B6B6B] hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Logo className="text-2xl text-[#FF5A36]" />
            <div className="w-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717] mb-2">Reset Password</h1>
          <p className="text-[#6B6B6B] font-medium">Enter your email or phone number to receive a reset link.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="space-y-5">
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
                    className="pl-10 h-14 rounded-2xl bg-[#FAF9F6] border-[#E5E2DC] focus:border-[#FF5A36] focus:bg-white focus:ring-4 focus:ring-[#FF5A36]/10 transition-all font-medium text-base text-[#171717] placeholder:text-[#999999]"
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
              className="w-full bg-[#FF5A36] hover:bg-[#e04d2d] text-white rounded-2xl h-14 text-lg font-bold shadow-[0_8px_30px_rgba(255,90,54,0.2)] transition-all active:scale-[0.98]" 
              disabled={isLoading || identifier.trim() === ''}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </form>
        
        <div className="mt-auto">
          <div className="text-center text-sm font-medium text-[#6B6B6B] pb-4">
            Remember your password?{' '}
            <Link href="/login" className="text-[#FF5A36] font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
