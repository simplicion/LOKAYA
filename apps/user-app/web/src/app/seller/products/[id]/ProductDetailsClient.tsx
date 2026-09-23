'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit2, History, Package, AlertTriangle, CheckCircle2, TrendingUp, Calendar, Clock, ChevronDown, ChevronUp, RefreshCcw, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetProductByIdQuery, useUpdateProductMutation } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';

export default function ProductDetailsClient({ params }: { params?: { id: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const routeId = routeParams?.id as string | undefined;
  const pathId = typeof window !== 'undefined' 
    ? window.location.pathname.split('/seller/products/')[1]?.split('/')[0]?.split('?')[0] 
    : undefined;

  const productId = (routeId && routeId !== '1') 
    ? routeId 
    : (pathId && pathId !== '1') 
      ? pathId 
      : (routeId || pathId || params?.id || '');

  const { formatPrice } = useCurrency();
  const [showSoldHistory, setShowSoldHistory] = useState(false);

  const { data: productData, isLoading, refetch } = useGetProductByIdQuery(productId, { skip: !productId });
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const product = {
    name: productData?.name || 'Product Details',
    sku: productData?.sku || 'N/A',
    category: productData?.categoryModel?.name || productData?.category || 'General',
    mrp: productData?.mrp || 0,
    price: productData?.sellingPrice || 0,
    status: productData?.isActive ? 'Active' : 'Inactive',
    addedOn: productData?.createdAt 
      ? new Date(productData.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Recently',
    lastUpdated: productData?.updatedAt 
      ? new Date(productData.updatedAt).toLocaleDateString([], { day: 'numeric', month: 'short' })
      : 'Recently',
    inventory: {
      addedThisMonth: productData?.stockCount || 0,
      currentStock: productData?.stockCount || 0,
      sold: (productData?.orderItems || []).reduce((acc: number, item: any) => acc + (item.quantity || 0), 0),
      damaged: 0,
      returned: 0
    },
    hasVariants: Boolean(productData?.hasVariants),
    variants: productData?.variants || [],
    image: productData?.imageUrl || productData?.media?.[0]?.url ? getMediaUrl(productData?.imageUrl || productData?.media?.[0]?.url) : '',
    orders: (productData?.orderItems || []).map((item: any) => ({
      id: item.order?.id?.slice(0, 8).toUpperCase() || 'ORD',
      customer: item.order?.buyer?.name || 'Customer',
      date: item.order?.createdAt ? new Date(item.order.createdAt).toLocaleDateString() : 'Today',
      qty: item.quantity,
      cost: (item.priceAt || productData?.sellingPrice || 0) * item.quantity
    }))
  };

  const discountPercent = product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateProduct({
        productId: productId,
        body: { isActive: newStatus === 'Active' }
      }).unwrap();
      refetch();
    } catch (e) {
      console.error('Failed to change product status:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

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
          onClick={() => router.push(`/seller/products/${productId}/edit`)}
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span className="text-sm">Edit</span>
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Verification Status Card */}
        {productData?.verificationStatus === 'REJECTED' ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-rose-900">Needs Revision</h4>
              <p className="text-rose-700 mt-0.5">{productData?.rejectionReason || 'Please review and update the product details.'}</p>
            </div>
          </div>
        ) : productData?.verificationStatus === 'APPROVED' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Verified & Listed Live in Store</span>
            </div>
            <span className="text-[10px] bg-emerald-200/60 text-emerald-900 font-bold px-2 py-0.5 rounded-md">Live</span>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-800 font-semibold">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
              <span>Under Review</span>
            </div>
            <span className="text-[10px] bg-amber-200/60 text-amber-900 font-bold px-2 py-0.5 rounded-md">Under Review</span>
          </div>
        )}

        {/* Product Identity Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-start">
          <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden relative shrink-0 flex items-center justify-center">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-8 h-8 text-gray-400 stroke-[1.5]" />
            )}
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
                  product.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
                value={product.status}
                disabled={isUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Pricing Info */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Selling Price</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-gray-900">{formatPrice(product.price)}</span>
              {product.mrp > product.price && (
                <span className="text-sm text-gray-400 line-through">{formatPrice(product.mrp)}</span>
              )}
            </div>
          </div>
          {discountPercent > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-center">
              <span className="text-emerald-700 text-xs font-bold block">{discountPercent}% OFF</span>
              <span className="text-[10px] text-emerald-600 font-medium">Margin Saved</span>
            </div>
          )}
        </div>

        {/* Inventory Flow Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              Inventory & Velocity
            </h3>
            <span className="text-[11px] text-gray-400">Stock Status</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Current Stock</span>
              <p className="text-xl font-bold text-gray-900 mt-1">{product.inventory.currentStock} Units</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">Total Sold</span>
              <p className="text-xl font-bold text-green-600 mt-1">{product.inventory.sold} Units</p>
            </div>
          </div>
        </div>

        {/* Variants Listing */}
        {(product.hasVariants || product.variants.length > 0) && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600" />
                Available Variants ({product.variants.length})
              </h3>
              <Link
                href={`/seller/products/${productId}/edit`}
                className="text-xs font-bold text-[#FF5A36] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Manage Variants
              </Link>
            </div>

            {product.variants.length > 0 ? (
              <div className="space-y-2">
                {product.variants.map((v: any) => (
                  <div key={v.id} className="flex justify-between items-center p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm">
                    <div>
                      <p className="font-bold text-gray-900">{v.name}</p>
                      <p className="text-[11px] text-gray-500">SKU: {v.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatPrice(v.price)}</p>
                      <p className="text-[11px] text-gray-500">{v.stockCount} in stock</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-orange-50/60 border border-orange-100 rounded-xl text-center">
                <p className="text-xs text-gray-600 font-medium">Variants are enabled, but none configured yet.</p>
                <Link
                  href={`/seller/products/${productId}/edit`}
                  className="inline-block mt-2 text-xs font-bold text-[#FF5A36] hover:underline cursor-pointer"
                >
                  + Add Variant Options Now
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Order History for this product */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <History className="w-4 h-4 text-orange-500" />
              Recent Fulfillments ({product.orders.length})
            </h3>
            {product.orders.length > 0 && (
              <button 
                onClick={() => setShowSoldHistory(!showSoldHistory)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                {showSoldHistory ? 'Collapse' : 'Expand'}
              </button>
            )}
          </div>

          {product.orders.length === 0 ? (
            <p className="text-xs text-gray-400 py-3 text-center">No orders have placed this item yet.</p>
          ) : (
            <div className="space-y-2">
              {product.orders.slice(0, showSoldHistory ? undefined : 3).map((ord: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm">
                  <div>
                    <p className="font-bold text-gray-900">{ord.customer}</p>
                    <p className="text-[11px] text-gray-500">#{ord.id} • {ord.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(ord.cost)}</p>
                    <p className="text-[11px] text-gray-500">Qty: {ord.qty}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
