'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, History, Package, AlertTriangle, TrendingUp, Calendar, Clock, ChevronDown, ChevronUp, RefreshCcw, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

// We share mock data logic just for visual demonstration
const MOCK_PRODUCTS: Record<string, any> = {
  '1': {
    name: 'Fortune Sunlite Oil (1L)',
    sku: 'FORT1001',
    category: 'Grocery',
    mrp: 185,
    price: 165, // Discounted Selling Price
    status: 'Active',
    addedOn: '18 May 2024, 09:15 AM',
    lastUpdated: '12 hours ago',
    inventory: {
      addedThisMonth: 15,
      currentStock: 5,
      sold: 10,
      damaged: 1,
      returned: 2
    },
    variants: [
      { id: 'v1', name: '1L Pouch', price: 165, stock: 5 },
      { id: 'v2', name: '5L Jar', price: 850, stock: 12 },
    ],
    image: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&q=80&w=200&h=200'
  },
  '2': {
    name: 'Aashirvaad Atta (5kg)',
    sku: 'AASH1001',
    category: 'Grocery',
    mrp: 320,
    price: 295,
    status: 'Active',
    addedOn: '20 May 2024, 10:30 AM',
    lastUpdated: '2 days ago',
    inventory: {
      addedThisMonth: 100,
      currentStock: 20,
      sold: 80,
      damaged: 0,
      returned: 5
    },
    variants: [],
    image: 'https://images.unsplash.com/photo-1574316071802-0d684efa7ab5?auto=format&fit=crop&q=80&w=200&h=200'
  }
};

const MOCK_ORDERS = [
  { id: 'ORD-9821', customer: 'Rahul Sharma', date: '21 May 2024, 14:30', qty: 2, cost: 330 },
  { id: 'ORD-9754', customer: 'Priya Desai', date: '20 May 2024, 09:15', qty: 1, cost: 165 },
  { id: 'ORD-9612', customer: 'Amit Patel', date: '19 May 2024, 18:45', qty: 3, cost: 495 },
  { id: 'ORD-9501', customer: 'Neha Singh', date: '18 May 2024, 11:20', qty: 1, cost: 165 },
  { id: 'ORD-9444', customer: 'Vikas Kumar', date: '18 May 2024, 10:05', qty: 3, cost: 495 },
];

export default function ProductDetailsClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [showSoldHistory, setShowSoldHistory] = useState(false);
  
  // Default to product 1 if not found in mock map
  const product = MOCK_PRODUCTS[params.id] || MOCK_PRODUCTS['1'];
  const [status, setStatus] = useState(product.status);
  
  const discountPercent = product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            SKU Details
          </h1>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1.5 h-9 rounded-full border-gray-200 shadow-sm"
          onClick={() => router.push(`/store-partner/products/${params.id}/edit`)}
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span className="text-sm">Edit</span>
        </Button>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Product Identity Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-start">
          <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden relative shrink-0">
            <Image 
              src={product.image} 
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 pt-1">
            <h2 className="font-bold text-gray-900 leading-tight mb-1 text-lg">
              {product.name}
            </h2>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-500">SKU: {product.sku}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-500">{product.category}</span>
            </div>
            
            {/* Status Toggle */}
            <div className="flex items-center gap-2">
              <select 
                className={`text-xs font-bold px-2 py-1.5 rounded-lg uppercase tracking-wider outline-none border-none cursor-pointer ${
                  status === 'Active' ? 'bg-green-100 text-green-700' :
                  status === 'Inactive' ? 'bg-gray-100 text-gray-600' :
                  'bg-orange-100 text-orange-700'
                }`}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Pricing Info */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
             <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Pricing</span>
             <div className="flex items-center gap-2">
               <span className="font-black text-gray-900 text-2xl">₹{product.price}</span>
               {discountPercent > 0 && (
                 <>
                   <span className="text-sm text-gray-400 line-through">₹{product.mrp}</span>
                   <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                     {discountPercent}% OFF
                   </span>
                 </>
               )}
             </div>
          </div>
          <Tag className="w-8 h-8 text-gray-200" />
        </div>

        {/* Timestamps */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 divide-x divide-gray-100">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Added On</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{product.addedOn}</p>
          </div>
          <div className="flex-1 pl-4">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Last Updated</span>
            </div>
            <p className="text-sm font-medium text-gray-900">{product.lastUpdated}</p>
          </div>
        </div>

        {/* Product Variants (If any) */}
        {product.variants && product.variants.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Variants</h3>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {product.variants.length} options
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {product.variants.map((variant: any) => (
                <div key={variant.id} className="p-4 flex items-center justify-between">
                  <span className="font-semibold text-gray-900 text-sm">{variant.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-900">₹{variant.price}</span>
                    <span className="text-xs text-gray-500 font-medium w-16 text-right">
                      Stock: {variant.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Inventory Analytics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Inventory & Analytics
            </h3>
          </div>
          
          <div className="grid grid-cols-2 p-4 gap-4 bg-gray-50/50">
            {/* Added this month */}
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Added this Mth</span>
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-blue-600" />
                </div>
              </div>
              <span className="text-2xl font-black text-gray-900">{product.inventory.addedThisMonth}</span>
            </div>

            {/* Current Stock */}
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Current Stock</span>
                <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                  <Package className="w-3 h-3 text-green-600" />
                </div>
              </div>
              <span className="text-2xl font-black text-green-600">{product.inventory.currentStock}</span>
            </div>

            {/* Sold */}
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Total Sold</span>
                <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center">
                  <History className="w-3 h-3 text-purple-600" />
                </div>
              </div>
              <span className="text-2xl font-black text-gray-900">{product.inventory.sold}</span>
            </div>

            {/* Returns */}
            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Returns</span>
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                  <RefreshCcw className="w-3 h-3 text-blue-600" />
                </div>
              </div>
              <span className="text-2xl font-black text-blue-600">{product.inventory.returned}</span>
            </div>

            {/* Damaged - Full Width row */}
            <div className="col-span-2 bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm font-semibold text-gray-600">Damaged Goods</span>
              </div>
              <span className="text-xl font-black text-orange-600">{product.inventory.damaged}</span>
            </div>
          </div>
        </div>

        {/* Sold Orders History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button 
            className="w-full p-4 flex items-center justify-between bg-white focus:outline-none"
            onClick={() => setShowSoldHistory(!showSoldHistory)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <History className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900">Sold History</h3>
                <p className="text-xs text-gray-500 font-medium">Recent orders for this product</p>
              </div>
            </div>
            {showSoldHistory ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          
          {showSoldHistory && (
            <div className="border-t border-gray-100">
              {MOCK_ORDERS.map((order, i) => (
                <div key={order.id} className={`p-4 ${i !== MOCK_ORDERS.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{order.customer}</p>
                      <p className="text-xs text-gray-500">{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">₹{order.cost}</p>
                      <p className="text-xs font-medium text-blue-600">Qty: {order.qty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {order.date}
                  </div>
                </div>
              ))}
              
              <div className="p-3 bg-gray-50 text-center">
                <button className="text-sm font-semibold text-gray-600 hover:text-gray-900">
                  View All Orders
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
