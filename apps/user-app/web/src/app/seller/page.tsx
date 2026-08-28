'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGetMyStoreQuery, useGetStoreProductsQuery } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Package, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { data: store, isLoading, error } = useGetMyStoreQuery();
  const { data: products } = useGetStoreProductsQuery(store?.id || '', { skip: !store?.id });

  useEffect(() => {
    if (!isLoading && error && (error as any).status === 404) {
      router.push('/seller/onboarding');
    }
  }, [isLoading, error, router]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!store) return null; // Wait for redirect

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {store.status === 'PENDING' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-start gap-3">
          <Store className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-900">Verification in Progress</h3>
            <p className="text-sm mt-1">Your store KYC is currently under review. Some features may be restricted until your account is fully verified.</p>
          </div>
        </div>
      )}

      {store.status === 'REJECTED' && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <Store className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Verification Rejected</h3>
              <p className="text-sm mt-1">There was an issue with your KYC documents. Please update and resubmit your details.</p>
            </div>
          </div>
          <Button onClick={() => router.push('/seller/onboarding')} variant="destructive" size="sm" className="whitespace-nowrap">
            Resubmit KYC
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#171717]">Dashboard</h1>
          <p className="text-[#6B6B6B] mt-1">Welcome back to your store, {store.name}.</p>
        </div>
        <Button onClick={() => router.push('/seller/products')} className="bg-[#FF5A36] hover:bg-[#e04d2d] text-white rounded-xl">
          Manage Products
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-[#E5E2DC] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#6B6B6B]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#171717]">₹0.00</div>
            <p className="text-xs text-[#999999] mt-1">No sales yet</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-3xl border-[#E5E2DC] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Active Products</CardTitle>
            <Package className="h-4 w-4 text-[#6B6B6B]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#171717]">{products?.length || 0}</div>
            <p className="text-xs text-[#999999] mt-1">Add products to start selling</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[#E5E2DC] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#6B6B6B]">Store Status</CardTitle>
            <Store className="h-4 w-4 text-[#6B6B6B]" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${
              store.status === 'VERIFIED' ? 'text-green-600' : 
              store.status === 'REJECTED' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {store.status?.toLowerCase() || 'Pending'}
            </div>
            <p className="text-xs text-[#999999] mt-1">Your store verification status</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
