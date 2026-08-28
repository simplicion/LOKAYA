import { AuthGuard } from '@/components/AuthGuard';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={['USER', 'STORE_PARTNER']}>{children}</AuthGuard>;
}
