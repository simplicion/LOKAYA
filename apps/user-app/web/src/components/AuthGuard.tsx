'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useCheckAuthQuery } from '@/lib/api';
import { useOneEightyAuth } from '@/lib/useOneEightyAuth';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { data: authData, isLoading: isAuthLoading } = useCheckAuthQuery();
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const user = reduxUser || authData?.user;
  const router = useRouter();
  const pathname = usePathname();
  const { openAuth } = useOneEightyAuth();
  const authTriggeredRef = useRef(false);

  const allowedRolesKey = useMemo(() => allowedRoles?.slice().sort().join(',') || '', [allowedRoles]);

  useEffect(() => {
    // Wait until auth verification completes before making any redirect decision
    if (isAuthLoading) return;

    if (!user) {
      if (!authTriggeredRef.current) {
        authTriggeredRef.current = true;
        openAuth({
          redirectOnSuccess: pathname,
          onCancel: () => {
            router.replace('/');
          }
        });
      }
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      toast.error('You do not have permission to access this page');
      router.replace('/');
      return;
    }
  }, [user, isAuthLoading, allowedRolesKey, router, pathname, allowedRoles, openAuth]);

  if (isAuthLoading || !user) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center bg-[#FAF9F6] gap-3">
        <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Connecting Sovereign Identity...
        </span>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
