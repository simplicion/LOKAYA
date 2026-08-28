import { notFound } from 'next/navigation';
import { MOCK_PRODUCTS } from '@/lib/mock/products';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductHeader } from '@/components/product/ProductHeader';
import { StoreHeader } from '@/components/product/StoreHeader';
import { TrustBadges } from '@/components/product/TrustBadges';
import { ProductVariations } from '@/components/product/ProductVariations';
import { HighlightsAndSpecs } from '@/components/product/HighlightsAndSpecs';
import { DeliveryAndOffers } from '@/components/product/DeliveryAndOffers';
import { RatingsAndReviews } from '@/components/product/RatingsAndReviews';
import { StickyBottomBar } from '@/components/product/StickyBottomBar';

export function generateStaticParams() {
  return Object.keys(MOCK_PRODUCTS).map((id) => ({
    id: id,
  }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  // Simulate fetching data based on ID
  const product = MOCK_PRODUCTS[resolvedParams.id];

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* 1. Image Gallery */}
      <ProductGallery images={product.images} />

      <div className="flex-1 overflow-y-auto">
        {/* 2. Store Info (Header variation from mockup) */}
        <StoreHeader store={product.store} />

        {/* 3. Title, Price, Discount */}
        <ProductHeader 
          title={product.title}
          subtitle={product.subtitle}
          price={product.price}
          originalPrice={product.originalPrice}
          discountLabel={product.discountLabel}
        />

        {/* 4. Trust Badges */}
        <TrustBadges badges={product.badges} />

        {/* 5. Variations (Color, Size, Options) */}
        <ProductVariations variations={product.variations} />

        {/* 6. Key Highlights, Description, Specifications Box */}
        <HighlightsAndSpecs 
          description={product.description}
          highlights={product.highlights}
          specifications={product.specifications}
        />

        {/* 7. Delivery & Offers */}
        <DeliveryAndOffers 
          delivery={product.delivery}
          offers={product.offers}
        />

        {/* 8. Ratings & Reviews */}
        <RatingsAndReviews rating={product.rating} />
        
        <div className="h-4 bg-gray-50"></div>
        
        {/* 9. About the Store footer summary */}
        <div className="px-4 py-6">
          <h3 className="font-bold text-gray-900 text-[15px] mb-4">About the Store</h3>
          <StoreHeader store={product.store} />
          <div className="mt-3 text-sm text-gray-500">
            {product.store.positivePercentage} Positive Seller Ratings
          </div>
        </div>
      </div>

      {/* 10. Sticky Bottom Bar */}
      <StickyBottomBar 
        price={product.price}
        originalPrice={product.originalPrice}
        discountLabel={product.discountLabel}
        inStock={product.inStock}
      />
    </div>
  );
}
