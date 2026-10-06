import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Support & Help Center',
  description: 'Need help with your orders, refunds, store management, or delivery? Reach the Lokaya customer care and support team.',
  alternates: {
    canonical: 'https://lokaya.shop/support',
  },
  openGraph: {
    title: 'Customer Support & Help Center | Lokaya',
    description: 'Need help with your orders, refunds, store management, or delivery? Reach the Lokaya customer care team.',
    url: 'https://lokaya.shop/support',
    type: 'website',
  },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
