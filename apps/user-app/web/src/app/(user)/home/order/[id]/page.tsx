import ClientPage from './client-page';

export function generateStaticParams() {
  return [{ id: 'ORD12345' }];
}

export default function Page({ params }: { params: { id: string } }) {
  return <ClientPage params={params} />;
}
