'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
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
      toast.error('You do not have permission to access this page');
      router.push('/');
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
