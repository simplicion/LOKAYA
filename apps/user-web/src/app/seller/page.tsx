'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useGetMyStoreQuery, useOnboardStoreMutation, useAddProductMutation, useGetPresignedUrlMutation } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export default function SellerDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: store, isLoading, refetch } = useGetMyStoreQuery(user?.id || '', {
    skip: !user?.id,
  });
  
  const [onboardStore, { isLoading: isSubmitting }] = useOnboardStoreMutation();
  const [addProduct, { isLoading: isAddingProduct }] = useAddProductMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();
  
  // Onboarding Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);

  const uploadFileToR2 = async (file: File): Promise<string> => {
    try {
      const { uploadUrl, publicUrl } = await getPresignedUrl({
        filename: file.name,
        contentType: file.type,
      }).unwrap();

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error('Upload to R2 failed');
      }

      return publicUrl;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to upload image');
    }
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onboardStore({ name, address, upiId, gstNumber, ownerId: user?.id }).unwrap();
      toast.success('Store created successfully! Awaiting verification.');
      refetch();
    } catch (err: any) {
      toast.error(err.data?.error || 'Failed to create store');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    
    setIsUploading(true);
    try {
      let imageUrl = 'https://via.placeholder.com/150';
      if (prodImageFile) {
        imageUrl = await uploadFileToR2(prodImageFile);
      }

      await addProduct({
        storeId: store.id,
        body: {
          name: prodName,
          price: parseFloat(prodPrice),
          stock: parseInt(prodStock, 10),
          description: prodDesc,
          image: imageUrl,
        }
      }).unwrap();
      toast.success('Product added successfully!');
      
      // Reset form
      setProdName('');
      setProdPrice('');
      setProdStock('');
      setProdDesc('');
      setProdImageFile(null);
      
      refetch();
    } catch (err: any) {
      toast.error(err.message || err.data?.error || 'Failed to add product');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  // If no store exists for the user, show Onboarding Form
  if (!store) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name}</CardTitle>
            <CardDescription>Let's get your store set up on QStore.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOnboard} className="space-y-4">
              <div className="space-y-2">
                <Label>Store Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Store Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>UPI ID (for payments)</Label>
                <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>GST Number (Optional)</Label>
                <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Store'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Seller Dashboard
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your store, products, and orders.</p>
        </div>
        <div className="space-x-4">
          <Link href="/seller/scan">
            <Button variant="outline">Scan QR Order</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 uppercase">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{store.products?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 uppercase">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 uppercase">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹0</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={prodName} onChange={(e) => setProdName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input type="number" min="0" step="0.01" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input type="number" min="0" value={prodStock} onChange={(e) => setProdStock(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setProdImageFile(e.target.files?.[0] || null)} />
                </div>
                <Button type="submit" className="w-full" disabled={isAddingProduct || isUploading}>
                  {isAddingProduct || isUploading ? 'Adding...' : 'Add Product'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Products currently available in your store.</CardDescription>
            </CardHeader>
            <CardContent>
              {store.products && store.products.length > 0 ? (
                <div className="space-y-4">
                  {store.products.map((product: any) => (
                    <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white">
                      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.name}</h3>
                        <div className="text-sm text-gray-500">₹{product.price} • {product.stock} in stock</div>
                      </div>
                      <div className="flex flex-col items-center gap-1 border p-2 bg-gray-50 rounded">
                        <QRCodeSVG value={product.qrUuid} size={64} />
                        <span className="text-[10px] text-gray-400 font-mono">{product.qrUuid.split('-')[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No products yet. Add your first product to get started!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
