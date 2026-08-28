import { ChevronRight } from 'lucide-react';
import { Product } from '@/lib/mock/products';

interface DeliveryAndOffersProps {
  delivery?: Product['delivery'];
  offers?: Product['offers'];
}

export function DeliveryAndOffers({ delivery, offers }: DeliveryAndOffersProps) {
  if (!delivery && !offers) return null;

  return (
    <div className="px-4 py-4 space-y-3">
      {/* Delivery */}
      {delivery && (
        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-700 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Delivery</h4>
              <p className="text-xs text-gray-500 mt-1">
                {delivery.fee === 0 ? 'Free Delivery' : `₹${delivery.fee} • Free above ₹${delivery.freeAbove}`}
              </p>
              <p className="text-xs font-semibold text-[#208b5e] mt-1">
                Get it by {delivery.estimatedDays}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      )}

      {/* Offers */}
      {offers && offers.length > 0 && (
        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-700 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Offers</h4>
              <p className="text-xs text-gray-500 mt-1">
                {offers[0].title}: {offers[0].description}
              </p>
              {offers.length > 1 && (
                <p className="text-xs font-semibold text-[#FF6B00] mt-1">
                  View all offers ({offers.length}) <ChevronRight className="w-3 h-3 inline" />
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      )}
    </div>
  );
}
