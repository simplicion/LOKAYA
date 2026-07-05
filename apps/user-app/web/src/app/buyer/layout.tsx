import { AuthGuard } from '@/components/AuthGuard';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['BUYER']}>
      <div className="container mx-auto p-4 md:p-6">
        {children}
      </div>
    </AuthGuard>
  );
}
