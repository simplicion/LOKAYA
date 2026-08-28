import { MOCK_ORDERS } from '@/lib/mock/checkout';

export function generateStaticParams() {
  return MOCK_ORDERS.map((order) => ({
    id: order.id,
  }));
}

export default function OrderDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
