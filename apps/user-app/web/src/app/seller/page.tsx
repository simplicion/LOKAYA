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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500 mt-1">Welcome back to your store, {store.name}.</p>
        </div>
        <Button onClick={() => router.push('/seller/products')} className="bg-indigo-600 hover:bg-indigo-700">
          Manage Products
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-zinc-500 mt-1">No sales yet</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Active Products</CardTitle>
            <Package className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Add products to start selling</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Store Status</CardTitle>
            <Store className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${
              store.status === 'VERIFIED' ? 'text-green-600' : 'text-amber-600'
            }`}>
              {store.status?.toLowerCase() || 'Pending'}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Your store verification status</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
