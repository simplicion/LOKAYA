import ProductDetailsClient from './ProductDetailsClient';

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  return <ProductDetailsClient params={resolvedParams} />;
}
