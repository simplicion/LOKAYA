import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell on Lokaya | Grow Your Local Merchant Business',
  description: 'Reach thousands of neighborhood customers, list your catalog with zero tech friction, and unlock instant delivery on Lokaya.',
  alternates: {
    canonical: 'https://lokaya.shop/business',
  },
  openGraph: {
    title: 'Sell on Lokaya | Grow Your Local Merchant Business',
    description: 'Reach thousands of neighborhood customers, list your catalog with zero tech friction, and unlock instant delivery on Lokaya.',
    url: 'https://lokaya.shop/business',
    type: 'website',
  },
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
