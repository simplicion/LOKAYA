import ProductViewClient from './ProductViewClient';

export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string } 
}) {
  const resolvedParams = await params;
  return <ProductViewClient productId={resolvedParams.id} />;
}
