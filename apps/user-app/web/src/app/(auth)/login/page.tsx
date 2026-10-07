'use client';

import { useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useOneEightyAuth } from '@/lib/useOneEightyAuth';
import { Loader2 } from 'lucide-react';

function DirectLoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSelector((state: any) => state.auth.user);
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectUrl = (rawRedirect.startsWith('/') && !rawRedirect.startsWith('/login')) ? rawRedirect : '/';
  const { openAuth } = useOneEightyAuth();
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (user) {
      router.replace(redirectUrl);
      return;
    }

    if (!triggeredRef.current) {
      triggeredRef.current = true;
      openAuth({
        redirectOnSuccess: redirectUrl,
        onCancel: () => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
          } else {
            router.replace('/');
          }
        },
      });
    }
  }, [user, redirectUrl, router, openAuth]);

  return (
    <div className="min-h-screen bg-slate-950/90 flex flex-col items-center justify-center text-white gap-3 select-none">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
        Opening 180 Identity...
      </span>
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
      <DirectLoginRedirect />
    </Suspense>
  );
}
