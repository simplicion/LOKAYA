'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useOneEightyExchangeMutation } from '@/lib/api';
import { setCredentials } from '@/lib/features/authSlice';
import { triggerOneEightyLogin } from '@/lib/180-sdk';
import { toast } from 'sonner';

export interface OpenAuthOptions {
  redirectOnSuccess?: string;
  onSuccessCallback?: (user: any) => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
}

export function useOneEightyAuth() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [oneEightyExchange] = useOneEightyExchangeMutation();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const openAuth = useCallback(async (options?: OpenAuthOptions) => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);

    try {
      await triggerOneEightyLogin({
        uxMode: 'bottom_sheet',
        onSuccess: async (data) => {
          try {
            toast.loading('Connecting sovereign identity...', { id: '180-auth' });
            const result = await oneEightyExchange({
              code: data.code,
              token: data.authToken || data.accessToken,
              userData: data.user,
            }).unwrap();

            dispatch(setCredentials({ user: result.user }));
            toast.success(`Welcome back, ${result.user?.name || 'Friend'}!`, { id: '180-auth' });

            if (options?.onSuccessCallback) {
              options.onSuccessCallback(result.user);
            }

            if (result.needsOnboarding || !result.user?.locationArea) {
              router.push('/onboarding');
            } else if (options?.redirectOnSuccess) {
              router.push(options.redirectOnSuccess);
            }
          } catch (exchangeErr: any) {
            console.error('180 Token Exchange error:', exchangeErr);
            const errMsg = exchangeErr?.data?.message || exchangeErr?.data?.error || 'Authentication token exchange failed';
            toast.error(errMsg, { id: '180-auth' });
            if (options?.onError) options.onError(exchangeErr);
          } finally {
            setIsAuthenticating(false);
          }
        },
        onError: (err) => {
          console.error('180 Auth error:', err);
          toast.error(err?.message || 'Authentication was not completed.');
          setIsAuthenticating(false);
          if (options?.onError) options.onError(err);
        },
        onCancel: () => {
          setIsAuthenticating(false);
          if (options?.onCancel) options.onCancel();
        },
      });
    } catch (err: any) {
      console.error('Failed to trigger 180 login:', err);
      toast.error(err?.message || 'Unable to open 180 Identity. Please try again.');
      setIsAuthenticating(false);
      if (options?.onError) options.onError(err);
    }
  }, [isAuthenticating, oneEightyExchange, dispatch, router]);

  return { openAuth, isAuthenticating };
}
