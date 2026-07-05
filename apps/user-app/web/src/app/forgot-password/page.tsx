'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { CountrySelector } from '@/components/ui/country-selector';
import { AuthLayout } from '@/components/layout/auth-layout';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('If an account exists, a reset link will be sent shortly.');
      router.push('/login');
    } catch (err: any) {
      toast.error('Failed to process request');
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Reset Password 🔒</h1>
          <p className="text-gray-500 font-medium">Enter your email or phone number to receive a reset link.</p>
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
          </div>

          <div className="mt-8 mb-6">
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 text-lg font-medium shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all active:scale-[0.98]" 
              disabled={isLoading || identifier.trim() === ''}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </form>
        
        <div className="mt-auto">
          <div className="text-center text-sm font-medium text-gray-500 pb-4">
            Remember your password?{' '}
            <Link href="/login" className="text-indigo-600 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
      </div>
    </AuthLayout>
  );
}
