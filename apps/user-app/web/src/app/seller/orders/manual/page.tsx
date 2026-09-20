'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CheckCircle2, 
  Loader2, 
  Tag, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Printer, 
  Share2, 
  User, 
  Phone, 
  Mail, 
  FileText,
  Package,
  Layers,
  Sparkles,
  X,
  Store as StoreIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  useGetMyStoreQuery, 
  useGetStoreProductsQuery, 
  useGetStoreCategoriesQuery,
  useCreateManualOrderMutation 
} from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { toast } from 'sonner';

interface CartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  variantName?: string | null;
  sku: string;
  price: number;
  quantity: number;
  stockCount: number;
  image?: string | null;
}

export default function ManualOrderBookingPage() {
  const router = useRouter();
  const { formatPrice, currencySymbol } = useCurrency();

  // Search & Filters for bulk catalog (100-200+ products)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Active POS Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Customer Information (All Optional)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Mode & Discount
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'COD'>('CASH');
  const [discountInput, setDiscountInput] = useState<string>('0');

  // Success State
  const [createdOrderData, setCreatedOrderData] = useState<{
    orderId: string;
    invoiceNumber: string;
    totalAmount: number;
    customerName?: string;
  } | null>(null);

  // Mobile POS Register Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // API Queries & Mutations
  const { data: storeData, isLoading: isLoadingStore } = useGetMyStoreQuery();
  const storeId = storeData?.id || '';

  const { data: rawProducts = [], isLoading: isLoadingProducts } = useGetStoreProductsQuery(
    storeId ? { storeId, isOwner: true } : '',
    { skip: !storeId }
  );

  const { data: categories = [] } = useGetStoreCategoriesQuery(storeId, {
    skip: !storeId
  });

  const [createManualOrder, { isLoading: isSubmitting }] = useCreateManualOrderMutation();

  // Filter Catalog
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((product: any) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (product.name && product.name.toLowerCase().includes(q)) ||
        (product.sku && product.sku.toLowerCase().includes(q)) ||
        (product.variants && product.variants.some((v: any) => v.name?.toLowerCase().includes(q) || v.sku?.toLowerCase().includes(q)));

      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [rawProducts, searchQuery, selectedCategory]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    const val = parseFloat(discountInput) || 0;
    return Math.min(Math.max(0, val), subtotal);
  }, [discountInput, subtotal]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const totalItemsCount = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + it.quantity, 0);
  }, [cartItems]);

  // Add Item to Bill
  const handleAddToCart = (product: any, variant?: any) => {
    const productId = product.id;
    const variantId = variant?.id || null;
    const itemKey = `${productId}_${variantId || 'base'}`;

    const existingIndex = cartItems.findIndex(
      (it) => it.productId === productId && (it.variantId || null) === variantId
    );

    const availableStock = variant ? (variant.stockCount ?? 0) : (product.stockCount ?? 0);
    const price = variant ? Number(variant.price) : Number(product.sellingPrice || 0);
    const sku = variant ? variant.sku : product.sku;
    const name = product.name;
    const variantName = variant ? variant.name : null;
    const primaryMedia = product.media?.find((m: any) => m.isPrimary)?.url || product.media?.[0]?.url || product.imageUrl || null;

    if (existingIndex > -1) {
      const existing = cartItems[existingIndex];
      if (existing.quantity >= availableStock) {
        toast.error(`Cannot add more than available stock (${availableStock} in stock)`);
        return;
      }
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      if (availableStock <= 0) {
        toast.error(`Item is out of stock!`);
        return;
      }
      setCartItems((prev) => [
        ...prev,
        {
          productId,
          variantId,
          name,
          variantName,
          sku,
          price,
          quantity: 1,
          stockCount: availableStock,
          image: primaryMedia
        }
      ]);
    }
  };

  // Adjust Cart Quantity
  const handleUpdateQuantity = (productId: string, variantId: string | null | undefined, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((it) => {
          if (it.productId === productId && (it.variantId || null) === (variantId || null)) {
            const nextQty = it.quantity + delta;
            if (nextQty > it.stockCount) {
              toast.error(`Only ${it.stockCount} items available in stock`);
              return it;
            }
            return { ...it, quantity: nextQty };
          }
          return it;
        })
        .filter((it) => it.quantity > 0);
    });
  };

  // Remove Item
  const handleRemoveItem = (productId: string, variantId: string | null | undefined) => {
    setCartItems((prev) =>
      prev.filter((it) => !(it.productId === productId && (it.variantId || null) === (variantId || null)))
    );
  };

  // Submit Sale & Create Order
  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      toast.error('Please add at least one product to the bill');
      return;
    }

    if (!storeId) {
      toast.error('Store information not loaded');
      return;
    }

    try {
      const payload = {
        storeId,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        paymentMethod,
        discountAmount,
        notes: notes.trim() || undefined,
        items: cartItems.map((it) => ({
          productId: it.productId,
          variantId: it.variantId || undefined,
          quantity: it.quantity,
          customPrice: it.price
        }))
      };

      const result = await createManualOrder(payload).unwrap();

      toast.success('Sale completed! Tax Invoice generated.');
      setCreatedOrderData({
        orderId: result.orderId,
        invoiceNumber: result.invoiceNumber,
        totalAmount: result.totalAmount,
        customerName: customerName.trim() || 'Walk-in Customer'
      });
      setIsDrawerOpen(false);
    } catch (err: any) {
      console.error('Failed to create manual order:', err);
      toast.error(err?.data?.message || err?.message || 'Failed to complete sale');
    }
  };

  // Reset Form for New Sale
  const handleStartNewSale = () => {
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setNotes('');
    setDiscountInput('0');
    setPaymentMethod('CASH');
    setCreatedOrderData(null);
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF9F6] pb-32 flex flex-col">
      
      {/* Top Navigation Header */}
      <div className="bg-white border-b border-[#E5E2DC] sticky top-0 z-20 px-4 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                  Book Manual Order
                </h1>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded-md uppercase">
                  POS Counter
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Record in-store & walk-in sales with live inventory sync
              </p>
            </div>
          </div>

          {/* Quick Clear / Reset */}
          {cartItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartNewSale}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 h-8 rounded-lg"
            >
              Clear Bill ({totalItemsCount})
            </Button>
          )}

        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="max-w-7xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Column: Fast Product Search & Catalog (Bulk 100-200+ Products Ready) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Fast Search Input */}
          <div className="bg-white p-3 rounded-2xl border border-[#E5E2DC] shadow-sm flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400 shrink-0 ml-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 100+ products by name, SKU, or variant..."
              className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-gray-400 font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === 'all'
                  ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                  : 'bg-white text-gray-600 border-[#E5E2DC] hover:border-gray-400'
              }`}
            >
              All Items ({rawProducts.length})
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                    : 'bg-white text-gray-600 border-[#E5E2DC] hover:border-gray-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {isLoadingProducts ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#E5E2DC]">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36] mb-2" />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Loading Inventory Catalog...
              </p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredProducts.map((product: any) => {
                const primaryMedia = product.media?.find((m: any) => m.isPrimary)?.url || product.media?.[0]?.url || product.imageUrl || null;
                const hasVariants = product.variants && product.variants.length > 0;
                const stock = product.stockCount ?? 0;
                const price = product.sellingPrice ?? 0;

                return (
                  <div 
                    key={product.id}
                    className="bg-white rounded-2xl border border-[#E5E2DC] p-3.5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    {/* Top Info */}
                    <div className="flex gap-3">
                      {/* 1st Product Image */}
                      <div className="w-16 h-16 rounded-xl bg-[#FAF9F6] border border-[#E5E2DC] relative overflow-hidden shrink-0 flex items-center justify-center">
                        {primaryMedia ? (
                          <Image 
                            src={primaryMedia} 
                            alt={product.name} 
                            fill 
                            className="object-cover" 
                            sizes="64px"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-300" />
                        )}
                      </div>

                      {/* Title & SKU */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="font-mono text-[10px] text-gray-500 font-semibold mt-0.5">
                          SKU: {product.sku}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-black text-[#FF5A36]">
                            {formatPrice(price)}
                          </span>
                          {/* Stock Indicator */}
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            stock > 5 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : stock > 0
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Variant Picker (If Variants Exist) */}
                    {hasVariants ? (
                      <div className="space-y-1.5 pt-2 border-t border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Select Variant:
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {product.variants.map((v: any) => {
                            const inCart = cartItems.find(
                              (it) => it.productId === product.id && it.variantId === v.id
                            );
                            const vStock = v.stockCount ?? 0;

                            return (
                              <div 
                                key={v.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                              >
                                <div>
                                  <span className="font-bold text-gray-800">{v.name}</span>
                                  <span className="text-gray-500 text-[11px] ml-1.5">({vStock} left)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-gray-900">{formatPrice(v.price)}</span>
                                  {inCart ? (
                                    <div className="flex items-center bg-white border border-[#171717] rounded-lg overflow-hidden h-7">
                                      <button 
                                        onClick={() => handleUpdateQuantity(product.id, v.id, -1)}
                                        className="px-2 py-1 hover:bg-gray-100 text-gray-700 font-black"
                                      >
                                        -
                                      </button>
                                      <span className="px-2 text-xs font-black">{inCart.quantity}</span>
                                      <button 
                                        onClick={() => handleUpdateQuantity(product.id, v.id, 1)}
                                        className="px-2 py-1 hover:bg-gray-100 text-gray-700 font-black"
                                      >
                                        +
                                      </button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      disabled={vStock <= 0}
                                      onClick={() => handleAddToCart(product, v)}
                                      className="h-7 px-2.5 rounded-lg text-xs font-bold bg-[#171717] text-white hover:bg-black"
                                    >
                                      <Plus className="w-3 h-3 mr-0.5" /> Add
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Single Product Add / Quantity Stepper */
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">
                          Quick Add to Bill
                        </span>
                        {(() => {
                          const inCart = cartItems.find(
                            (it) => it.productId === product.id && !it.variantId
                          );
                          return inCart ? (
                            <div className="flex items-center bg-white border border-[#171717] rounded-xl overflow-hidden h-8">
                              <button 
                                onClick={() => handleUpdateQuantity(product.id, null, -1)}
                                className="px-2.5 py-1 hover:bg-gray-100 text-gray-800 font-black"
                              >
                                -
                              </button>
                              <span className="px-2.5 text-xs font-black text-gray-900">{inCart.quantity}</span>
                              <button 
                                onClick={() => handleUpdateQuantity(product.id, null, 1)}
                                className="px-2.5 py-1 hover:bg-gray-100 text-gray-800 font-black"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              disabled={stock <= 0}
                              onClick={() => handleAddToCart(product)}
                              className="h-8 px-4 rounded-xl text-xs font-bold bg-[#171717] hover:bg-black text-white shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Add to Bill
                            </Button>
                          );
                        })()}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E2DC] p-12 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="font-bold text-gray-900 text-base">No Products Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No inventory items match your search &quot;{searchQuery}&quot;. Check spelling or try a different filter.
              </p>
            </div>
          )}

        </div>

        {/* Right Column: Live POS Bill / Register (Desktop) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-2xl border border-[#E5E2DC] p-5 shadow-sm sticky top-24 space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#FF5A36]" />
                <h2 className="font-black text-gray-900 text-base">POS Bill Slip</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {/* Selected Items List */}
            {cartItems.length > 0 ? (
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 pr-1">
                {cartItems.map((item) => (
                  <div key={`${item.productId}_${item.variantId || 'base'}`} className="py-2.5 flex items-start gap-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-xs leading-snug line-clamp-1">
                        {item.name}
                      </p>
                      {item.variantName && (
                        <p className="text-[10px] text-gray-500 font-medium">
                          Variant: {item.variantName}
                        </p>
                      )}
                      <p className="text-xs font-black text-gray-800 mt-1">
                        {formatPrice(item.price)} × {item.quantity} = {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    {/* Stepper & Remove */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden h-7">
                        <button 
                          onClick={() => handleUpdateQuantity(item.productId, item.variantId, -1)}
                          className="px-2 py-0.5 hover:bg-gray-200 text-gray-700 font-black text-xs"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-black">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.productId, item.variantId, 1)}
                          className="px-2 py-0.5 hover:bg-gray-200 text-gray-700 font-black text-xs"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.productId, item.variantId)}
                        className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center bg-[#FAF9F6] rounded-xl border border-dashed border-gray-200">
                <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-gray-600">Bill is Empty</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Click &quot;Add to Bill&quot; on any product</p>
              </div>
            )}

            {/* Customer Details Form (All Optional) */}
            <div className="space-y-3 pt-3 border-t border-gray-100 text-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Customer Details (Optional)
              </span>

              <div className="space-y-2">
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name (e.g. John Doe)"
                    className="w-full h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-gray-400 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone Number (e.g. 9876543210)"
                    className="w-full h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-gray-400 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email (Auto-sends Tax Invoice)"
                    className="w-full h-8 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-gray-400 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Payment Method
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" /> Cash
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'UPI'
                      ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> UPI / Online
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'CARD'
                      ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Card (POS)
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'COD'
                      ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" /> Pay Later
                </button>
              </div>
            </div>

            {/* Discount & Pricing Summary */}
            <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
              
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Subtotal:</span>
                <span className="font-bold text-gray-900">{formatPrice(subtotal)}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 font-medium">Custom Discount:</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 font-bold">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="w-20 h-7 text-right px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm font-black text-gray-900 uppercase">Grand Total:</span>
                <span className="text-lg font-black text-[#FF5A36]">{formatPrice(grandTotal)}</span>
              </div>

            </div>

            {/* Complete Sale Action */}
            <Button
              onClick={handleCompleteSale}
              disabled={isSubmitting || cartItems.length === 0}
              className="w-full h-12 rounded-xl text-sm font-black bg-[#171717] hover:bg-black text-white shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording Sale & Invoice...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Complete Sale & Generate Invoice
                </>
              )}
            </Button>

          </div>
        </div>

      </div>

      {/* Mobile Floating Cart Summary Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-[#E5E2DC] z-30 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase">Total ({totalItemsCount} items)</span>
          <p className="text-base font-black text-[#FF5A36]">{formatPrice(grandTotal)}</p>
        </div>

        <Button
          onClick={() => setIsDrawerOpen(true)}
          disabled={cartItems.length === 0}
          className="h-11 px-6 rounded-xl font-bold bg-[#171717] text-white flex items-center gap-2 shadow-sm"
        >
          <ShoppingBag className="w-4 h-4" />
          Review Bill ({totalItemsCount})
        </Button>
      </div>

      {/* Mobile POS Bill Modal / Drawer */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-black text-base text-gray-900">Review In-Store Bill</h2>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              
              {/* Selected Items */}
              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => (
                  <div key={`${item.productId}_${item.variantId || 'base'}`} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-xs leading-snug">{item.name}</p>
                      {item.variantName && (
                        <p className="text-[10px] text-gray-500 font-medium">Variant: {item.variantName}</p>
                      )}
                      <p className="text-xs font-black text-gray-800 mt-0.5">{formatPrice(item.price * item.quantity)}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden h-7">
                        <button 
                          onClick={() => handleUpdateQuantity(item.productId, item.variantId, -1)}
                          className="px-2 py-0.5 text-xs font-black"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-black">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.productId, item.variantId, 1)}
                          className="px-2 py-0.5 text-xs font-black"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.productId, item.variantId)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Info (Optional) */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer Details (Optional)</span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email (Sends Tax Invoice Automatically)"
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              {/* Payment Mode */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Payment Method</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-2 rounded-xl border text-xs font-bold ${
                      paymentMethod === 'CASH' ? 'bg-[#171717] text-white' : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-2 rounded-xl border text-xs font-bold ${
                      paymentMethod === 'UPI' ? 'bg-[#171717] text-white' : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    UPI / Online
                  </button>
                </div>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Custom Discount ({currencySymbol}):</span>
                <input
                  type="number"
                  min="0"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="w-24 h-8 text-right px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
                />
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2">
              <div className="flex justify-between items-center text-sm font-black">
                <span>Grand Total:</span>
                <span className="text-[#FF5A36] text-lg">{formatPrice(grandTotal)}</span>
              </div>

              <Button
                onClick={handleCompleteSale}
                disabled={isSubmitting || cartItems.length === 0}
                className="w-full h-12 rounded-xl text-sm font-black bg-[#171717] hover:bg-black text-white shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Complete Sale & Generate Invoice
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Post-Booking Success Modal */}
      {createdOrderData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 text-center">
            
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-black text-gray-900">Sale Recorded Successfully!</h3>
              <p className="text-xs text-gray-500 mt-1">
                Stock has been updated in your inventory and financial ledger.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E2DC] space-y-2 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Number:</span>
                <span className="font-mono font-bold text-gray-900">{createdOrderData.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-bold text-gray-900">{createdOrderData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Mode:</span>
                <span className="font-bold text-emerald-700">{paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 items-baseline">
                <span className="text-sm font-black text-gray-900 uppercase">Amount Paid:</span>
                <span className="text-base font-black text-[#FF5A36]">
                  {formatPrice(createdOrderData.totalAmount)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={() => router.push(`/seller/orders/invoice?id=${createdOrderData.orderId}`)}
                className="w-full h-11 rounded-xl text-xs font-bold bg-[#171717] hover:bg-black text-white flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                View / Print Tax Invoice
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const msg = `Hello ${createdOrderData.customerName || 'Customer'}, thank you for shopping with us at ${storeData?.name || 'our store'}. Your Invoice #${createdOrderData.invoiceNumber} for ${formatPrice(createdOrderData.totalAmount)} has been generated!`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="h-10 rounded-xl text-xs font-bold border-[#E5E2DC] text-emerald-700 hover:bg-emerald-50 flex items-center justify-center gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" /> WhatsApp Receipt
                </Button>

                <Button
                  variant="outline"
                  onClick={handleStartNewSale}
                  className="h-10 rounded-xl text-xs font-bold border-[#E5E2DC] text-gray-800 hover:bg-gray-100 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> New Sale
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
