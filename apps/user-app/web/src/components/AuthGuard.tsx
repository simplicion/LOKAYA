'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useCheckAuthQuery } from '@/lib/api';
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

  const allowedRolesKey = useMemo(() => allowedRoles?.slice().sort().join(',') || '', [allowedRoles]);

  useEffect(() => {
    // Wait until auth verification completes before making any redirect decision
    if (isAuthLoading) return;

    if (!user) {
      toast.error('Please login to access this page');
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      toast.error('You do not have permission to access this page');
      router.replace('/');
      return;
    }
  }, [user, isAuthLoading, allowedRolesKey, router, pathname, allowedRoles]);

  if (isAuthLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
