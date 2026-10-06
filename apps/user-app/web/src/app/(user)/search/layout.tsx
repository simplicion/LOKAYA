import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Local Products, Stores & Creators',
  description: 'Search across thousands of neighborhood products, verified merchant stores, and trending creators on Lokaya.',
  alternates: {
    canonical: 'https://lokaya.shop/search',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
