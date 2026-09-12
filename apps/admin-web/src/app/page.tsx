'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import AdminDashboard from './admin/page';
import AdminLayout from './admin/layout';
import AdminLogin from './login/page';

export default function RootPage() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || user?.role !== 'SYSTEM_ADMIN') {
    return <AdminLogin />;
  }

  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}
