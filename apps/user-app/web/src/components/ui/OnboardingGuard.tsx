'use client';

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';
import { OnboardingBottomSheet } from './OnboardingBottomSheet';

export function OnboardingGuard() {
  const { user } = useSelector((state: any) => state.auth);
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user && !pathname?.includes('/onboarding') && !pathname?.includes('/login') && !pathname?.includes('/register')) {
      const isProfileIncomplete = !user.age || !user.gender || !user.locationArea;
      if (isProfileIncomplete) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  }, [user, pathname]);

  if (!isOpen) return null;

  return (
    <OnboardingBottomSheet 
      isOpen={isOpen} 
      onSuccess={() => setIsOpen(false)} 
    />
  );
}
