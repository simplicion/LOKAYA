'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useGetMyStoreQuery, useCheckAuthQuery } from '@/lib/api';
import { Loader2 } from 'lucide-react';

import { RegularProfile } from '@/components/profile/RegularProfile';
import { SellerProfile } from '@/components/profile/SellerProfile';

export default function ProfilePage() {
  const router = useRouter();
  const { data: authData, isLoading: isAuthLoading } = useCheckAuthQuery();
  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const user = reduxUser || authData?.user;
  const { data: myStore, isLoading: isStoreLoading } = useGetMyStoreQuery(undefined, { skip: !user });

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login?redirect=/profile');
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || !user) {
    return (
      <div className="flex h-[70vh] items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" />
      </div>
    );
  }

  if (isStoreLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" />
      </div>
    );
  }

  if (myStore) {
    return <SellerProfile myStore={myStore} user={user} />;
  }

  return <RegularProfile />;
}
