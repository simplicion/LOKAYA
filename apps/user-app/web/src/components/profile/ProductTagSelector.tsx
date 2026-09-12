'use client';

import React, { useState } from 'react';
import { Search, ChevronLeft, Check, Plus, AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { useGetStoreProductsQuery } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/utils';

export function ProductTagSelector({ 
  storeId, 
  onClose, 
  onDone,
  initialSelected = []
}: { 
  storeId?: string; 
  onClose: () => void;
  onDone: (selectedProductIds: string[]) => void;
  initialSelected?: string[];
}) {
  const router = useRouter();
  const { 
    data: products, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useGetStoreProductsQuery(storeId || '', { skip: !storeId });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);

  const filteredProducts = (products || []).filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProduct = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <button onClick={onClose} className="p-1 -ml-1 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-[#171717]" />
        </button>
        <h1 className="font-bold text-[#171717] text-lg">Tag Products</h1>
        <button 
          onClick={() => onDone(selectedIds)}
          className="text-blue-600 hover:text-blue-700 font-bold text-sm px-2 py-1 rounded-md transition-colors"
        >
          Done
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-500">Your Products</h2>
          <button 
            onClick={() => router.push('/seller/products/add')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New
          </button>
        </div>

        {!storeId ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-6">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-[#FF5A36] flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">No Store Connected</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-[240px]">
              Set up your seller profile or store to add and tag products in your posts.
            </p>
            <button
              onClick={() => router.push('/seller/onboarding')}
              className="px-4 py-2 bg-[#FF5A36] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#e04825] transition-colors"
            >
              Set Up Store
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-[#FF5A36] rounded-full animate-spin mb-3" />
            <span className="text-xs text-gray-400 font-medium">Loading your products...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-6">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Unable to load products</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-[260px]">
              {(error as any)?.data?.error || (error as any)?.data?.message || 'Something went wrong while fetching your products. Please try again.'}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#171717] text-white text-xs font-bold rounded-xl hover:bg-black transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">
              {searchQuery ? 'No matching products' : 'No products found'}
            </h3>
            <p className="text-xs text-gray-500 mb-4 max-w-[240px]">
              {searchQuery 
                ? `No products found matching "${searchQuery}". Try a different search term.` 
                : "You haven't added any products to your store yet."}
            </p>
            {!searchQuery && (
              <button 
                onClick={() => router.push('/seller/products/add')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF5A36] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#e04825] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Your First Product
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product: any) => {
              const isSelected = selectedIds.includes(product.id);
              const productImage = product.imageUrl || product.media?.[0]?.url || product.images?.[0] || '';
              const displayPrice = product.sellingPrice ?? product.price ?? 0;
              return (
                <div 
                  key={product.id} 
                  onClick={() => toggleProduct(product.id)}
                  className={`flex items-center gap-3.5 cursor-pointer p-2.5 rounded-2xl border transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center">
                    {productImage ? (
                      <img 
                        src={getMediaUrl(productImage)} 
                        alt={product.name || 'Product'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to a styled placeholder
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-gray-400 font-semibold">No Image</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#171717] text-sm leading-tight mb-1 truncate">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">₹{displayPrice}</span>
                      {product.mrp && product.mrp > displayPrice && (
                        <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
                      )}
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedIds.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-white shadow-lg">
          <button 
            onClick={() => onDone(selectedIds)}
            className="w-full py-3.5 bg-[#171717] hover:bg-black text-white rounded-xl font-bold text-[15px] shadow-sm transition-colors active:scale-[0.99]"
          >
            Done ({selectedIds.length} selected)
          </button>
        </div>
      )}
    </div>
  );
}
