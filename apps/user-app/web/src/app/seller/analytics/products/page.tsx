'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, Package } from 'lucide-react';
import Image from 'next/image';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { DateRangeModal } from '@/components/seller/DateRangeModal';
import { useGetAnalyticsProductsQuery } from '@/lib/api';

export default function ProductAnalyticsPage() {
  const router = useRouter();
  const [activeDateFilter, setActiveDateFilter] = useState('This Month');
  const [isDateSelectorOpen, setIsDateSelectorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Products');

  const { data: analyticsData } = useGetAnalyticsProductsQuery(activeDateFilter);

  const topProducts = analyticsData?.topProducts || [];
  const categorySales = analyticsData?.categorySales || [];

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-20">
      <SellerHeader 
        title="Product Analytics"
        showBack={true}
        onBack={() => router.back()}
        hideSearchIcon={true}
        rightAction={
          <button 
            onClick={() => setIsDateSelectorOpen(true)}
            className="flex items-center gap-1.5 bg-[#F9F9F9] pl-3 pr-2 py-1 rounded-full border border-[#E5E2DC]"
          >
            <span className="text-xs font-semibold text-[#171717]">{activeDateFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </button>
        }
      />

      <DateRangeModal
        isOpen={isDateSelectorOpen}
        onClose={() => setIsDateSelectorOpen(false)}
        selectedRange={activeDateFilter}
        onSelectRange={(range) => {
          setActiveDateFilter(range);
          setIsDateSelectorOpen(false);
        }}
      />

      <div className="bg-[#FFFFFF] px-4 pt-2 pb-0 sticky top-[68px] z-10">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#E5E2DC]">
          <button 
            onClick={() => setActiveTab('Products')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'Products' ? 'text-[#FF5A36]' : 'text-[#6B6B6B]'
            }`}
          >
            Products
            {activeTab === 'Products' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5A36] rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('Categories')}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === 'Categories' ? 'text-[#FF5A36]' : 'text-[#6B6B6B]'
            }`}
          >
            Categories
            {activeTab === 'Categories' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5A36] rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'Products' ? (
          <div className="bg-[#FFFFFF] rounded-[1.25rem] border border-[#E5E2DC] overflow-hidden">
            <div className="p-4 border-b border-[#E5E2DC]">
              <h2 className="text-lg font-bold text-[#171717]">Top Selling Products</h2>
            </div>
            {topProducts.map((product, index) => (
              <div 
                key={product.id}
                className={`p-4 flex items-center gap-4 hover:bg-[#F9F9F9] transition-colors ${
                  index !== topProducts.length - 1 ? 'border-b border-[#E5E2DC]' : ''
                }`}
              >
                <div className="relative w-12 h-12 rounded-xl bg-[#F9F9F9] overflow-hidden flex-shrink-0 border border-[#E5E2DC]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#171717] text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{product.orders} Orders</p>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-[#171717]">₹{product.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
            
            <div className="p-4 border-t border-[#E5E2DC]">
              <button 
                onClick={() => router.push('/seller/products')}
                className="w-full py-3 rounded-xl border border-[#FF5A36]/30 text-[#FF5A36] font-semibold text-sm hover:bg-[#FFEBEE] transition-colors"
              >
                View All Products
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#FFFFFF] rounded-[1.25rem] border border-[#E5E2DC] overflow-hidden">
            <div className="p-4 border-b border-[#E5E2DC]">
              <h2 className="text-lg font-bold text-[#171717]">Category Sales</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-[#6B6B6B] mb-3 px-2">
                <div className="col-span-6">Category</div>
                <div className="col-span-3 text-right">Sales</div>
                <div className="col-span-3 text-right">Orders</div>
              </div>
              
              <div className="space-y-1">
                {categorySales.map((category) => (
                  <div key={category.id} className="grid grid-cols-12 gap-2 py-3 px-2 items-center hover:bg-[#F9F9F9] rounded-xl transition-colors">
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F9F9F9] flex items-center justify-center border border-[#E5E2DC] text-[#FF5A36]">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-[#171717] text-sm truncate">{category.name}</span>
                    </div>
                    <div className="col-span-3 text-right font-bold text-[#171717] text-sm">
                      ₹{category.sales.toLocaleString()}
                    </div>
                    <div className="col-span-3 text-right font-semibold text-[#6B6B6B] text-sm">
                      {category.orders}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
