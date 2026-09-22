import { MobileBottomNav } from '@/components/MobileBottomNav';
import { MobileTopNav } from '@/components/MobileTopNav';
import { FloatingCartBar } from '@/components/cart/FloatingCartBar';
import { OnboardingGuard } from '@/components/ui/OnboardingGuard';
import { NavigationErrorBoundary } from '@/components/ui/NavigationErrorBoundary';
import { AppPrefetchWarmup } from '@/components/AppPrefetchWarmup';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppPrefetchWarmup />
      <MobileTopNav />
      <div className="w-full">
        <NavigationErrorBoundary>
          {children}
        </NavigationErrorBoundary>
      </div>
      <FloatingCartBar />
      <MobileBottomNav />
      <OnboardingGuard />
    </>
  );
}
