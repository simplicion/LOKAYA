import { AuthGuard } from '@/components/AuthGuard';
import { StorePartnerBottomNav } from '@/components/StorePartnerBottomNav';

export default function StorePartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['STORE_PARTNER']}>
      <div className="w-full pb-24 md:pb-0">
        {children}
      </div>
      <StorePartnerBottomNav />
    </AuthGuard>
  );
}
