'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Filter, 
  PlusCircle, 
  MoreVertical, 
  Star, 
  Package, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2 
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { 
  useGetMyStoreQuery, 
  useGetStoreProductsQuery, 
  useGetStoreCategoriesQuery,
  useUpdateProductMutation,
  useDeleteProductMutation
} from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';

export default function MyProductsPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Action Menu State
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  // Mutations
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  // Fetch real data
  const { data: storeData } = useGetMyStoreQuery();
  const { data: products = [], isLoading: isLoadingProducts } = useGetStoreProductsQuery(
    storeData?.id ? { storeId: storeData.id, isOwner: true } : '',
    { skip: !storeData?.id }
  );
  const { data: categories = [], isLoading: isLoadingCategories } = useGetStoreCategoriesQuery(storeData?.id ?? '', {
    skip: !storeData?.id,
  });

  // Close open menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpenId(null);
        if (!isDeleting) setProductToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleting]);

  // Toggle Active / Inactive
  const handleToggleActive = async (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setTogglingProductId(product.id);
    const targetState = !product.isActive;
    try {
      await updateProduct({
        productId: product.id,
        body: { isActive: targetState }
      }).unwrap();
      toast.success(targetState ? `"${product.name}" is now Active` : `"${product.name}" is now Inactive`);
    } catch (err: any) {
      console.error('Failed to toggle product status:', err);
      toast.error(err?.data?.message || 'Failed to update product status');
    } finally {
      setTogglingProductId(null);
    }
  };

  // Delete Product
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id).unwrap();
      toast.success(`"${productToDelete.name}" deleted successfully`);
      setProductToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      toast.error(err?.data?.message || 'Failed to delete product');
    }
  };

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchesSearch = 
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white pb-24">
      {/* Top Header */}
      <SellerHeader 
        title="Products" 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        rightAction={<PlusCircle className="w-6 h-6" onClick={() => router.push('/seller/products/add')} />}
      />

      {/* Category Tags & Filter */}
      <div className="bg-white border-b border-[#E5E2DC] flex items-center justify-between px-4">
        <div className="flex overflow-x-auto no-scrollbar py-3 gap-6 flex-1">
          {/* Always show All tab */}
          <button
            onClick={() => setActiveCategory('all')}
            className={`text-sm font-semibold whitespace-nowrap transition-colors px-5 py-1.5 rounded-full ${
              activeCategory === 'all' 
                ? 'bg-brand-navy text-white' 
                : 'text-[#6B6B6B] bg-transparent'
            }`}
          >
            All
          </button>
          
          {categories.map((category: any) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`text-sm font-semibold whitespace-nowrap transition-colors px-5 py-1.5 rounded-full ${
                activeCategory === category.id 
                  ? 'bg-brand-navy text-white' 
                  : 'text-[#6B6B6B] bg-transparent'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        <button className="p-2 ml-2 bg-[#F9F9F9] rounded-full text-[#171717] hover:bg-gray-200 transition-colors shrink-0">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Product List */}
      <div className="flex-1 bg-white">
        {isLoadingProducts ? (
          <div className="flex items-center justify-center h-48">
             <div className="w-8 h-8 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {filteredProducts.map((product: any, idx: number) => {
              const primaryMedia = product.media?.find((m: any) => m.isPrimary) || product.media?.[0];
              const imageUrl = primaryMedia?.url || product.imageUrl || '';
              const stock = product.stockCount ?? 0;
              const isMenuOpen = menuOpenId === product.id;
              
              return (
                <div 
                  key={product.id} 
                  className={`p-4 flex gap-4 transition-colors relative ${idx !== filteredProducts.length - 1 ? 'border-b border-[#F2EFE9]' : ''} hover:bg-gray-50/50 cursor-pointer`}
                  onClick={() => router.push(`/seller/products/${product.id}`)}
                >
                  {/* Image */}
                  <div className="w-24 h-24 bg-[#F2EFE9] rounded-2xl overflow-hidden relative shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                      <Image 
                        src={imageUrl} 
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-gray-400 stroke-[1.5]" />
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-[#171717] text-[15px] leading-tight line-clamp-2">
                          {product.name}
                        </h3>

                        {/* Three Dots Menu Container */}
                        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button 
                            type="button"
                            aria-label="Product options"
                            disabled={togglingProductId === product.id}
                            className={`p-1.5 -mr-1.5 -mt-1 rounded-full transition-all ${
                              isMenuOpen 
                                ? 'bg-gray-100 text-gray-900 ring-2 ring-gray-200' 
                                : 'text-[#6B6B6B] hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(isMenuOpen ? null : product.id);
                            }}
                          >
                            {togglingProductId === product.id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-brand-navy" />
                            ) : (
                              <MoreVertical className="w-5 h-5" />
                            )}
                          </button>

                          {/* Popover Action Menu */}
                          {isMenuOpen && (
                            <>
                              {/* Invisible Backdrop to close on outside tap */}
                              <div 
                                className="fixed inset-0 z-30" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(null);
                                }} 
                              />
                              
                              <div 
                                className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.14)] border border-gray-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Edit Product */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenId(null);
                                    router.push(`/seller/products/${product.id}/edit`);
                                  }}
                                  className="w-full px-3.5 py-2.5 text-left text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2.5 transition-colors"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                                    <Edit3 className="w-4 h-4" />
                                  </div>
                                  <span>Edit Product</span>
                                </button>

                                {/* Toggle Active / Inactive */}
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleActive(e, product)}
                                  className="w-full px-3.5 py-2.5 text-left text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2.5 transition-colors"
                                >
                                  {product.isActive ? (
                                    <>
                                      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                        <EyeOff className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="leading-tight">Mark Inactive</span>
                                        <span className="text-[10px] text-gray-400 font-normal">Hide from buyers</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                        <Eye className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <span className="leading-tight text-emerald-700 font-semibold">Mark Active</span>
                                        <span className="text-[10px] text-gray-400 font-normal">Show in store</span>
                                      </div>
                                    </>
                                  )}
                                </button>

                                <div className="h-px bg-gray-100 my-1" />

                                {/* Delete Product */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenId(null);
                                    setProductToDelete(product);
                                  }}
                                  className="w-full px-3.5 py-2.5 text-left text-[13px] font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-rose-100/70 flex items-center justify-center text-rose-600 shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                  </div>
                                  <span>Delete Product</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-[#6B6B6B] mt-1 uppercase tracking-wider font-medium">SKU: {product.sku || 'N/A'}</p>
                    </div>
                    
                    <div className="font-bold text-[#171717] text-lg mt-1">
                      {formatPrice(product.sellingPrice || 0)}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 flex-wrap gap-1.5">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <span className="text-[#6B6B6B]">Stock: {stock}</span>
                        {product.avgRating && product.avgRating > 0 ? (
                          <div className="flex items-center gap-1 text-[#6B6B6B]">
                            <Star className="w-3.5 h-3.5 stroke-[2.5] fill-amber-400 text-amber-400" />
                            <span>{Number(product.avgRating).toFixed(1)}</span>
                          </div>
                        ) : null}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {product.verificationStatus === 'APPROVED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verified
                          </span>
                        ) : product.verificationStatus === 'REJECTED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Needs Revision
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Review
                          </span>
                        )}

                        <span className={`text-[11px] font-bold ${
                          product.isActive 
                            ? stock > 10 ? 'text-green-600' : 'text-orange-600' 
                            : 'text-gray-400'
                        }`}>
                          {!product.isActive ? 'Inactive' : stock > 10 ? 'Active' : stock > 0 ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900">No products found</h3>
                <p className="text-sm text-gray-500 mt-1">Try adjusting your category or search filters, or add a new product.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isDeleting && setProductToDelete(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center mb-1.5">
              Delete Product?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-gray-800">"{productToDelete.name}"</span>? This product will be archived and hidden from your store.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
