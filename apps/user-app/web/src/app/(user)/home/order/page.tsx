'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetOrderQuery } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { io } from 'socket.io-client';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || '';
  const { data: order, isLoading, refetch } = useGetOrderQuery(orderId, { skip: !orderId });

  useEffect(() => {
    if (!orderId) return;

    const socket = io('http://localhost:4002');
    
    socket.emit('join_order', orderId);

    socket.on('order_status_updated', (updatedOrder) => {
      // In a real app we might toast or use RTK Cache update directly. For MVP we refetch.
      refetch();
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId, refetch]);

  if (isLoading) {
    return <div className="text-center py-12">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
        <Link href="/home">
          <Button>Back to Store</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Order Placed Successfully!</h1>
        <p className="text-gray-500 mt-2">Show this QR code at the store to pick up your order.</p>
      </div>

      <Card className="border-green-200 shadow-sm">
        <CardHeader className="text-center pb-4 border-b">
          <CardTitle>Pickup QR Code</CardTitle>
          <CardDescription>Order ID: {order.id}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
            <QRCodeSVG 
              value={order.id}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="text-sm font-medium text-gray-600">
            Status: <span className="text-blue-600 uppercase">{order.status}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>{order.store?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <div className="font-medium">{item.product?.name || 'Product'}</div>
                  <div className="text-sm text-gray-500">Qty: {item.quantity} &times; ₹{item.priceAtTime}</div>
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

      <div className="flex justify-center">
        <Link href="/home">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
