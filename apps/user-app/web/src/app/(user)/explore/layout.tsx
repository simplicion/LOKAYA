import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Trending Products & Local Stores',
  description: 'Discover popular products, local merchant deals, latest discounts, and category collections near you on Lokaya.',
  alternates: {
    canonical: 'https://lokaya.shop/explore',
  },
  openGraph: {
    title: 'Explore Trending Products & Local Stores | Lokaya',
    description: 'Discover popular products, local merchant deals, latest discounts, and category collections near you on Lokaya.',
    url: 'https://lokaya.shop/explore',
    type: 'website',
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
