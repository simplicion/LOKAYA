'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ProductViewClient from './ProductViewClient';

export default function ProductDetailPage({ 
  params 
}: { 
  params?: Promise<{ id: string }> | { id: string } 
}) {
  const routeParams = useParams();
  
  // Extract product ID from routeParams first (canonical Next.js router).
  // Fall back to window.location.pathname if routeParams is empty or holding static dummy during hydration.
  const routeId = routeParams?.id as string | undefined;
  const pathId = typeof window !== 'undefined' 
    ? window.location.pathname.split('/product/')[1]?.split('/')[0]?.split('?')[0] 
    : undefined;

  const initialId = (routeId && routeId !== '1') 
    ? routeId 
    : (pathId && pathId !== '1') 
      ? pathId 
      : (routeId || pathId || '');

  const [resolvedId, setResolvedId] = React.useState<string>(initialId);

  React.useEffect(() => {
    const activeRouteId = routeParams?.id as string | undefined;
    const activePathId = typeof window !== 'undefined' 
      ? window.location.pathname.split('/product/')[1]?.split('/')[0]?.split('?')[0] 
      : undefined;

    const bestId = (activeRouteId && activeRouteId !== '1') 
      ? activeRouteId 
      : (activePathId && activePathId !== '1') 
        ? activePathId 
        : (activeRouteId || activePathId || '');

    if (bestId && bestId !== resolvedId) {
      setResolvedId(bestId);
    }
  }, [routeParams?.id, resolvedId]);

  return <ProductViewClient productId={resolvedId || initialId} />;
}
