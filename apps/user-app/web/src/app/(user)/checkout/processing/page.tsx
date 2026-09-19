'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  motion, 
  AnimatePresence, 
  AnimatedSuccessCheck, 
  AnimatedErrorCross, 
  MotionShake, 
  triggerCelebrationConfetti,
  PressableScale
} from '@/components/ui/motion';
import { ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';

export default function ProcessingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');

  useEffect(() => {
    // Simulate payment gateway completion
    const timer = setTimeout(() => {
      setStatus('success');
      triggerCelebrationConfetti();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        router.push('/checkout/success');
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center max-w-md mx-auto relative px-6">
      <div className="w-full flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center space-y-6"
            >
              {/* Radar Pulsing Rings */}
              <div className="relative flex items-center justify-center w-28 h-28">
                <div className="absolute inset-0 rounded-full bg-[#FF5A36]/20 animate-pulse-radar" />
                <div className="absolute inset-2 rounded-full bg-[#FF5A36]/10 animate-ping opacity-75" />
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF5A36] to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25 relative z-10">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Authorizing Payment...
                </h2>
                <p className="text-gray-500 mt-2 font-medium text-sm max-w-[280px]">
                  Connecting to secure bank gateway. Please do not close or refresh this page.
                </p>
              </div>

              {/* Progress Bar Shimmer */}
              <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FF5A36] to-transparent animate-shimmer" />
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="flex flex-col items-center space-y-6"
            >
              <AnimatedSuccessCheck size={80} color="#10B981" />

              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Payment Successful!
                </h2>
                <p className="text-gray-500 mt-2 font-medium text-sm">
                  Your transaction was verified. Generating receipt...
                </p>
              </div>
            </motion.div>
          )}

          {status === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full flex flex-col items-center space-y-6"
            >
              <MotionShake triggerKey={true}>
                <AnimatedErrorCross size={80} />
              </MotionShake>

              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                  Payment Declined
                </h2>
                <p className="text-gray-500 mt-2 font-medium text-sm max-w-[280px]">
                  The bank transaction could not be completed. You haven't been charged.
                </p>
              </div>

              <div className="w-full pt-4 space-y-3">
                <Button
                  onClick={() => router.push('/checkout/payment')}
                  className="w-full h-13 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white font-bold text-base shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Payment</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push('/cart')}
                  className="w-full h-12 rounded-2xl border-gray-200 text-gray-700 font-semibold text-sm"
                >
                  Return to Cart
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
