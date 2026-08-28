'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Box, Download, RotateCcw, HeadphonesIcon, MapPin, Truck } from 'lucide-react';
import { MOCK_ORDERS } from '@/lib/mock/checkout';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';

import { use } from 'react';



export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const order = MOCK_ORDERS.find(o => o.id === resolvedParams.id);

  if (!order) {
    notFound();
  }
  
  const isDelivered = order.status === 'DELIVERED';
  const isCancellable = ['CONFIRMED', 'PACKED'].includes(order.status);
  
  return (
    <div className="min-h-screen bg-gray-50 pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 px-4 py-4 flex items-center">
        <button onClick={() => router.back()} className="mr-4 text-gray-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Order Details</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {/* Status Banner */}
        <div className="bg-white p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-gray-500">Order ID - {order.id}</span>
            <span className="text-xs text-gray-400">Placed on {order.date.split(',')[0]}</span>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">
                {isDelivered ? 'Delivered Successfully' : 'Arriving Soon'}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {isDelivered ? `Delivered on ${order.estimatedDelivery}` : `Expected by ${order.estimatedDelivery}`}
              </p>
              
              <Button 
                onClick={() => router.push(`/orders/${order.id}/track`)}
                variant="outline" 
                className="mt-3 w-full h-9 rounded-lg border-blue-200 text-blue-700 font-bold text-xs bg-white hover:bg-blue-50"
              >
                Track Order
              </Button>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white p-4">
          <h3 className="font-bold text-gray-900 mb-4">Items in this Order</h3>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={item.id} className={`flex gap-4 ${idx !== 0 ? 'pt-4 border-t border-gray-100' : ''}`}>
                <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shrink-0 cursor-pointer" onClick={() => router.push(`/product/${item.productId}`)}>
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm leading-tight cursor-pointer" onClick={() => router.push(`/product/${item.productId}`)}>
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-black text-gray-900 text-sm">₹{item.price.toLocaleString('en-IN')}</span>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-sm">Qty: {item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white p-4">
          <h3 className="font-bold text-gray-900 mb-4">Delivery Address</h3>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                {order.deliveryAddress.name}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-gray-100 text-gray-600">
                  {order.deliveryAddress.type}
                </span>
              </h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {order.deliveryAddress.addressLine1}
                {order.deliveryAddress.addressLine2 && <>, {order.deliveryAddress.addressLine2}</>}
                <br />
                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
              </p>
              <p className="text-xs font-medium text-gray-900 mt-2">{order.deliveryAddress.phone}</p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-4">
          <h3 className="font-bold text-gray-900 mb-4">Payment Summary</h3>
          <div className="space-y-2 text-sm border-b border-gray-100 pb-3 mb-3">
            <div className="flex justify-between text-gray-600">
              <span>Item Total</span>
              <span className="font-medium text-gray-900">₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span className="font-medium text-[#208b5e]">FREE</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">Total Amount</span>
            <span className="font-black text-gray-900 text-lg">₹{order.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Paid via {order.paymentMethod}</p>
        </div>

        {/* Action Grid */}
        <div className="bg-white p-4 grid grid-cols-2 gap-3 pb-[100px]">
          {isDelivered && (
            <Button variant="outline" className="h-auto py-3 flex-col gap-2 rounded-xl border-gray-200">
              <RotateCcw className="w-5 h-5 text-gray-600" />
              <span className="text-xs font-bold text-gray-700">Easy Return</span>
            </Button>
          )}
          
          <Button variant="outline" className="h-auto py-3 flex-col gap-2 rounded-xl border-gray-200">
            <Download className="w-5 h-5 text-gray-600" />
            <span className="text-xs font-bold text-gray-700">Get Invoice</span>
          </Button>

          {isDelivered && (
            <Button variant="outline" className="h-auto py-3 flex-col gap-2 rounded-xl border-gray-200" onClick={() => router.push(`/orders/${order.id}/review`)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span className="text-xs font-bold text-gray-700">Rate & Review</span>
            </Button>
          )}

          <Button variant="outline" className="h-auto py-3 flex-col gap-2 rounded-xl border-gray-200">
            <HeadphonesIcon className="w-5 h-5 text-gray-600" />
            <span className="text-xs font-bold text-gray-700">Support</span>
          </Button>
        </div>
      </div>
      
      {/* Sticky Bottom (Cancel/Buy Again) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {isCancellable ? (
          <Button variant="outline" className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-lg">
            Cancel Order
          </Button>
        ) : (
          <Button className="w-full h-12 rounded-xl bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold text-lg">
            <Box className="w-5 h-5 mr-2" />
            Buy Again
          </Button>
        )}
      </div>
    </div>
  );
}
