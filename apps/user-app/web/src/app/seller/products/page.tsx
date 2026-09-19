'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, PlusCircle, MoreVertical, Star, Package } from 'lucide-react';
import Image from 'next/image';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { 
  useGetMyStoreQuery, 
  useGetStoreProductsQuery, 
  useGetStoreCategoriesQuery 
} from '@/lib/api';

export default function MyProductsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Fetch real data
  const { data: storeData } = useGetMyStoreQuery();
  const { data: products = [], isLoading: isLoadingProducts } = useGetStoreProductsQuery(storeData?.id ?? '', {
    skip: !storeData?.id,
  });
  const { data: categories = [], isLoading: isLoadingCategories } = useGetStoreCategoriesQuery(storeData?.id ?? '', {
    skip: !storeData?.id,
  });

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchesSearch = 
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white pb-24">
      {/* Top Header */}
      <SellerHeader 
        title="Products" 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        rightAction={<PlusCircle className="w-6 h-6" onClick={() => router.push('/seller/products/add')} />}
      />

      {/* Category Tags & Filter */}
      <div className="bg-white border-b border-[#E5E2DC] flex items-center justify-between px-4">
        <div className="flex overflow-x-auto no-scrollbar py-3 gap-6 flex-1">
          {/* Always show All tab */}
          <button
            onClick={() => setActiveCategory('all')}
            className={`text-sm font-semibold whitespace-nowrap transition-colors px-5 py-1.5 rounded-full ${
              activeCategory === 'all' 
                ? 'bg-brand-navy text-white' 
                : 'text-[#6B6B6B] bg-transparent'
            }`}
          >
            All
          </button>
          
          {categories.map((category: any) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`text-sm font-semibold whitespace-nowrap transition-colors px-5 py-1.5 rounded-full ${
                activeCategory === category.id 
                  ? 'bg-brand-navy text-white' 
                  : 'text-[#6B6B6B] bg-transparent'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <button className="p-2 ml-2 bg-[#F9F9F9] rounded-full text-[#171717] hover:bg-gray-200 transition-colors shrink-0">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Product List */}
      <div className="flex-1 bg-white">
        {isLoadingProducts ? (
          <div className="flex items-center justify-center h-48">
             <div className="w-8 h-8 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {filteredProducts.map((product: any, idx: number) => {
              const primaryMedia = product.media?.find((m: any) => m.isPrimary) || product.media?.[0];
              const imageUrl = primaryMedia?.url || product.imageUrl || '';
              const stock = product.stockCount ?? 0;
              
              return (
                <div 
                  key={product.id} 
                  className={`p-4 flex gap-4 ${idx !== filteredProducts.length - 1 ? 'border-b border-[#F2EFE9]' : ''}`}
                  onClick={() => router.push(`/seller/products/${product.id}`)}
                >
                  {/* Image */}
                  <div className="w-24 h-24 bg-[#F2EFE9] rounded-2xl overflow-hidden relative shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                      <Image 
                        src={imageUrl} 
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-gray-400 stroke-[1.5]" />
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-[#171717] text-[15px] leading-tight pr-2 line-clamp-2">
                          {product.name}
                        </h3>
                        <button className="shrink-0 p-1 -mr-1 -mt-1 text-[#6B6B6B] active:bg-gray-100 rounded-full" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-[#6B6B6B] mt-1 uppercase tracking-wider font-medium">SKU: {product.sku || 'N/A'}</p>
                    </div>
                    
                    <div className="font-bold text-[#171717] text-lg mt-1">
                      ₹{product.sellingPrice || 0}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-4 text-xs font-medium">
                        <span className="text-[#6B6B6B]">Stock: {stock}</span>
                        {product.avgRating && product.avgRating > 0 ? (
                          <div className="flex items-center gap-1 text-[#6B6B6B]">
                            <Star className="w-3.5 h-3.5 stroke-[2.5] fill-amber-400 text-amber-400" />
                            <span>{Number(product.avgRating).toFixed(1)}</span>
                          </div>
                        ) : null}
                      </div>
                      <span className={`text-xs font-bold ${
                        product.isActive 
                          ? stock > 10 ? 'text-green-500' : 'text-orange-500' 
                          : 'text-gray-400'
                      }`}>
                        {!product.isActive ? 'Inactive' : stock > 10 ? 'Active' : stock > 0 ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900">No products found</h3>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your category or search filters, or add a new product.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
