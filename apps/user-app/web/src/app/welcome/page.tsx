'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const slides = [
  {
    id: 1,
    image: '/images/onboarding_localpick_1783272151833.png',
    title: 'Welcome to Lokaya',
    subtitle: 'See It. Know It. Buy It.',
    description: 'Discover trending creator reels,\nlocal stores & exclusive deals.',
    buttonText: 'Next',
  },
  {
    id: 2,
    image: '/images/onboarding_fastpickup_1783272176388.png',
    title: 'Stores Near You',
    subtitle: 'Local Commerce & Fast Delivery',
    description: 'Explore neighborhood boutiques\nand pick up or get delivered in minutes.',
    buttonText: 'Next',
  },
  {
    id: 3,
    image: '/images/onboarding_scanandgo_1783272186477.png',
    title: 'Seamless Social Checkout',
    subtitle: 'Instant & Secure',
    description: 'Shop directly from authentic creator content\nwith 100% verified stores.',
    buttonText: 'Get Started',
  },
];

export default function Onboarding() {
  const [activeSlide, setActiveSlide] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (activeSlide < slides.length - 1) {
      setActiveSlide(activeSlide + 1);
    } else {
      router.push('/login');
    }
  };

  const currentSlide = slides[activeSlide];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F6] text-[#0F172A] pb-8 pt-10 px-6 items-center">
      <div className="flex-1 flex flex-col items-center w-full max-w-sm mx-auto pt-6">
        {/* Title area */}
        <div className="text-center min-h-[120px] mb-6">
          <h1 className="text-3xl font-extrabold text-[#172554] mb-2 tracking-tight">
            {currentSlide.title}
          </h1>
          {currentSlide.subtitle && (
            <p className="text-xs font-bold text-[#FF6B00] mb-3 uppercase tracking-widest">{currentSlide.subtitle}</p>
          )}
          <p className="text-[#64748B] text-base whitespace-pre-line leading-relaxed font-medium">
            {currentSlide.description}
          </p>
        </div>

        {/* Illustration */}
        <div className="relative w-full aspect-square mb-10 flex items-center justify-center">
          <Image
            src={currentSlide.image}
            alt={currentSlide.title}
            fill
            className="object-contain transition-opacity duration-300 drop-shadow-md"
            priority
          />
        </div>

        <div className="mt-auto w-full flex flex-col items-center">
          {/* Indicators */}
          <div className="flex items-center gap-2 mb-8">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeSlide === index ? 'w-6 bg-[#FF6B00]' : 'w-2 bg-[#E7E5E0]'
                }`}
              />
            ))}
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleNext}
            className="w-full bg-[#FF6B00] hover:bg-[#E55A00] text-white rounded-2xl h-14 text-base font-bold shadow-[0_8px_25px_rgba(255,107,0,0.25)] transition-all active:scale-[0.98]"
          >
            {currentSlide.buttonText}
          </Button>

          {/* Login Link */}
          <div className="mt-6 text-sm font-medium text-[#64748B]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#172554] font-bold hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
