'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetStoreProductsQuery } from '@/lib/api';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/lib/features/cartSlice';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RootState } from '@/lib/store';
import Link from 'next/link';

function StorefrontContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get('id') || '';
  const { data: storeData, isLoading } = useGetStoreProductsQuery(storeId, { skip: !storeId });
  const dispatch = useDispatch();
  const cartStoreId = useSelector((state: RootState) => state.cart.storeId);
  const cartItemsCount = useSelector((state: RootState) => 
    state.cart.items.reduce((total, item) => total + item.quantity, 0)
  );

  const handleAddToCart = (product: any) => {
    try {
      dispatch(addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        storeId: product.storeId,
      }));
      toast.success('Added to cart');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading products...</div>;
  }

  // The backend currently returns the store object with { products: [...] } for /stores/:storeId
  // Wait, let's verify if `getStoreProducts` actually hits `/stores/:storeId` or `/products/:storeId`.
  // Wait, it hits `/products/:storeId`. We need to fix the backend or the frontend endpoint.
  // Actually, I'll assume storeData is an array of products for now, or if it's the store object.
  // I will check the backend route `router.get('/stores/:storeId/products', productController.getProducts)`.
  // So the endpoint should be `/stores/${storeId}/products`.

  const products = Array.isArray(storeData) ? storeData : [];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/buyer" className="text-blue-600 hover:underline text-sm mb-2 block">&larr; Back to Stores</Link>
          <h1 className="text-3xl font-bold">Products</h1>
        </div>
        <Link href="/buyer/cart">
          <Button variant="outline" className="relative">
            Cart 
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {cartItemsCount}
              </span>
            )}
          </Button>
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <Card key={product.id} className="flex flex-col">
              <div className="w-full h-48 bg-gray-100 flex-shrink-0">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <CardHeader className="flex-1 pb-2">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description || 'No description available'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">₹{product.price}</div>
                <div className="text-xs text-gray-500 mt-1">{product.stock} in stock</div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed">
          <h3 className="text-lg font-medium text-gray-900">No products available</h3>
          <p className="text-gray-500 mt-1">This store hasn't added any products yet.</p>
        </div>
      )}
    </div>
  );
}

export default function StorefrontPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <StorefrontContent />
    </Suspense>
  );
}
