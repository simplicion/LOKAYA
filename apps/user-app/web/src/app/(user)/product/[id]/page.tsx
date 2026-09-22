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
  const [resolvedId, setResolvedId] = React.useState<string>((routeParams?.id as string) || '');

  React.useEffect(() => {
    if (params) {
      if (typeof (params as any).then === 'function') {
        (params as Promise<{ id: string }>).then(p => {
          if (p?.id) setResolvedId(p.id);
        });
      } else if ((params as { id: string })?.id) {
        setResolvedId((params as { id: string }).id);
      }
    } else if (routeParams?.id) {
      setResolvedId(routeParams.id as string);
    }
  }, [params, routeParams?.id]);

  return <ProductViewClient productId={resolvedId || (routeParams?.id as string) || ''} />;
}
