'use client';

import { useState } from 'react';
import { 
  useGetProductsVerificationQuery, 
  useVerifyProductMutation, 
  useRejectProductMutation 
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  PackageCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Eye, 
  MapPin, 
  Phone, 
  Mail, 
  AlertCircle, 
  Building2, 
  RefreshCw, 
  X, 
  Tag, 
  Truck, 
  ShoppingBag, 
  Package, 
  ExternalLink,
  ChevronRight,
  User
} from 'lucide-react';

export default function ProductVerificationCenter() {
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { 
    data: products = [], 
    isLoading, 
    refetch, 
    isFetching 
  } = useGetProductsVerificationQuery(
    selectedStatus === 'ALL' ? undefined : { status: selectedStatus }
  );

  const [verifyProduct, { isLoading: isVerifying }] = useVerifyProductMutation();
  const [rejectProduct, { isLoading: isRejecting }] = useRejectProductMutation();

  const handleVerify = async (productId: string) => {
    try {
      await verifyProduct(productId).unwrap();
      toast.success('Product verified and published to live store!');
      setSelectedProduct(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to verify product');
    }
  };

  const handleReject = async (productId: string) => {
    try {
      await rejectProduct({ 
        productId, 
        reason: rejectReason.trim() || 'Product details did not meet marketplace quality guidelines.' 
      }).unwrap();
      toast.success('Product submission rejected with feedback');
      setShowRejectModal(false);
      setSelectedProduct(null);
      setRejectReason('');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reject product');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const storeOwner = p.store?.users?.[0]?.user;
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.store?.name && p.store.name.toLowerCase().includes(q)) ||
      (storeOwner?.name && storeOwner.name.toLowerCase().includes(q)) ||
      (storeOwner?.email && storeOwner.email.toLowerCase().includes(q)) ||
      (p.store?.contactPhone && p.store.contactPhone.toLowerCase().includes(q))
    );
  });

  const pendingCount = products.filter((p) => p.verificationStatus === 'PENDING').length;
  const approvedCount = products.filter((p) => p.verificationStatus === 'APPROVED').length;
  const rejectedCount = products.filter((p) => p.verificationStatus === 'REJECTED').length;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Verification Center</h1>
              <p className="text-sm text-gray-500">Review submitted products, verify quality & authenticity, and grant live listing</p>
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()} 
          disabled={isFetching}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'PENDING', label: 'Pending Review', icon: Clock, color: 'text-amber-600' },
            { id: 'APPROVED', label: 'Approved & Live', icon: CheckCircle2, color: 'text-emerald-600' },
            { id: 'REJECTED', label: 'Rejected', icon: XCircle, color: 'text-rose-600' },
            { id: 'ALL', label: 'All Products', icon: Package, color: 'text-gray-600' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search by product, seller, SKU..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Product List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-200">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-semibold text-gray-600">Loading products for verification...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No products found</h3>
          <p className="text-xs text-gray-500 mt-1">
            {selectedStatus === 'PENDING'
              ? 'No products are currently pending verification.'
              : 'Try changing your search or filter options.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const primaryMedia = product.media?.find((m: any) => m.isPrimary) || product.media?.[0];
            const imageUrl = primaryMedia?.url || product.imageUrl || '';
            const storeOwner = product.store?.users?.[0]?.user;
            const discount = product.mrp > product.sellingPrice 
              ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) 
              : 0;

            return (
              <div 
                key={product.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Top Image & Status Banner */}
                  <div className="relative aspect-video bg-gray-100 overflow-hidden border-b border-gray-100">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
                        <Package className="w-8 h-8" />
                        <span className="text-xs">No image</span>
                      </div>
                    )}

                    {/* Media Count Badge */}
                    {product.media && product.media.length > 1 && (
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {product.media.length} photos
                      </div>
                    )}

                    {/* Verification Status Pill */}
                    <div className="absolute top-2 right-2">
                      {product.verificationStatus === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-xs">
                          <CheckCircle2 className="w-3 h-3" /> Live
                        </span>
                      ) : product.verificationStatus === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-xs">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {product.category && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-[#FF5A36] border border-orange-200/60">
                            <Tag className="w-3 h-3" />
                            {product.category}
                          </span>
                        )}
                        {product.sku && (
                          <span className="text-[10px] font-mono font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {product.sku}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2">
                        {product.name}
                      </h3>

                      {product.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Pricing & Stock */}
                    <div className="flex items-baseline justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Selling Price</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-gray-900">₹{product.sellingPrice}</span>
                          {product.mrp > product.sellingPrice && (
                            <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Stock</span>
                        <span className="text-xs font-bold text-gray-800">
                          {product.stockCount} units
                        </span>
                      </div>
                    </div>

                    {/* Store & Seller Info Block */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-950 flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          {product.store?.name || 'Store'}
                        </span>
                        {product.store?.contactPhone && (
                          <a 
                            href={`tel:${product.store.contactPhone}`} 
                            className="text-[11px] font-semibold text-indigo-700 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            {product.store.contactPhone}
                          </a>
                        )}
                      </div>

                      {storeOwner && (
                        <div className="flex items-center gap-1 text-gray-600 text-[11px]">
                          <User className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{storeOwner.name} ({storeOwner.email || storeOwner.phone || 'Owner'})</span>
                        </div>
                      )}

                      {product.store?.address && (
                        <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{product.store.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Rejection Note if already rejected */}
                    {product.verificationStatus === 'REJECTED' && product.rejectionReason && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-700">
                        <span className="font-bold block">Rejection Feedback:</span>
                        <span>{product.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="p-4 pt-0 flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSelectedProduct(product);
                      setActiveImageIndex(0);
                    }}
                    className="flex-1 text-xs gap-1.5 h-9"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect
                  </Button>

                  {product.verificationStatus !== 'APPROVED' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleVerify(product.id)}
                      disabled={isVerifying}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                  )}

                  {product.verificationStatus !== 'REJECTED' && (
                    <Button 
                      variant="outline"
                      size="sm" 
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowRejectModal(true);
                      }}
                      disabled={isRejecting}
                      className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs gap-1 h-9"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Inspection Modal */}
      {selectedProduct && !showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900">Product Verification Inspection</h3>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Media Gallery Preview */}
              {selectedProduct.media && selectedProduct.media.length > 0 ? (
                <div className="space-y-3">
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    <img 
                      src={selectedProduct.media[activeImageIndex]?.url || selectedProduct.imageUrl} 
                      alt="Product inspection preview" 
                      className="w-full h-full object-contain bg-black/5"
                    />
                  </div>

                  {selectedProduct.media.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedProduct.media.map((m: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                            activeImageIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={m.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : selectedProduct.imageUrl ? (
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <img src={selectedProduct.imageUrl} alt="" className="w-full h-full object-contain" />
                </div>
              ) : null}

              {/* Product Specifications */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedProduct.category && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#FF5A36] border border-orange-200">
                      {selectedProduct.category}
                    </span>
                  )}
                  {selectedProduct.brand && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      Brand: {selectedProduct.brand}
                    </span>
                  )}
                  {selectedProduct.sku && (
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      SKU: {selectedProduct.sku}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {selectedProduct.name}
                </h2>

                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-2xl font-black text-gray-900">₹{selectedProduct.sellingPrice}</span>
                  {selectedProduct.mrp > selectedProduct.sellingPrice && (
                    <span className="text-sm text-gray-400 line-through">MRP: ₹{selectedProduct.mrp}</span>
                  )}
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Stock: {selectedProduct.stockCount} units
                  </span>
                </div>

                {selectedProduct.description && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description</h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Seller & Store Credentials */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2 text-xs">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                  Seller & Store Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
                  <p><strong>Store:</strong> {selectedProduct.store?.name}</p>
                  <p><strong>Phone:</strong> {selectedProduct.store?.contactPhone || 'N/A'}</p>
                  <p><strong>Owner:</strong> {selectedProduct.store?.users?.[0]?.user?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedProduct.store?.users?.[0]?.user?.email || 'N/A'}</p>
                  <p className="sm:col-span-2"><strong>Location:</strong> {selectedProduct.store?.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <Button 
                variant="outline" 
                onClick={() => setSelectedProduct(null)}
              >
                Close
              </Button>

              <Button 
                variant="destructive"
                onClick={() => setShowRejectModal(true)}
                disabled={isRejecting}
              >
                Reject Product
              </Button>

              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleVerify(selectedProduct.id)}
                disabled={isVerifying}
              >
                Approve & List Live
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Prompt Modal */}
      {showRejectModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reject Product</h3>
                <p className="text-xs text-gray-500">Provide rejection feedback to the seller</p>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              You are rejecting <strong>{selectedProduct.name}</strong> from store <strong>{selectedProduct.store?.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Reason for Rejection
              </label>
              <textarea 
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Photos are blurry, price exceeds maximum retail price, title contains unsupported characters..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={isRejecting}
              >
                Cancel
              </Button>

              <Button 
                variant="destructive"
                onClick={() => handleReject(selectedProduct.id)}
                disabled={isRejecting}
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
