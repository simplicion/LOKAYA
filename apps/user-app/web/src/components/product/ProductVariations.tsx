'use client';

import { ProductVariation } from '@/lib/mock/products';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProductVariationsProps {
  variations?: ProductVariation[];
}

export function ProductVariations({ variations }: ProductVariationsProps) {
  // Store selections: variationName -> selectedValue
  const [selections, setSelections] = useState<Record<string, string>>({});

  if (!variations || variations.length === 0) return null;

  return (
    <div className="px-4 py-4 space-y-6">
      {variations.map((v) => {
        const selectedValue = selections[v.name];
        
        return (
          <div key={v.name} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900">
                {v.name}: <span className="font-normal text-gray-600 ml-1">
                  {v.options.find(o => o.value === selectedValue)?.label || 'Select'}
                </span>
              </h4>
              {v.name.toLowerCase() === 'size' && (
                <button className="text-xs font-semibold text-[#FF6B00] flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon></svg>
                  Size Guide
                </button>
              )}
            </div>

            {v.type === 'color' ? (
              <div className="flex flex-wrap gap-3">
                {v.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelections(s => ({ ...s, [v.name]: opt.value }))}
                    className={cn(
                      "relative w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      selectedValue === opt.value ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-gray-200"
                    )}
                  >
                    <span 
                      className="w-8 h-8 rounded-full border border-black/10" 
                      style={{ backgroundColor: opt.meta || '#ccc' }} 
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {v.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelections(s => ({ ...s, [v.name]: opt.value }))}
                    className={cn(
                      "min-w-[48px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors border",
                      selectedValue === opt.value 
                        ? "border-[#FF6B00] text-[#FF6B00] bg-[#FF6B00]/5" 
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
