'use client';

import React from 'react';
import { AdaptiveSkeleton } from '@/components/ui/AdaptiveSkeleton';

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-white max-w-lg mx-auto">
      <AdaptiveSkeleton variant="product-detail" />
    </div>
  );
}
