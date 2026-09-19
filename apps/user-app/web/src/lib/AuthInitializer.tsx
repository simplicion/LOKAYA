'use client';

import { useEffect } from 'react';
import { useCheckAuthQuery, useGetCartQuery } from './api';
import { useDispatch } from 'react-redux';
import { setCredentials, logout } from './features/authSlice';
import { clearCart, setCart } from './features/cartSlice';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { data, error, isError, isLoading } = useCheckAuthQuery();
  const dispatch = useDispatch();

  const isUserLoggedIn = !isLoading && !!data?.user;
  const { data: cartData } = useGetCartQuery(undefined, { skip: !isUserLoggedIn });

  useEffect(() => {
    if (!isLoading) {
      if (data?.user) {
        dispatch(setCredentials({ user: data.user }));
      } else if (isError || error || (data && !data.user)) {
        // Stale session or user deleted from database -> purge local state
        dispatch(logout());
        dispatch(clearCart());
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('persist:root');
          } catch {}
        }
      }
    }
  }, [data, error, isError, isLoading, dispatch]);

  // Synchronize cart with backend database as soon as user is authenticated
  useEffect(() => {
    if (isUserLoggedIn && cartData) {
      if (cartData.items && cartData.items.length > 0) {
        const validItems = cartData.items
          .filter((item: any) => item.product != null && item.product.id && item.product.isActive !== false)
          .map((item: any) => {
            const originalPrice = item.product?.mrp || item.product?.originalPrice || item.variant?.price || item.product?.sellingPrice || 0;
            const sellingPrice = item.variant?.price ?? item.product?.sellingPrice ?? item.priceAt ?? 0;
            return {
              id: item.id,
              productId: item.productId,
              variantId: item.variantId,
              name: item.product?.name || item.productName || 'Product',
              price: sellingPrice,
              originalPrice: originalPrice > sellingPrice ? originalPrice : sellingPrice,
              quantity: item.quantity,
              stockCount: item.product?.stockCount ?? item.variant?.stockCount,
              storeId: item.product?.storeId || item.storeId || '',
              storeName: item.product?.store?.name || 'Partner Store',
              image: item.product?.media?.[0]?.url || item.product?.imageUrl || item.image || '',
              variantName: item.variant?.name,
            };
          });
        dispatch(setCart(validItems));
      } else if (cartData.items && cartData.items.length === 0) {
        // Database cart is empty -> clear any stale cached items in Redux
        dispatch(setCart([]));
      }
    }
  }, [isUserLoggedIn, cartData, dispatch]);

  return <>{children}</>;
}

