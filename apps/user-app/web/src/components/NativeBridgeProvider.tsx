'use client';

import React, { useEffect } from 'react';
import { useCapacitorNative } from '@/lib/native/useCapacitorNative';
import { usePushNotifications } from '@/lib/native/usePushNotifications';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

export function NativeBridgeProvider({ children }: { children: React.ReactNode }) {
  const user = useSelector((state: RootState) => state.auth.user);

  // Initialize native shell, back button, haptics, status bar
  useCapacitorNative();

  // Initialize FCM push token registration and deep link listener
  usePushNotifications({});

  // Auto-reload on chunk load error after fresh deployments
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      const message = (event.message || '').toLowerCase();
      if (
        message.includes('loading chunk') ||
        message.includes('failed to fetch dynamically imported module') ||
        message.includes('unexpected token <')
      ) {
        console.warn('Chunk load error detected after deployment, triggering fresh reload:', event.message);
        const lastReload = sessionStorage.getItem('lokaya_chunk_reload');
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
          sessionStorage.setItem('lokaya_chunk_reload', now.toString());
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    return () => window.removeEventListener('error', handleChunkError);
  }, []);

  return <>{children}</>;
}
