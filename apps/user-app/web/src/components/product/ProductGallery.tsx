'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProductGalleryProps {
  images: string[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  
  if (!images || images.length === 0) return null;

  return (
    <div className="w-full">
      {/* Main Image */}
      <div className="relative aspect-[3/4] w-full bg-gray-100 overflow-hidden">
        {/* Top Nav Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start">
          <button 
            onClick={() => router.back()}
            className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
        </div>

        <Image
          src={images[activeIndex]}
          alt={`Product image ${activeIndex + 1}`}
          fill
          className="object-cover"
          priority
        />
        
        {/* Pagination Pill */}
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
          {activeIndex + 1}/{images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
          {images.map((img, index) => {
            // Show first 4, if more than 4, show the last one as a "+X" overlay
            if (index > 4) return null;
            if (index === 4 && images.length > 5) {
              return (
                <div key={index} className="relative w-20 h-24 shrink-0 rounded-xl overflow-hidden cursor-pointer">
                  <Image src={img} alt="More images" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-medium text-lg">
                    +{images.length - 4}
                  </div>
                </div>
              );
            }

            return (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative w-20 h-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                  activeIndex === index ? "border-primary" : "border-transparent"
                )}
              >
                <Image src={img} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
