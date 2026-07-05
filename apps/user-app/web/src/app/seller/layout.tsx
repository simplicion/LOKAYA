import { AuthGuard } from '@/components/AuthGuard';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['SELLER_ADMIN', 'SELLER_STAFF']}>
      <div className="container mx-auto p-4 md:p-6">
        {children}
      </div>
    </AuthGuard>
  );
}
