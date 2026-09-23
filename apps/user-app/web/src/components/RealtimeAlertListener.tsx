'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useGetMyStoreQuery } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { triggerNotificationAlert } from '@/lib/native/deviceAlert';
import { toast } from 'sonner';

export function RealtimeAlertListener() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: myStore } = useGetMyStoreQuery(undefined, { skip: !user });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'https://api.lokaya.shop';
    let socket: Socket | null = null;

    try {
      socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000
      });

      socket.on('connect', () => {
        console.log('[Socket-Client] Connected to Lokaya real-time alert gateway');

        // 1. Join personal user room (for customer order status updates)
        if (user.id) {
          socket?.emit('join_user', user.id);
        }

        // 2. Join store room (for sellers to get instant new order alerts)
        if (myStore?.id) {
          socket?.emit('join_store', myStore.id);
        }

        // 3. Join rider room (for delivery partners)
        if (user.id) {
          socket?.emit('join_rider', user.id);
        }
      });

      // ==========================================
      // SELLER: Incoming New Order Alert
      // ==========================================
      socket.on('new_order', (data: { orderId: string; totalAmount: number; itemsCount: number; storeId?: string }) => {
        console.log('[Socket-Client] Real-time new order received:', data);
        const shortId = data.orderId ? data.orderId.slice(0, 8).toUpperCase() : '';

        // Vibrate phone + play pleasant chime
        triggerNotificationAlert({
          title: `🔔 New Order Received #${shortId}`,
          body: `Order for ₹${data.totalAmount} (${data.itemsCount} items) has arrived!`,
          type: 'order',
          vibratePattern: [500, 200, 500, 200, 800]
        });

        toast.success(`🎉 New Order #${shortId}!`, {
          description: `₹${data.totalAmount} • ${data.itemsCount} items received. Tap to view.`,
          action: {
            label: 'View Order',
            onClick: () => router.push(`/seller/orders/details?id=${data.orderId}`)
          },
          duration: 10000
        });
      });

      // ==========================================
      // CUSTOMER: Order Placed Confirmation
      // ==========================================
      socket.on('order_placed', (data: { orderId: string; totalAmount: number }) => {
        console.log('[Socket-Client] Real-time order placed:', data);
        const shortId = data.orderId ? data.orderId.slice(0, 8).toUpperCase() : '';

        triggerNotificationAlert({
          title: '🛍️ Order Placed Successfully!',
          body: `Your order #${shortId} has been sent to the store.`,
          type: 'status',
          vibratePattern: [200, 100, 300]
        });

        toast.success('Order Placed! 🛍️', {
          description: `Order #${shortId} is being prepared by the store.`,
          action: {
            label: 'Track',
            onClick: () => router.push(`/orders/${data.orderId}/track`)
          },
          duration: 6000
        });
      });

      // ==========================================
      // CUSTOMER: Order Status Update (Confirmed, Packed, Shipped, Delivered)
      // ==========================================
      socket.on('order_status_updated', (data: { orderId: string; status?: string; assignmentStatus?: string; deliveryOtp?: string }) => {
        console.log('[Socket-Client] Order status updated:', data);
        const shortId = data.orderId ? data.orderId.slice(0, 8).toUpperCase() : '';
        const status = data.status || data.assignmentStatus || 'UPDATED';

        triggerNotificationAlert({
          title: `Order #${shortId} Update`,
          body: `Status is now ${status}`,
          type: status === 'DELIVERED' ? 'order' : 'status',
          vibratePattern: [300, 100, 300]
        });

        toast.info(`Order #${shortId}: ${status}`, {
          description: data.deliveryOtp ? `Delivery OTP: ${data.deliveryOtp}` : 'Tap to track live progress.',
          action: {
            label: 'Track Order',
            onClick: () => router.push(`/orders/${data.orderId}/track`)
          },
          duration: 7000
        });
      });

      // ==========================================
      // RIDER: New Delivery Task Assigned
      // ==========================================
      socket.on('delivery_assigned', (data: { orderId: string; deliveryFee?: number; distanceKm?: number }) => {
        console.log('[Socket-Client] Delivery assigned to rider:', data);
        const shortId = data.orderId ? data.orderId.slice(0, 8).toUpperCase() : '';

        triggerNotificationAlert({
          title: '🚴 New Delivery Task Assigned!',
          body: `Order #${shortId} is ready for pickup.${data.deliveryFee ? ` Earn: ₹${data.deliveryFee}` : ''}`,
          type: 'dispatch',
          vibratePattern: [400, 150, 400, 150, 600]
        });

        toast.success('🚴 New Delivery Task Assigned!', {
          description: `Order #${shortId}${data.deliveryFee ? ` • ₹${data.deliveryFee}` : ''}. Tap to open route.`,
          action: {
            label: 'Open Task',
            onClick: () => router.push(`/delivery/orders/${data.orderId}`)
          },
          duration: 10000
        });
      });

      socket.on('connect_error', (err) => {
        // Silently tolerate socket reconnection attempts
        console.debug('[Socket-Client] Gateway reconnecting...', err.message);
      });
    } catch (err) {
      console.warn('[Socket-Client] Socket initialization failed:', err);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, myStore?.id, router]);

  return null;
}
