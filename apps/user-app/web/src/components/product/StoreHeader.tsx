import { StoreInfo } from '@/lib/mock/products';
import Image from 'next/image';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoreHeaderProps {
  store: StoreInfo;
}

export function StoreHeader({ store }: StoreHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4 px-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200">
          <Image src={store.avatar} alt={store.name} fill className="object-cover" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-gray-900 text-[15px]">{store.name}</h3>
            {store.verified && <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-50" />}
          </div>
          <p className="text-xs text-gray-500">
            {store.handle} • <span className="font-semibold text-gray-700">{store.rating} ⭐️</span> ({store.reviews})
          </p>
        </div>
      </div>
      
      <Button variant="outline" size="sm" className="h-8 rounded-xl border-primary text-primary hover:bg-primary/5 px-4 font-semibold text-xs">
        Follow
      </Button>
    </div>
  );
}
