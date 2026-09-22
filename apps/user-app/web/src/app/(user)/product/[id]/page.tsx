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
  const productId = (routeParams?.id as string) || '';

  return <ProductViewClient productId={productId} />;
}
