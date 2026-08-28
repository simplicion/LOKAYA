import { ProductHighlight, ProductSpecification } from '@/lib/mock/products';
import { Grid, Wind, Shirt, Smile, ChevronDown } from 'lucide-react';

interface HighlightsAndSpecsProps {
  description: string;
  highlights?: ProductHighlight[];
  specifications?: ProductSpecification[];
}

export function HighlightsAndSpecs({ description, highlights, specifications }: HighlightsAndSpecsProps) {
  const getIcon = (name: string, className: string) => {
    switch (name) {
      case 'grid': return <Grid className={className} />;
      case 'wind': return <Wind className={className} />;
      case 'shirt': return <Shirt className={className} />;
      case 'smile': return <Smile className={className} />;
      default: return <Grid className={className} />;
    }
  };

  return (
    <div className="px-4 py-4 space-y-6">
      
      {/* Highlights */}
      {highlights && highlights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-[15px]">Key Highlights</h3>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2 p-2">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                  {getIcon(h.icon, "w-5 h-5")}
                </div>
                <span className="text-[10px] text-gray-600 font-medium leading-tight">{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2 pt-2">
        <h3 className="font-bold text-gray-900 text-[15px]">Product Description</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
        <button className="text-sm font-bold text-[#FF6B00] flex items-center gap-1 mt-1">
          Read More <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Generic Specifications */}
      {specifications && specifications.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-gray-900 text-[15px]">Specifications</h3>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            {specifications.map((spec, i) => (
              <div key={i} className={`flex text-sm ${i !== specifications.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="w-1/3 bg-gray-50 py-3 px-4 font-medium text-gray-600 border-r border-gray-100">
                  {spec.key}
                </div>
                <div className="w-2/3 bg-white py-3 px-4 text-gray-900">
                  {spec.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
