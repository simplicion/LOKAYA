import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | User Agreement',
  description: 'Terms of Service and legal agreement governing the usage of Lokaya mobile application and web commerce platform.',
  alternates: {
    canonical: 'https://lokaya.shop/terms-and-conditions',
  },
  openGraph: {
    title: 'Terms and Conditions | Lokaya',
    description: 'Terms of Service and legal agreement governing the usage of Lokaya.',
    url: 'https://lokaya.shop/terms-and-conditions',
    type: 'website',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
