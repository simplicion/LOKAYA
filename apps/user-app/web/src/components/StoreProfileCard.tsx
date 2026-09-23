import React from 'react';
import Link from 'next/link';
import { BadgeCheck, Star } from 'lucide-react';
import { Button } from './ui/button';
import { getMediaUrl } from '@/lib/utils';

interface StoreProfileCardProps {
  type?: 'user' | 'store';
  data: any;
}

export function StoreProfileCard({ type, data }: StoreProfileCardProps) {
  if (!data || type === 'user') {
    return null;
  }

  // Store Profile Card
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 hover:border-gray-200 transition">
      {/* Header Name */}
      <h3 className="font-semibold text-gray-900 mb-3 truncate">{data.title || data.name}</h3>
      
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 overflow-hidden border border-orange-100">
          {data.logoUrl ? (
            <img src={getMediaUrl(data.logoUrl)} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-[#FF5A36]">
              {data.name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Info & Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="font-semibold text-gray-900 truncate">{data.name}</span>
            <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
          
          {data.category && (
            <p className="text-xs text-gray-600 truncate mb-1">
              {data.category}
            </p>
          )}

          {(Boolean(data.rating && data.reviewsCount && data.reviewsCount > 0) || Boolean(data.closingTime)) && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {Boolean(data.rating && data.reviewsCount && data.reviewsCount > 0) && (
                <>
                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="font-semibold">{data.rating}</span>
                  </div>
                  <span>({data.reviewsCount} {data.reviewsCount === 1 ? 'review' : 'reviews'})</span>
                </>
              )}
              {data.closingTime && <span>{data.reviewsCount && data.reviewsCount > 0 ? '• ' : ''}Open until {data.closingTime}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Link href={`/store/${data.id}`}>
          <Button className="w-full bg-[#FF5A36] text-white hover:bg-[#E04B28] rounded-xl font-semibold text-xs h-9">
            Visit Store
          </Button>
        </Link>
      </div>
    </div>
  );
}
