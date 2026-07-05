'use client';

import { use } from 'react';
import { useGetOrderQuery, useUpdateOrderStatusMutation } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FulfillOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const { data: order, isLoading, refetch } = useGetOrderQuery(resolvedParams.orderId);
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  if (isLoading) {
    return <div className="text-center py-12">Loading order details...</div>;
  }

  if (!order) {
    return <div className="text-center py-12">Order not found</div>;
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ orderId: order.id, status: newStatus }).unwrap();
      toast.success('Order status updated');
      refetch();
    } catch (err: any) {
      toast.error(err.data?.error || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'READY_FOR_PICKUP': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fulfill Order</h1>
          <p className="text-gray-500 mt-1">Order ID: {order.id}</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-bold text-sm ${getStatusColor(order.status)}`}>
          {order.status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
            <CardDescription>Move the order through the fulfillment pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select 
              defaultValue={order.status} 
              onValueChange={handleStatusChange}
              disabled={isUpdating || order.status === 'COMPLETED' || order.status === 'CANCELLED'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="READY_FOR_PICKUP">Ready for Pickup</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              className="w-full" 
              onClick={() => handleStatusChange('COMPLETED')}
              disabled={order.status === 'COMPLETED' || isUpdating}
            >
              Mark as Completed
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <div className="font-medium">{item.product?.name || 'Product'}</div>
                    <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                  </div>
                  <div className="font-medium">
                    ₹{item.quantity * item.priceAtTime}
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-4 font-bold text-lg">
                <div>Total</div>
                <div>₹{order.totalAmount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
