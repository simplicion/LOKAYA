'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { toast } from 'sonner';

interface UsePushNotificationsProps {
  token?: string | null;
  apiUrl?: string;
}

export function usePushNotifications({ token, apiUrl }: UsePushNotificationsProps) {
  const router = useRouter();

  const registerDeviceWithBackend = useCallback(
    async (deviceToken: string) => {
      const baseUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'https://api.lokaya.shop/api/v1';
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      try {
        await fetch(`${baseUrl}/notifications/devices`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            token: deviceToken,
            platform: Capacitor.getPlatform().toUpperCase(),
            appVersion: '1.0.0',
          }),
        });
        console.log('[FCM-Client] Device push token synced with LOKAYA backend');
      } catch (err) {
        console.warn('[FCM-Client] Failed to register device token with backend:', err);
      }
    },
    [apiUrl, token]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!Capacitor.isNativePlatform()) return;

    let isSubscribed = true;

    const initPush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('[FCM-Client] Push notifications permission not granted');
          return;
        }

        // Create Android Notification Channels
        if (Capacitor.getPlatform() === 'android') {
          try {
            await PushNotifications.createChannel({
              id: 'lokaya_orders',
              name: 'Orders & Deliveries',
              description: 'Urgent order status updates, OTPs, and rider delivery dispatches',
              importance: 5,
              visibility: 1,
              vibration: true,
              lights: true,
              lightColor: '#FF5722',
            });

            await PushNotifications.createChannel({
              id: 'lokaya_social',
              name: 'Social & Stores',
              description: 'Updates from stores and creators you follow (Stories, Products, Reels)',
              importance: 4,
              visibility: 1,
              vibration: true,
            });

            await PushNotifications.createChannel({
              id: 'lokaya_promotions',
              name: 'Promotions & Deals',
              description: 'Discounts, flash sales, and marketing campaigns',
              importance: 3,
              visibility: 0,
              vibration: false,
            });
            console.log('[FCM-Client] Android Notification Channels configured');
          } catch (channelErr) {
            console.warn('[FCM-Client] Error creating notification channels:', channelErr);
          }
        }

        await PushNotifications.register();

        // 1. Token Registration Listener
        PushNotifications.addListener('registration', (tokenData: Token) => {
          if (isSubscribed) {
            console.log('[FCM-Client] FCM Registration Token received:', tokenData.value);
            registerDeviceWithBackend(tokenData.value);
          }
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.warn('[FCM-Client] Push registration error:', error);
        });

        // 2. Foreground Push Received Listener
        PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotificationSchema) => {
            console.log('[FCM-Client] Push received in foreground:', notification);
            toast(notification.title || 'LOKAYA Update', {
              description: notification.body || '',
              action: notification.data?.deepLink
                ? {
                    label: 'View',
                    onClick: () => router.push(notification.data.deepLink),
                  }
                : undefined,
              duration: 5000,
            });
          }
        );

        // 3. Notification Tap Action / Deep Link Listener
        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action: ActionPerformed) => {
            console.log('[FCM-Client] Push notification tapped:', action);
            const deepLink = action.notification.data?.deepLink;
            if (deepLink && deepLink !== '/') {
              router.push(deepLink);
            }
          }
        );
      } catch (err) {
        console.warn('[FCM-Client] Push notifications initialization error:', err);
      }
    };

    initPush();

    return () => {
      isSubscribed = false;
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners().catch(() => {});
      }
    };
  }, [registerDeviceWithBackend, router]);
}
