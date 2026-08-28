"use client";

import { useGetMyStoreQuery, useGetStoreProductsQuery, useAddProductMutation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function SellerProductsPage() {
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const { data: products, isLoading: isProductsLoading } = useGetStoreProductsQuery(store?.id || '', {
    skip: !store?.id
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isStoreLoading || (store?.id && isProductsLoading)) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!store?.id) {
    return (
      <div className="flex h-full min-h-[50vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold">Store Not Found</h2>
        <p className="text-zinc-500 text-center max-w-md">You need to complete the onboarding process before managing products.</p>
        <Button onClick={() => window.location.href = '/seller/onboarding'}>Complete Onboarding</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-zinc-500">Manage your product catalog, pricing, and inventory.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="rounded-md border border-zinc-200">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-700 uppercase bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">Product Name</th>
                <th scope="col" className="px-6 py-3 font-medium">Status</th>
                <th scope="col" className="px-6 py-3 font-medium">Price</th>
                <th scope="col" className="px-6 py-3 font-medium">Inventory</th>
                <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!products || products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                    No products found. Add your first product to get started.
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr key={product.id} className="bg-white border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-md overflow-hidden relative border border-zinc-200">
                        {product.images && product.images[0] ? (
                          <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-zinc-400 text-xs">No Img</div>
                        )}
                      </div>
                      <span className="font-semibold">{product.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Active</span>
                    </td>
                    <td className="px-6 py-4">
                      ${product.price}
                    </td>
                    <td className="px-6 py-4">
                      {product.stock || 0} in stock
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-indigo-600 hover:text-indigo-900 mx-2">
                        <Edit2 className="h-4 w-4 inline" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 mx-2">
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
