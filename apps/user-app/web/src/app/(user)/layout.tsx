import { MobileBottomNav } from '@/components/MobileBottomNav';
import { MobileTopNav } from '@/components/MobileTopNav';
import { FloatingCartBar } from '@/components/cart/FloatingCartBar';
import { OnboardingGuard } from '@/components/ui/OnboardingGuard';
import { NavigationErrorBoundary } from '@/components/ui/NavigationErrorBoundary';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
