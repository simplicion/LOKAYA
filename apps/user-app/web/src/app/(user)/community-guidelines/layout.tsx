import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines & Content Standards',
  description: 'Our community principles and rules regarding user-generated posts, reels, comments, and merchant listings on Lokaya.',
  alternates: {
    canonical: 'https://lokaya.shop/community-guidelines',
  },
  openGraph: {
    title: 'Community Guidelines | Lokaya',
    description: 'Our community principles and rules regarding posts, reels, and merchant listings on Lokaya.',
    url: 'https://lokaya.shop/community-guidelines',
    type: 'website',
  },
};

export default function CommunityGuidelinesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
