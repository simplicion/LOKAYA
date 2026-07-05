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
    title: 'LocalPick',
    subtitle: 'Scan. Pick. Go.',
    description: 'Your local stores,\nfaster pickup',
    buttonText: 'Next',
  },
  {
    id: 2,
    image: '/images/onboarding_fastpickup_1783272176388.png',
    title: 'Fast Pickup',
    subtitle: '',
    description: 'Order from nearby stores\nand pick up in minutes.',
    buttonText: 'Next',
  },
  {
    id: 3,
    image: '/images/onboarding_scanandgo_1783272186477.png',
    title: 'Scan & Go',
    subtitle: '',
    description: 'Show your QR at the store,\nwe\'ll handle the rest.',
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
      router.push('/register');
    }
  };

  const currentSlide = slides[activeSlide];

  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-900 pb-8 pt-12 px-6 items-center">
      <div className="flex-1 flex flex-col items-center w-full max-w-sm mx-auto pt-8">
        {/* Title area */}
        <div className="text-center min-h-[120px] mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2 tracking-tight">
            {currentSlide.title}
          </h1>
          {currentSlide.subtitle && (
            <p className="text-sm font-semibold text-indigo-500 mb-3 uppercase tracking-wider">{currentSlide.subtitle}</p>
          )}
          <p className="text-gray-500 text-lg whitespace-pre-line leading-relaxed font-medium">
            {currentSlide.description}
          </p>
        </div>

        {/* Illustration */}
        <div className="relative w-full aspect-square mb-12 flex items-center justify-center">
          <Image
            src={currentSlide.image}
            alt={currentSlide.title}
            fill
            className="object-contain transition-opacity duration-300"
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
                  activeSlide === index ? 'w-6 bg-indigo-600' : 'w-2 bg-indigo-200'
                }`}
              />
            ))}
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleNext}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 text-lg font-medium shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all active:scale-[0.98]"
          >
            {currentSlide.buttonText}
          </Button>

          {/* Login Link */}
          <div className="mt-6 text-sm font-medium text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 font-bold hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
