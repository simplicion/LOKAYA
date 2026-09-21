'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import Image from 'next/image';

// On-demand Razorpay SDK loader to prevent upfront 21MB / 263-request network flooding
function loadRazorpaySDK(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
import { 
  ChevronLeft, 
  MapPin, 
  Plus, 
  Check, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  Banknote, 
  ShoppingBag, 
  Loader2, 
  AlertCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  useGetAddressesQuery, 
  useAddAddressMutation, 
  useGetProductByIdQuery,
  useGetCartQuery,
  useCreateOrderMutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useRemoveFromCartMutation,
  useUpdateCartItemMutation
} from '@/lib/api';
import { clearCart, removeFromCart, updateQuantity } from '@/lib/features/cartSlice';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { formatPrice, currencySymbol } = useCurrency();
  const user = useSelector((state: RootState) => (state as any).auth?.user);

  // URL Query Params for direct buy now
  const directProductId = searchParams.get('productId');
  const directVariantId = searchParams.get('variantId');
  const directQty = parseInt(searchParams.get('quantity') || '1', 10);

  // Direct Product Query
  const { data: directProduct, isLoading: isDirectLoading } = useGetProductByIdQuery(
    directProductId || '', 
    { skip: !directProductId }
  );

  // Cart Query
  const { data: cartData, isLoading: isCartLoading } = useGetCartQuery(undefined, {
    skip: !!directProductId || !user
  });
  const reduxCartItems = useSelector((state: RootState) => state.cart.items);

  // Address Data
  const { data: addresses = [], isLoading: isAddressesLoading, refetch: refetchAddresses } = useGetAddressesQuery(undefined, {
    skip: !user
  });
  const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();

  // Order & Payment Mutations
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const [createPaymentOrder, { isLoading: isCreatingPayment }] = useCreatePaymentOrderMutation();
  const [verifyPayment, { isLoading: isVerifyingPayment }] = useVerifyPaymentMutation();

  // Local Checkout State
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // New Address Form State
  const [newAddressForm, setNewAddressForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    type: 'HOME',
    isDefault: true,
  });

  // Select default address on initial load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  // Derive active items to order
  const orderItems = React.useMemo(() => {
    if (directProductId && directProduct) {
      const variant = directVariantId 
        ? directProduct.variants?.find((v: any) => v.id === directVariantId) 
        : directProduct.variants?.[0];
      const price = variant?.price ?? directProduct.sellingPrice ?? 0;
      const image = directProduct.media?.[0]?.url || directProduct.imageUrl || '';
      const rawStock = variant?.stockCount ?? directProduct.stockCount;
      const stockCount = rawStock !== undefined ? Number(rawStock) : undefined;

      return [{
        id: variant ? `${directProduct.id}-${variant.id}` : directProduct.id,
        productId: directProduct.id,
        variantId: variant?.id,
        name: directProduct.name,
        price,
        quantity: directQty,
        stockCount,
        storeId: directProduct.storeId,
        storeName: directProduct.store?.name,
        store: directProduct.store,
        image,
        variantName: variant?.name,
      }];
    }

    const resolvedMap = new Map<string, any>();

    // 1. Backend cart items (authoritative for logged in user)
    if (cartData?.items && cartData.items.length > 0) {
      cartData.items
        .filter((item: any) => item.product != null && item.product.id && item.product.isActive !== false)
        .forEach((item: any) => {
          const key = item.productId ? `${item.productId}-${item.variantId || 'base'}` : item.id;
          const rawStock = item.variant?.stockCount ?? item.product?.stockCount;
          const stockCount = rawStock !== undefined ? Number(rawStock) : undefined;
          resolvedMap.set(key, {
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            name: item.product?.name || item.productName || 'Product',
            price: item.variant?.price ?? item.product?.sellingPrice ?? item.priceAt ?? 0,
            quantity: item.quantity,
            stockCount,
            storeId: item.product?.storeId || '',
            storeName: item.product?.store?.name,
            store: item.product?.store,
            image: item.product?.media?.[0]?.url || item.product?.imageUrl || '',
            variantName: item.variant?.name,
          });
        });
    }

    // 2. Redux cart items (only used if guest user is not logged in)
    if (!user) {
      reduxCartItems.forEach((item: any) => {
        const key = item.productId ? `${item.productId}-${item.variantId || 'base'}` : item.id;
        if (!resolvedMap.has(key)) {
          resolvedMap.set(key, {
            ...item,
            productId: item.productId || item.id,
            stockCount: item.stockCount !== undefined ? Number(item.stockCount) : undefined,
            store: item.store || item.product?.store,
          });
        }
      });
    }

    return Array.from(resolvedMap.values());
  }, [directProductId, directProduct, directVariantId, directQty, cartData, reduxCartItems, user]);



  // Inventory validation to prevent 400 Bad Request at order placement
  const invalidCheckoutItems = React.useMemo(() => {
    return orderItems.filter((i: any) => i.stockCount !== undefined && (i.stockCount <= 0 || i.quantity > i.stockCount));
  }, [orderItems]);

  const hasStockShortage = invalidCheckoutItems.length > 0;

  const [removeFromCartAPI] = useRemoveFromCartMutation();
  const [updateCartQtyAPI] = useUpdateCartItemMutation();

  const handleAutoAdjustCheckoutItems = async () => {
    for (const item of invalidCheckoutItems) {
      if (item.stockCount <= 0) {
        dispatch(removeFromCart(item.id));
        if (item.productId) dispatch(removeFromCart(item.productId));
        if (user && item.id) {
          try {
            await removeFromCartAPI(item.id).unwrap();
          } catch (e) {
            console.warn('Failed to remove out-of-stock item from backend cart:', e);
          }
        }
      } else if (item.quantity > item.stockCount) {
        dispatch(updateQuantity({ id: item.id, quantity: item.stockCount }));
        if (user && item.id) {
          try {
            await updateCartQtyAPI({ itemId: item.id, quantity: item.stockCount }).unwrap();
          } catch (e) {
            console.warn('Failed to adjust item quantity in backend cart:', e);
          }
        }
      }
    }
    toast.success('Your order has been adjusted to available stock');
  };

  // Multi-Store Fulfillment Packages Breakdown & Blended Distance Calculation
  const storePackages = React.useMemo(() => {
    const map = new Map<string, { storeId: string; storeName: string; store: any; items: any[]; isFreeDelivery: boolean; distanceKm: number; deliveryFee: number }>();
    for (const item of orderItems) {
      const sId = item.storeId || item.store?.id || 'default_store';
      if (!map.has(sId)) {
        // Estimated store-to-customer distance (defaults to ~5km if GPS not present)
        const estDistance = item.store?.latitude && user?.latitude
          ? Math.max(1.5, Math.round(Math.sqrt(Math.pow(item.store.latitude - user.latitude, 2) + Math.pow(item.store.longitude - user.longitude, 2)) * 111 * 10) / 10)
          : 5.0;

        map.set(sId, {
          storeId: sId,
          storeName: item.storeName || item.store?.name || 'Local Merchant Store',
          store: item.store,
          items: [],
          isFreeDelivery: false,
          distanceKm: estDistance,
          deliveryFee: 50
        });
      }
      const pkg = map.get(sId)!;
      pkg.items.push(item);
      if (item.isDeliveryIncluded || item.product?.isDeliveryIncluded) {
        pkg.isFreeDelivery = true;
      }
    }

    return Array.from(map.values());
  }, [orderItems, user]);

  // Multi-Store Blended Delivery Fee Calculation (Average Distance Model)
  const { deliveryFee, blendedDistanceKm, multiStoreSavings } = React.useMemo(() => {
    const payableStores = storePackages.filter(p => !p.isFreeDelivery);
    if (payableStores.length === 0) {
      return { deliveryFee: 0, blendedDistanceKm: 0, multiStoreSavings: 0 };
    }

    // Calculate blended average distance
    const totalDist = payableStores.reduce((sum, p) => sum + p.distanceKm, 0);
    const avgDist = Math.round((totalDist / payableStores.length) * 10) / 10;

    // Single blended 2-way round trip delivery fee
    let singleBlendedFee = 50;
    if (avgDist > 10) {
      singleBlendedFee = 90; // Regional courier slab
    } else {
      singleBlendedFee = Math.max(50, Math.round(2 * avgDist * 8));
    }

    // If standalone was charged per store
    const standaloneSum = payableStores.reduce((sum, p) => {
      const single = p.distanceKm > 10 ? 90 : Math.max(50, Math.round(2 * p.distanceKm * 8));
      return sum + single;
    }, 0);

    const savings = Math.max(0, standaloneSum - singleBlendedFee);

    return {
      deliveryFee: singleBlendedFee,
      blendedDistanceKm: avgDist,
      multiStoreSavings: savings
    };
  }, [storePackages]);

  // Pricing calculations
  const itemsSubtotal = orderItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const platformFee = Math.round(itemsSubtotal * 0.015 * 100) / 100; // 1.5% Platform Convenience Fee
  const prepaidDiscount = paymentMethod === 'ONLINE' ? Math.min(Math.round(itemsSubtotal * 0.05), 100) : 0;
  const codFee = paymentMethod === 'COD' ? 49 : 0;
  const grandTotal = Math.max(0, Math.round((itemsSubtotal + deliveryFee + platformFee - prepaidDiscount + codFee) * 100) / 100);

  // Address creation handler
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressForm.name || !newAddressForm.phone || !newAddressForm.addressLine1 || !newAddressForm.city || !newAddressForm.pincode) {
      toast.error('Please fill in all required address fields');
      return;
    }

    try {
      const created = await addAddress(newAddressForm).unwrap();
      toast.success('Address saved successfully');
      setSelectedAddressId(created.id);
      setIsAddressModalOpen(false);
      refetchAddresses();
    } catch (err: any) {
      toast.error(err.data?.message || 'Failed to save address');
    }
  };

  // Order & Razorpay Checkout Trigger
  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please sign in to complete your purchase');
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    if (hasStockShortage) {
      toast.error('Some items in your order are out of stock or exceed inventory. Please click "Auto-Adjust Order" above.');
      return;
    }

    if (!selectedAddressId && addresses.length === 0) {
      setIsAddressModalOpen(true);
      toast.info('Please enter your delivery address');
      return;
    }

    if (orderItems.length === 0) {
      toast.error('No items found to checkout');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Resolve primary storeId if available (backend automatically resolves from items if omitted)
      const primaryStoreId = orderItems.find((i: any) => i.storeId && i.storeId.length > 10)?.storeId || undefined;

      // Format delivery address string
      const chosenAddress = addresses.find((a: any) => a.id === selectedAddressId) || addresses[0];
      const deliveryAddressString = chosenAddress 
        ? `${chosenAddress.name}, ${chosenAddress.addressLine1}${chosenAddress.addressLine2 ? `, ${chosenAddress.addressLine2}` : ''}, ${chosenAddress.city}, ${chosenAddress.state} - ${chosenAddress.pincode} (Ph: ${chosenAddress.phone})`
        : 'Default Customer Address';

      // 2. Create Order in backend
      const orderPayload = {
        storeId: primaryStoreId,
        items: orderItems.map((i: any) => ({
          productId: i.productId,
          variantId: i.variantId || undefined,
          quantity: i.quantity
        })),
        deliveryAddress: deliveryAddressString,
        paymentMethod,
        shippingFee: deliveryFee
      };

      const createdOrder = await createOrder(orderPayload).unwrap();

      // 3. Handle Payment Method
      if (paymentMethod === 'ONLINE') {
        toast.loading('Initializing payment gateway...', { id: 'payment-init' });
        const isLoaded = await loadRazorpaySDK();
        toast.dismiss('payment-init');

        if (!isLoaded || typeof window === 'undefined' || !(window as any).Razorpay) {
          toast.error('Unable to load payment gateway. Please try again or choose Cash on Delivery.');
          setIsProcessing(false);
          return;
        }

        // Create Razorpay Order
        const sessionRes = await createPaymentOrder({
          orderId: createdOrder.id,
          amount: grandTotal
        }).unwrap();

        const razorpayOrder = sessionRes.razorpayOrder;

        // Open Razorpay Standard Checkout
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_51PLACEHOLDER',
          amount: Math.round(grandTotal * 100),
          currency: 'INR',
          name: 'LOKAYA Social Commerce',
          description: `Order #${createdOrder.id.slice(0, 8)}`,
          order_id: razorpayOrder?.id,
          prefill: {
            name: user.name || chosenAddress?.name || '',
            email: user.email || '',
            contact: chosenAddress?.phone || user.phone || ''
          },
          theme: {
            color: '#FF6B00'
          },
          handler: async function (response: any) {
            try {
              toast.loading('Verifying secure payment...', { id: 'payment-verify' });
              await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                system_order_id: createdOrder.id
              }).unwrap();

              toast.success('Payment confirmed!', { id: 'payment-verify' });
              dispatch(clearCart());
              router.push(`/checkout/success?orderId=${createdOrder.id}`);
            } catch (err: any) {
              toast.error(err.data?.message || 'Payment verification failed', { id: 'payment-verify' });
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              toast.info('Payment window closed. Order is pending.');
            }
          }
        };

        const rzpInstance = new (window as any).Razorpay(options);
        rzpInstance.open();
      } else {
        // COD Order
        toast.success('Order placed with Cash on Delivery!');
        dispatch(clearCart());
        router.push(`/checkout/success?orderId=${createdOrder.id}`);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.data?.message || error.message || 'Failed to place order');
      setIsProcessing(false);
    }
  };

  const isLoading = (directProductId && isDirectLoading) || isAddressesLoading || (user && isCartLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preparing Checkout...</span>
      </div>
    );
  }

  if (orderItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-[#FF6B00] mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Bag is Empty</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          The items in your bag are no longer available or have been cleared. Discover new arrivals and handcrafted goods in our marketplace!
        </p>
        <Link
          href="/shop"
          className="bg-[#171717] hover:bg-black text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-sm"
        >
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="font-extrabold text-base text-gray-900 tracking-tight">Secure Checkout</h1>
            <p className="text-[10px] text-gray-500 font-medium flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              100% Encrypted & Safe
            </p>
          </div>
          <div className="w-9" /> {/* Balancer */}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        
        {/* Inventory Shortage Warning Alert */}
        {hasStockShortage && (
          <div className="bg-red-50/95 border border-red-200 rounded-2xl p-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-950 text-sm">Inventory shortage detected</h4>
                  <p className="text-xs text-red-800/90 mt-0.5 leading-relaxed">
                    {invalidCheckoutItems.map((it: any) => 
                      it.stockCount <= 0 
                        ? `"${it.name}" is currently out of stock`
                        : `"${it.name}" has only ${it.stockCount} available (you requested ${it.quantity})`
                    ).join(', ')}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutoAdjustCheckoutItems}
                className="bg-[#171717] hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl shrink-0 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Auto-Adjust Order</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Delivery Address */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF6B00] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h2 className="font-bold text-gray-900 text-sm">Delivery Address</h2>
            </div>

            <button
              type="button"
              onClick={() => setIsAddressModalOpen(true)}
              className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center space-y-2">
              <MapPin className="w-8 h-8 mx-auto text-gray-300" />
              <p className="text-xs text-gray-500 font-medium">No saved addresses found</p>
              <Button
                size="sm"
                onClick={() => setIsAddressModalOpen(true)}
                className="bg-[#FF6B00] hover:bg-[#ff7a1f] text-white text-xs font-bold rounded-lg"
              >
                + Add Delivery Address
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr: any) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 relative ${
                      isSelected 
                        ? 'border-[#FF6B00] bg-orange-50/20 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-[#FF6B00]' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#FF6B00]" />}
                      </div>
                    </div>

                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">{addr.name}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {addr.type}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold text-[#FF6B00]">DEFAULT</span>
                        )}
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                      </p>
                      <p className="text-gray-600">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-gray-500 font-medium mt-1">
                        Phone: {addr.phone}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 2: Payment Method */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF6B00] flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h2 className="font-bold text-gray-900 text-sm">Payment Method</h2>
          </div>

          <div className="space-y-3">
            {/* Online Option */}
            <div
              onClick={() => setPaymentMethod('ONLINE')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                paymentMethod === 'ONLINE'
                  ? 'border-[#FF6B00] bg-orange-50/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="mt-0.5">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'ONLINE' ? 'border-[#FF6B00]' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'ONLINE' && <div className="w-2 h-2 rounded-full bg-[#FF6B00]" />}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">Prepaid / UPI & Cards</span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> 5% INSTANT OFF
                    </span>
                  </div>
                  <CreditCard className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm, Cards, NetBanking via Razorpay</p>
              </div>
            </div>

            {/* Cash on Delivery Option */}
            <div
              onClick={() => setPaymentMethod('COD')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                paymentMethod === 'COD'
                  ? 'border-[#FF6B00] bg-orange-50/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="mt-0.5">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  paymentMethod === 'COD' ? 'border-[#FF6B00]' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'COD' && <div className="w-2 h-2 rounded-full bg-[#FF6B00]" />}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-gray-900">Cash on Delivery</span>
                  <Banknote className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500">Pay cash upon delivery. +{formatPrice(49)} verification & handling fee.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Step 4: Store Fulfillment Packages Preview */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">
              Fulfillment Packages ({storePackages.length})
            </h2>
            <span className="text-[11px] text-gray-500 font-medium">
              {orderItems.length} total items
            </span>
          </div>

          <div className="space-y-3">
            {storePackages.map((pkg, pIdx) => (
              <div key={pIdx} className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-sm space-y-3">
                {/* Store Header & Guarantees */}
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#FF5A36] flex items-center justify-center font-bold text-xs">
                      {pIdx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-gray-900">{pkg.storeName}</h3>
                      <p className="text-[10px] text-gray-500">{pkg.items.length} {pkg.items.length === 1 ? 'item' : 'items'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Truck className="w-3 h-3 text-emerald-600" />
                      2-3 Days Delivery
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      7-Day Replacement
                    </span>
                  </div>
                </div>

                {/* Package Items */}
                <div className="divide-y divide-gray-100">
                  {pkg.items.map((item: any, idx: number) => {
                    const isItemOOS = item.stockCount !== undefined && item.stockCount <= 0;
                    const isItemOver = item.stockCount !== undefined && item.stockCount > 0 && item.quantity > item.stockCount;
                    return (
                      <div key={idx} className={`py-2.5 flex items-center gap-3 ${isItemOOS ? 'opacity-85' : ''}`}>
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden relative flex-shrink-0 border border-gray-200">
                          {item.image ? (
                            <Image 
                              src={item.image} 
                              alt={item.name} 
                              fill 
                              className={`object-cover ${isItemOOS ? 'grayscale' : ''}`}
                              sizes="48px" 
                            />
                          ) : (
                            <ShoppingBag className="w-5 h-5 m-auto text-gray-400" />
                          )}
                          {isItemOOS && (
                            <div className="absolute inset-0 bg-[#171717]/75 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="text-[8px] font-black text-white uppercase tracking-tighter">OOS</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-gray-900 truncate">{item.name}</h4>
                          {item.variantName && (
                            <p className="text-[10px] text-gray-500 font-medium">{item.variantName}</p>
                          )}
                          <p className="text-[11px] text-gray-500 font-medium">Qty: {item.quantity}</p>
                          {isItemOOS ? (
                            <span className="inline-block mt-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#171717] text-white tracking-wider border border-white/20">
                              OUT OF STOCK
                            </span>
                          ) : isItemOver ? (
                            <span className="inline-block mt-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Only {item.stockCount} in stock
                            </span>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xs text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Package Shipping Line */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Package Delivery</span>
                  <span className={`font-bold ${pkg.deliveryFee === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {pkg.deliveryFee === 0 ? 'FREE (Included)' : `+${formatPrice(pkg.deliveryFee)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Step 5: Price Breakdown */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm space-y-3 text-xs">
          <h2 className="font-bold text-gray-900 text-sm">Payment Breakdown</h2>
          
          <div className="flex justify-between text-gray-600">
            <span>Items Subtotal</span>
            <span className="font-semibold text-gray-900">{formatPrice(itemsSubtotal)}</span>
          </div>

          <div className="flex justify-between text-gray-600">
            <div>
              <span>Delivery Fee ({storePackages.length} {storePackages.length === 1 ? 'Store Package' : 'Store Packages'})</span>
              {storePackages.length > 1 && blendedDistanceKm > 0 && (
                <span className="block text-[10px] text-emerald-600 font-medium">
                  Blended Avg Distance: {blendedDistanceKm} km
                </span>
              )}
            </div>
            <span className={`font-semibold ${deliveryFee === 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
              {deliveryFee === 0 ? 'FREE' : `+${formatPrice(deliveryFee)}`}
            </span>
          </div>

          {multiStoreSavings > 0 && (
            <div className="flex justify-between text-emerald-700 bg-emerald-50/80 px-2.5 py-1.5 rounded-xl border border-emerald-200 text-[11px] font-bold">
              <span>Multi-Store Combined Shipping Savings</span>
              <span>-{formatPrice(multiStoreSavings)}</span>
            </div>
          )}

          <div className="flex justify-between text-gray-600">
            <span>Platform Convenience Fee (1.5%)</span>
            <span className="font-semibold text-gray-900">+{formatPrice(platformFee)}</span>
          </div>

          {prepaidDiscount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Prepaid Discount (5%)</span>
              <span className="font-bold">-{formatPrice(prepaidDiscount)}</span>
            </div>
          )}

          {codFee > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>COD Handling Charge</span>
              <span className="font-semibold text-gray-900">+{formatPrice(codFee)}</span>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm font-black text-gray-900">
            <span>Grand Total</span>
            <span className="text-base text-[#FF5A36]">{formatPrice(grandTotal)}</span>
          </div>
        </section>

      </main>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-xl z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="block text-[11px] text-gray-500 font-medium">Total Amount</span>
            <span className="text-lg font-black text-gray-900">
              {formatPrice(grandTotal)}
            </span>
          </div>

          <Button
            onClick={handlePlaceOrder}
            disabled={isProcessing || isCreatingOrder || isCreatingPayment || isVerifyingPayment || hasStockShortage || orderItems.length === 0}
            className={`flex-1 max-w-xs h-12 rounded-xl text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 ${
              hasStockShortage 
                ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-[#FF6B00] hover:bg-[#ff7a1f]'
            }`}
          >
            {isProcessing || isCreatingOrder || isCreatingPayment ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : hasStockShortage ? (
              <span>Fix Stock to Place Order</span>
            ) : paymentMethod === 'ONLINE' ? (
              <>
                <span>Pay via Razorpay</span>
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Place COD Order</span>
                <Check className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Add Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Add New Delivery Address</h3>
              <button 
                onClick={() => setIsAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newAddressForm.name}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl focus:border-[#FF6B00] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={newAddressForm.phone}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl focus:border-[#FF6B00] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">House / Flat / Street *</label>
                <input
                  type="text"
                  required
                  value={newAddressForm.addressLine1}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine1: e.target.value })}
                  placeholder="e.g. Flat 302, Green Avenue"
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl focus:border-[#FF6B00] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Landmark / Area (Optional)</label>
                <input
                  type="text"
                  value={newAddressForm.addressLine2}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine2: e.target.value })}
                  placeholder="e.g. Near City Center Mall"
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl focus:border-[#FF6B00] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.city}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl focus:border-[#FF6B00] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.state}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl focus:border-[#FF6B00] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.pincode}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value })}
                    placeholder="e.g. 400001"
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl focus:border-[#FF6B00] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Address Type</label>
                  <select
                    value={newAddressForm.type}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, type: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-200 rounded-xl focus:border-[#FF6B00] outline-none bg-white"
                  >
                    <option value="HOME">Home</option>
                    <option value="WORK">Work / Office</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="flex-1 h-11 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isAddingAddress}
                  className="flex-1 h-11 rounded-xl bg-[#FF6B00] hover:bg-[#ff7a1f] text-white font-bold"
                >
                  {isAddingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
