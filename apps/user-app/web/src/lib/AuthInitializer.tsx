'use client';

import { useEffect } from 'react';
import { useCheckAuthQuery } from './api';
import { useDispatch } from 'react-redux';
import { setCredentials, logout } from './features/authSlice';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading } = useCheckAuthQuery();
  const dispatch = useDispatch();

  useEffect(() => {
    if (data?.user) {
      dispatch(setCredentials({ user: data.user }));
    } else if (error) {
      dispatch(logout());
    }
  }, [data, error, dispatch]);

  // We render children regardless. If certain pages need strict protection,
  // they can check the `user` state from Redux.
  return <>{children}</>;
}
