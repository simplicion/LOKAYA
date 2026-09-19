'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { useResetPasswordMutation } from '@/lib/api';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await resetPassword({ resetToken: token, password }).unwrap();
      toast.success('Password reset successfully! Please log in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.data?.error || 'Failed to reset password');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-white text-zinc-900 px-6 pt-16 pb-8">
      <div className="w-full max-w-sm mx-auto flex flex-col flex-1">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">New Password</h1>
          <p className="text-gray-500 font-medium">Create a new, strong password.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-semibold ml-1">New Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a new password"
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold ml-1">Confirm Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  className="pl-10 pr-10 h-14 rounded-2xl bg-gray-50 border-transparent focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 transition-all font-medium text-base"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 mb-6">
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 text-lg font-medium shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all active:scale-[0.98]" 
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? 'Saving...' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
      );
}
