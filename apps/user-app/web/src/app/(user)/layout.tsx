import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['USER']}>
      <Navbar />
      <div className="w-full pb-24 md:pb-0">
        {children}
      </div>
      <MobileBottomNav />
    </AuthGuard>
  );
}
