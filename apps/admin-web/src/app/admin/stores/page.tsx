'use client';

import { useEffect, useState } from 'react';
import { useGetPendingStoresQuery, useVerifyStoreMutation, adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { FileText, Image as ImageIcon, MapPin } from 'lucide-react';

export default function StoreVerification() {
  const { data: stores, isLoading, refetch } = useGetPendingStoresQuery();
  const [verifyStore] = useVerifyStoreMutation();
  const dispatch = useDispatch();

  useEffect(() => {
    const socket = io('http://localhost:4002');

    socket.on('store_pending', (data) => {
      toast.info(`New store pending verification: ${data.name}`);
      refetch(); // Or dispatch invalidation
    });

    return () => {
      socket.disconnect();
    };
  }, [refetch]);

  const handleVerify = async (storeId: string) => {
    try {
      await verifyStore(storeId).unwrap();
      toast.success('Store verified successfully!');
    } catch (error) {
      toast.error('Failed to verify store');
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading pending stores...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Store Verification</h2>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Store Name</th>
              <th className="px-4 py-3 font-medium">Category / Type</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium">GST / UPI</th>
              <th className="px-4 py-3 font-medium">Documents</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No pending stores for verification.
                </td>
              </tr>
            )}
            {stores?.map((store) => (
              <tr key={store.id} className="border-b">
                <td className="px-4 py-3 font-medium">
                  {store.name}
                  <div className="text-xs text-gray-500 mt-1">Owner: {store.users?.[0]?.user?.email || 'N/A'}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{store.category || 'N/A'}</div>
                  <div className="text-xs text-gray-500 mt-1">{store.businessType || 'N/A'}</div>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  <div className="max-w-[200px] truncate" title={store.address}>{store.address}</div>
                  {store.landmark && <div className="text-xs mt-1 flex items-center"><MapPin className="w-3 h-3 mr-1 inline" /> {store.landmark}</div>}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  <div>{store.gstNumber || 'No GST'}</div>
                  <div className="text-xs mt-1">{store.upiId || 'No UPI'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    {store.aadharPanUrl ? (
                      <a href={store.aadharPanUrl} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:underline text-xs">
                        <FileText className="w-4 h-4 mr-1" /> ID / PAN
                      </a>
                    ) : <span className="text-xs text-gray-400">No ID</span>}
                    {store.storefrontUrl ? (
                      <a href={store.storefrontUrl} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:underline text-xs">
                        <ImageIcon className="w-4 h-4 mr-1" /> Storefront
                      </a>
                    ) : <span className="text-xs text-gray-400">No Photo</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Button 
                    size="sm" 
                    onClick={() => handleVerify(store.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
