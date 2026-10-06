'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useOneEightyExchangeMutation } from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { toast } from 'sonner';
import { triggerOneEightyLogin } from '@/lib/180-sdk';
import { ArrowLeft, Loader2, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

function LoginContent() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const user = useSelector((state: any) => state.auth.user);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectUrl = (rawRedirect.startsWith('/') && !rawRedirect.startsWith('/login')) ? rawRedirect : '/';

  const [oneEightyExchange] = useOneEightyExchangeMutation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) {
      router.replace(redirectUrl);
    }
  }, [user, router, redirectUrl]);

  const handleStart180Auth = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);

    try {
      await triggerOneEightyLogin({
        uxMode: 'bottom_sheet',
        onSuccess: async (data) => {
          try {
            toast.loading('Authenticating sovereign identity...', { id: '180-auth' });
            const result = await oneEightyExchange({
              code: data.code,
              token: data.authToken || data.accessToken,
              userData: data.user,
            }).unwrap();

            dispatch(setCredentials({ user: result.user }));
            toast.success(`Welcome back, ${result.user?.name || 'Friend'}!`, { id: '180-auth' });

            if (result.needsOnboarding || !result.user.locationArea) {
              router.push('/onboarding');
            } else {
              router.push(redirectUrl);
            }
          } catch (exchangeErr: any) {
            console.error('Exchange error:', exchangeErr);
            toast.error(exchangeErr.data?.message || exchangeErr.data?.error || 'Authentication token exchange failed', { id: '180-auth' });
            setIsAuthenticating(false);
          }
        },
        onError: (err) => {
          console.error('180 Auth error:', err);
          toast.error('Authentication was not completed. Please try again.');
          setIsAuthenticating(false);
        },
        onCancel: () => {
          setIsAuthenticating(false);
        },
      });
    } catch (err: any) {
      console.error('Failed to trigger 180 login:', err);
      toast.error(err?.message || 'Unable to open 180 Identity. Please try again in a moment.');
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, oneEightyExchange, dispatch, router, redirectUrl]);

  // Auto-prompt bottom sheet once upon arrival
  useEffect(() => {
    if (!user && !hasAutoOpened) {
      setHasAutoOpened(true);
      const timer = setTimeout(() => {
        handleStart180Auth();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [user, hasAutoOpened, handleStart180Auth]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white px-6 py-8 justify-between">
      {/* Top Bar */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/')}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Logo className="text-2xl" />
          <div className="w-10" />
        </div>

        {/* Hero Card */}
        <div className="text-center mt-8 mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Sovereign Identity
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome to Lokaya
          </h1>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            See It. Know It. Buy It. Instant passwordless sign-in powered by universal 180 Identity.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-10">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center text-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1.5" />
            <span className="text-xs font-semibold text-slate-200">100% Encrypted</span>
            <span className="text-[10px] text-slate-400">Zero Password Hassle</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center text-center">
            <UserCheck className="w-5 h-5 text-indigo-400 mb-1.5" />
            <span className="text-xs font-semibold text-slate-200">Universal Login</span>
            <span className="text-[10px] text-slate-400">Nepal, India & Global</span>
          </div>
        </div>
      </div>

      {/* Action Zone */}
      <div className="w-full max-w-sm mx-auto space-y-4 pb-4">
        <Button
          onClick={handleStart180Auth}
          disabled={isAuthenticating}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-base shadow-xl shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
        >
          {isAuthenticating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Connecting to 180 Identity...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Continue with 180 Identity</span>
            </>
          )}
        </Button>

        <p className="text-center text-[11px] text-slate-500 leading-normal">
          By signing in, you agree to Lokaya's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
