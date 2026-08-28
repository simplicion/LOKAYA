'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Package, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function SellerDashboardPage() {
  const user = useSelector((state: any) => state.auth.user);
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd use RTK Query here to fetch the store profile.
    // For now, we mock the check to see if they need onboarding.
    const checkStoreStatus = async () => {
      try {
        const token = localStorage.getItem('token'); // or from Redux
        const res = await fetch('/api/seller/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.status === 404) {
          router.push('/seller/onboarding');
          return;
        }
        
        if (res.ok) {
          const data = await res.json();
          setStore(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStoreStatus();
  }, [router]);

  if (isLoading) return <div className="flex items-center justify-center h-64">Loading workspace...</div>;
  if (!store) return null; // Will redirect in useEffect

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back to your store, {store.name}.</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/seller/products/new">Add Product</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹0.00</div>
            <p className="text-xs text-gray-500 mt-1">No sales yet</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Products</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">Add products to start selling</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Store Status</CardTitle>
            <Store className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize text-green-600">{store.status?.toLowerCase() || 'Pending'}</div>
            <p className="text-xs text-gray-500 mt-1">Your store verification status</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
