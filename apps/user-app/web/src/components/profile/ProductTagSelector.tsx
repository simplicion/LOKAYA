'use client';

import React, { useState } from 'react';
import { Search, ChevronLeft, Check, Plus } from 'lucide-react';
import Image from 'next/image';
import { useGetStoreProductsQuery } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function ProductTagSelector({ 
  storeId, 
  onClose, 
  onDone,
  initialSelected = []
}: { 
  storeId: string; 
  onClose: () => void;
  onDone: (selectedProductIds: string[]) => void;
  initialSelected?: string[];
}) {
  const router = useRouter();
  const { data: products, isLoading } = useGetStoreProductsQuery(storeId, { skip: !storeId });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const toggleProduct = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <button onClick={onClose} className="p-1 -ml-1">
          <ChevronLeft className="w-6 h-6 text-[#171717]" />
        </button>
        <h1 className="font-bold text-[#171717] text-lg">Tag Products</h1>
        <button 
          onClick={() => onDone(selectedIds)}
          className="text-blue-600 font-bold text-sm"
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
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl outline-none text-sm font-medium"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-500">Your Products</h2>
          <button 
            onClick={() => router.push('/seller/products/add')}
            className="text-xs font-bold text-blue-600 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
             <div className="w-6 h-6 border-2 border-gray-300 border-t-[#FF5A36] rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            No products found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              return (
                <div 
                  key={product.id} 
                  onClick={() => toggleProduct(product.id)}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                    <Image 
                      src={product.images[0] || 'https://via.placeholder.com/150'} 
                      alt={product.name} 
                      width={64} 
                      height={64} 
                      className="w-full h-full object-cover" 
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#171717] text-sm leading-tight mb-1">{product.name}</h3>
                    <p className="text-sm font-bold text-gray-700">₹{product.price}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedIds.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-white">
          <button 
            onClick={() => onDone(selectedIds)}
            className="w-full py-4 bg-[#171717] text-white rounded-xl font-bold text-[15px]"
          >
            Done ({selectedIds.length} selected)
          </button>
        </div>
      )}
    </div>
  );
}
