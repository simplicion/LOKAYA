import ProductViewClient from './ProductViewClient';

async function getInitialProduct(productId: string) {
  try {
    const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1';
    const res = await fetch(`${apiUrl}/catalog/products/${productId}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string } 
}) {
  const resolvedParams = await params;
  const initialData = await getInitialProduct(resolvedParams.id);
  return <ProductViewClient productId={resolvedParams.id} initialData={initialData} />;
}
