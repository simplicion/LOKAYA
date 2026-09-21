'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { toast } from 'sonner';

export const hapticFeedback = {
  light: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch {}
    }
  },
  medium: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch {}
    }
  },
  heavy: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch {}
    }
  },
  success: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.notification({ type: NotificationType.Success });
      } catch {}
    }
  },
  error: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.notification({ type: NotificationType.Error });
      } catch {}
    }
  },
  selection: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.selectionChanged();
      } catch {}
    }
  }
};

export function useCapacitorNative() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const [isNative, setIsNative] = useState(false);

  // Initialize Native Shell
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nativeActive = Capacitor.isNativePlatform();
    setIsNative(nativeActive);

    if (nativeActive) {
      // 1. Hide Splash Screen after hydration
      SplashScreen.hide().catch(() => {});

      // 2. Configure Status Bar
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#059669' }).catch(() => {});

      // 3. Hardware Back Button Listener (Android)
      let lastBackPress = 0;
      const backListener = CapApp.addListener('backButton', ({ canGoBack }) => {
        // Root navigation paths
        const rootPaths = ['/home', '/explore', '/cart', '/profile', '/delivery', '/orders'];
        const isRoot = rootPaths.includes(pathname || '/');

        if (!isRoot && canGoBack) {
          router.back();
        } else {
          const now = Date.now();
          if (now - lastBackPress < 2000) {
            CapApp.exitApp();
          } else {
            lastBackPress = now;
            toast('Press back again to exit LOKAYA', { duration: 1800 });
          }
        }
      });

      // 4. App URL Open Deep Linking
      const urlListener = CapApp.addListener('appUrlOpen', (event) => {
        try {
          const url = new URL(event.url);
          const pathWithQuery = url.pathname + url.search + url.hash;
          if (pathWithQuery) {
            router.push(pathWithQuery);
          }
        } catch {
          // Fallback if custom scheme (e.g. lokaya://orders/123)
          const slug = event.url.replace(/^lokaya:\/\//i, '/');
          if (slug) {
            router.push(slug);
          }
        }
      });

      return () => {
        backListener.then(l => l.remove()).catch(() => {});
        urlListener.then(l => l.remove()).catch(() => {});
      };
    }
  }, [pathname, router]);

  // Network Connectivity Observer
  useEffect(() => {
    let networkListener: any = null;

    Network.getStatus().then((status) => {
      setIsOnline(status.connected);
    }).catch(() => {});

    networkListener = Network.addListener('networkStatusChange', (status) => {
      setIsOnline(status.connected);
      if (!status.connected) {
        toast.error('No internet connection. Operating in offline mode.', {
          id: 'offline-toast',
          duration: Infinity
        });
      } else {
        toast.dismiss('offline-toast');
        toast.success('Back online!', { duration: 2500 });
      }
    });

    return () => {
      if (networkListener) {
        networkListener.then((l: any) => l.remove()).catch(() => {});
      }
    };
  }, []);

  return {
    isNative,
    isOnline,
    haptics: hapticFeedback
  };
}
