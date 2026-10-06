import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation and Refund Policy',
  description: 'Official customer cancellation, return, and refund policies for orders placed through merchant stores on Lokaya.',
  alternates: {
    canonical: 'https://lokaya.shop/refund-policy',
  },
  openGraph: {
    title: 'Cancellation and Refund Policy | Lokaya',
    description: 'Official customer cancellation, return, and refund policies for orders placed on Lokaya.',
    url: 'https://lokaya.shop/refund-policy',
    type: 'website',
  },
};

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
