'use client';

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

  return <>{children}</>;
}
