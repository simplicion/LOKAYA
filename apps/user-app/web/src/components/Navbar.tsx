'use client';

import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { logout } from '@/lib/features/authSlice';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const pathname = usePathname();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const hiddenPaths = ['/login', '/register', '/forgot-password', '/onboarding', '/allow-location', '/verify-reset-otp', '/reset-password', '/store-partner', '/home', '/profile'];
  if (pathname && hiddenPaths.some(path => pathname.includes(path))) {
    return null;
  }

  return (
    <nav className="block md:hidden border-b bg-white dark:bg-gray-950">
      <div className="flex h-16 items-center px-4 md:px-6 container mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-blue-600">Sna</span>pick
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm font-medium hidden md:inline-block">
                {user.name} ({user.role === 'USER' ? 'User' : 'Store Partner'})
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
