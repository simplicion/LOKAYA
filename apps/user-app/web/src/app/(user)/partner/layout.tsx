import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delivery Partner Network | Earn With Lokaya',
  description: 'Join the Lokaya delivery partner fleet. Flexible hours, transparent per-order earnings, and real-time hyperlocal dispatch.',
  alternates: {
    canonical: 'https://lokaya.shop/partner',
  },
  openGraph: {
    title: 'Delivery Partner Network | Earn With Lokaya',
    description: 'Join the Lokaya delivery partner fleet. Flexible hours, transparent per-order earnings, and real-time hyperlocal dispatch.',
    url: 'https://lokaya.shop/partner',
    type: 'website',
  },
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
