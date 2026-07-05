'use client';

import { useGetAllStoresQuery } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BuyerDashboard() {
  const { data: stores, isLoading } = useGetAllStoresQuery();

  if (isLoading) {
    return <div className="text-center py-10">Loading nearby stores...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Discover Local Stores</h1>
        <p className="text-gray-500 mt-2">Find products from verified stores near you and pick them up instantly.</p>
      </div>

      {stores && stores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store: any) => (
            <Card key={store.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{store.name}</CardTitle>
                <CardDescription>{store.address}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/buyer/store?id=${store.id}`}>
                  <Button className="w-full">Shop Now</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed">
          <h3 className="text-lg font-medium text-gray-900">No stores available</h3>
          <p className="text-gray-500 mt-1">There are no verified stores on the platform right now.</p>
        </div>
      )}
    </div>
  );
}
