import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home Feed & Local Social Shopping',
  description: 'Watch video reels, view trending products from verified neighborhood stores, and shop directly on Lokaya.',
  alternates: {
    canonical: 'https://lokaya.shop/home',
  },
  openGraph: {
    title: 'Home Feed & Local Social Shopping | Lokaya',
    description: 'Watch video reels, view trending products from verified neighborhood stores, and shop directly on Lokaya.',
    url: 'https://lokaya.shop/home',
    type: 'website',
  },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
