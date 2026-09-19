import { AuthGuard } from '@/components/AuthGuard';

const ALLOWED_ROLES = ['USER', 'STORE_PARTNER', 'SYSTEM_ADMIN'];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={ALLOWED_ROLES}>{children}</AuthGuard>;
}
