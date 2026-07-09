import EditProductClient from './EditProductClient';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  return <EditProductClient params={resolvedParams} />;
}
