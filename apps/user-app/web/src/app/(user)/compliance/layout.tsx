import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grievance Redressal & Legal Compliance',
  description: 'Statutory disclosures, Grievance Officer details, merchant KYC verification standards, and consumer protection adherence for Lokaya.',
  alternates: {
    canonical: 'https://lokaya.shop/compliance',
  },
  openGraph: {
    title: 'Grievance Redressal & Legal Compliance | Lokaya',
    description: 'Statutory disclosures and Grievance Officer details for Lokaya Technologies Private Limited.',
    url: 'https://lokaya.shop/compliance',
    type: 'website',
  },
};

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
