import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Safety',
  description: 'Understand how Lokaya collects, uses, protects, and handles personal data and location privacy in compliance with Indian IT Rules and Google Play policies.',
  alternates: {
    canonical: 'https://lokaya.shop/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy & Data Safety | Lokaya',
    description: 'Understand how Lokaya collects, uses, protects, and handles personal data in compliance with regulatory standards.',
    url: 'https://lokaya.shop/privacy-policy',
    type: 'website',
  },
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
