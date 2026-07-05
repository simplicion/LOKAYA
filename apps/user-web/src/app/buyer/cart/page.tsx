'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { removeFromCart, updateQuantity, clearCart } from '@/lib/features/cartSlice';
import { useCreateOrderMutation, useCreatePaymentOrderMutation, useVerifyPaymentMutation } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useRazorpay from 'react-razorpay';
import { useState } from 'react';

export default function CartPage() {
  const cart = useSelector((state: RootState) => state.cart);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  
  const [createOrder] = useCreateOrderMutation();
  const [createPaymentOrder] = useCreatePaymentOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  const router = useRouter();
  const [Razorpay] = useRazorpay();

  const handleCheckout = async () => {
    if (!user) {
      toast.error('You must be logged in to checkout');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create a DB Order first
      const orderData = {
        userId: user.id,
        storeId: cart.storeId,
        items: cart.items.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price })),
        totalAmount: cart.totalAmount
      };

      const dbOrder = await createOrder(orderData).unwrap();

      // 2. Create a Razorpay Order
      const rzpOrder = await createPaymentOrder({ 
        amount: cart.totalAmount,
        receipt: `receipt_${dbOrder.id}`
      }).unwrap();

      // 3. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_T1anC9i8xqGmCz', // Best practice: use env variable
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'Snapy',
        description: 'Order Payment',
        order_id: rzpOrder.id,
        handler: async (response: any) => {
          try {
            // 4. Verify Payment on Backend
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              system_order_id: dbOrder.id,
            }).unwrap();

            dispatch(clearCart());
            toast.success('Payment successful!');
            router.push(`/buyer/order/${dbOrder.id}`);
          } catch (err) {
            console.error(err);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user.name || 'Buyer',
          email: user.email || 'buyer@example.com',
        },
        theme: {
          color: '#000000',
        },
      };

      const rzp1 = new Razorpay(options);

      rzp1.on('payment.failed', function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
      });

      rzp1.open();

    } catch (err: any) {
      toast.error(err.data?.error || 'Checkout initialization failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
        <Link href="/buyer">
          <Button>Browse Stores</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Shopping Cart</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Items from Store</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-gray-500">₹{item.price} each</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => dispatch(updateQuantity({ id: item.id, quantity: Math.max(1, item.quantity - 1) }))}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                  >
                    +
                  </Button>
                </div>
                
                <div className="w-20 text-right font-medium">
                  ₹{item.price * item.quantity}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-700"
                  onClick={() => dispatch(removeFromCart(item.id))}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-gray-50 rounded-b-lg">
          <div className="text-lg font-medium">Total Amount</div>
          <div className="text-2xl font-bold">₹{cart.totalAmount}</div>
        </CardFooter>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => dispatch(clearCart())}>
          Clear Cart
        </Button>
        <Button size="lg" onClick={handleCheckout} disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Pay with Razorpay'}
        </Button>
      </div>
    </div>
  );
}
