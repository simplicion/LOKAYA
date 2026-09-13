'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, store } from '@/lib/store';
import { setCredentials } from '@/lib/features/authSlice';
import { toast } from 'sonner';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Please login to access this page');
      router.push('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Try to self-heal stale roles by forcing a refresh check
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1';
      fetch(`${apiUrl}/identity/me`, {
        method: 'GET',
        credentials: 'include'
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          store.dispatch(setCredentials({ user: data.user }));
          if (allowedRoles.includes(data.user.role)) {
            setIsAuthorized(true);
            return; // Success, role is now valid
          }
        }
        toast.error('You do not have permission to access this page');
        router.push('/');
      })
      .catch(() => {
        toast.error('You do not have permission to access this page');
        router.push('/');
      });
      return;
    }

    setIsAuthorized(true);
  }, [user, allowedRoles, router]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
