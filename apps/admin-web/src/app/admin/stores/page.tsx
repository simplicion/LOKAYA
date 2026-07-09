'use client';

import { useEffect } from 'react';
import { useGetPendingStoresQuery, useVerifyStoreMutation, adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

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

      <div className="border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Store Name</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium">GST Number</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No pending stores for verification.
                </td>
              </tr>
            )}
            {stores?.map((store) => (
              <tr key={store.id} className="border-b">
                <td className="px-4 py-3 font-medium">{store.name}</td>
                <td className="px-4 py-3 text-gray-500">{store.address}</td>
                <td className="px-4 py-3 text-gray-500">{store.gstNumber}</td>
                <td className="px-4 py-3">
                  <Button 
                    size="sm" 
                    onClick={() => handleVerify(store.id)}
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
