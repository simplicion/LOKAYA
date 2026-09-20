'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  Image as ImageIcon, 
  Trash2, 
  Star, 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  Sparkles, 
  Truck, 
  ShoppingBag, 
  Tag, 
  X,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  useGetProductByIdQuery, 
  useUpdateProductMutation, 
  useUploadMediaMutation, 
  useGetStoreCategoriesQuery,
  useGetPresignedUrlMutation 
} from '@/lib/api';
import { toast } from 'sonner';
import { cn, getMediaUrl, generateStandardSku } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';

interface MediaItem {
  id?: string;
  url: string;
  type?: 'IMAGE' | 'VIDEO';
  isPrimary?: boolean;
  displayOrder?: number;
}

export default function EditProductClient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currencySymbol } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: productData, isLoading, refetch } = useGetProductByIdQuery(params.id);
  const [updateProduct, { isLoading: isSaving }] = useUpdateProductMutation();
  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();

  const storeId = productData?.storeId || '';
  const { data: categories = [] } = useGetStoreCategoriesQuery(storeId, {
    skip: !storeId
  });

  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [mrp, setMrp] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [isAvailableForDelivery, setIsAvailableForDelivery] = useState(true);
  const [isAvailableForPickup, setIsAvailableForPickup] = useState(true);
  const [isDeliveryIncluded, setIsDeliveryIncluded] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);

  // Initialize from productData
  useEffect(() => {
    if (productData) {
      setName(productData.name || '');
      setCategory(productData.categoryModel?.name || productData.category || '');
      setSelectedCategoryId(productData.categoryId || '');
      setBrand(productData.brand || '');
      setDescription(productData.description || '');
      setSku(productData.sku || generateStandardSku());
      setMrp(productData.mrp ?? '');
      setPrice(productData.sellingPrice ?? '');
      setCostPrice(productData.costPrice ?? '');
      setStock(productData.stockCount ?? '');
      setIsAvailableForDelivery(productData.isAvailableForDelivery ?? true);
      setIsAvailableForPickup(productData.isAvailableForPickup ?? true);
      setIsDeliveryIncluded(productData.isDeliveryIncluded ?? false);

      // Handle media list
      let initialMedia: MediaItem[] = [];
      if (productData.media && Array.isArray(productData.media) && productData.media.length > 0) {
        initialMedia = productData.media.map((m: any, idx: number) => ({
          id: m.id,
          url: m.url,
          type: m.type || 'IMAGE',
          isPrimary: m.isPrimary ?? idx === 0,
          displayOrder: m.displayOrder ?? idx,
        }));
      } else if (productData.imageUrl) {
        initialMedia = [{
          url: productData.imageUrl,
          type: 'IMAGE',
          isPrimary: true,
          displayOrder: 0
        }];
      }
      setMediaList(initialMedia);
    }
  }, [productData]);

  // Sync category dropdown vs custom
  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId) {
      const match = categories.find((c: any) => c.id === selectedCategoryId);
      if (match) {
        setCategory(match.name);
        setIsCustomCategory(false);
      }
    }
  }, [categories, selectedCategoryId]);

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newMediaItems: MediaItem[] = [...mediaList];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let finalUrl = '';
        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await uploadMedia(formData).unwrap();
          finalUrl = getMediaUrl(res.publicUrl || res.url);
        } catch (directErr) {
          console.warn('Fallback to presigned upload:', directErr);
          const presigned = await getPresignedUrl({
            contentType: file.type,
            filename: file.name
          }).unwrap();

          const targetUrl = presigned.uploadUrl || presigned.signedUrl;
          if (!targetUrl) throw new Error('No upload URL returned');

          const uploadRes = await fetch(targetUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
          });

          if (!uploadRes.ok) throw new Error('Upload failed');
          finalUrl = getMediaUrl(presigned.publicUrl || (presigned.fileKey ? `/media/view?key=${encodeURIComponent(presigned.fileKey)}` : ''));
        }

        if (finalUrl) {
          const isFirst = newMediaItems.length === 0;
          newMediaItems.push({
            url: finalUrl,
            type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
            isPrimary: isFirst,
            displayOrder: newMediaItems.length
          });
        }
      } catch (err: any) {
        console.error('File upload error:', err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setMediaList(newMediaItems);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Photos uploaded');
  };

  const handleSetPrimary = (index: number) => {
    const updated = mediaList.map((m, idx) => ({
      ...m,
      isPrimary: idx === index
    }));
    setMediaList(updated);
    toast.info('Cover photo updated');
  };

  const handleRemoveMedia = (index: number) => {
    const wasPrimary = mediaList[index]?.isPrimary;
    const filtered = mediaList.filter((_, idx) => idx !== index);
    if (wasPrimary && filtered.length > 0) {
      filtered[0].isPrimary = true;
    }
    setMediaList(filtered);
  };

  // Discount and Profit Margin calculation
  const numericMrp = Number(mrp) || 0;
  const numericPrice = Number(price) || 0;
  const numericCostPrice = costPrice !== '' ? Number(costPrice) : undefined;
  const discountPercent = numericMrp > 0 && numericPrice > 0 && numericMrp > numericPrice
    ? Math.round(((numericMrp - numericPrice) / numericMrp) * 100)
    : 0;
  const estProfitMargin = numericCostPrice !== undefined ? Math.max(0, numericPrice - numericCostPrice) : (numericPrice > 0 ? numericPrice * 0.20 : 0);
  const platformFeeFromMargin = Math.round(estProfitMargin * 0.05 * 100) / 100;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (numericPrice < 0 || numericMrp < 0) {
      toast.error('Prices cannot be negative');
      return;
    }

    if (numericMrp > 0 && numericPrice > numericMrp) {
      toast.error('Selling price cannot exceed MRP');
      return;
    }

    try {
      const primaryMedia = mediaList.find(m => m.isPrimary) || mediaList[0];
      const payload: any = {
        name: name.trim(),
        category: category.trim() || undefined,
        categoryId: selectedCategoryId || undefined,
        brand: brand.trim() || undefined,
        description: description.trim() || undefined,
        sku: sku.trim() || undefined,
        mrp: numericMrp,
        sellingPrice: numericPrice,
        costPrice: costPrice !== '' ? Number(costPrice) : undefined,
        stockCount: Number(stock) || 0,
        imageUrl: primaryMedia?.url || null,
        isAvailableForDelivery,
        isAvailableForPickup,
        isDeliveryIncluded,
        media: mediaList.map((m, idx) => ({
          url: m.url,
          type: m.type || 'IMAGE',
          isPrimary: m.isPrimary || idx === 0,
          displayOrder: idx
        }))
      };

      await updateProduct({
        productId: params.id,
        body: payload
      }).unwrap();

      setSaved(true);
      toast.success('Product updated successfully!');
      setTimeout(() => {
        router.back();
      }, 1400);
    } catch (err: any) {
      console.error('Failed to update product:', err);
      toast.error(err?.data?.message || err?.message || 'Failed to update product');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] bg-white items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex flex-col h-[100dvh] bg-white items-center justify-center p-6 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Updated Successfully!</h2>
        <p className="text-sm text-gray-600 max-w-sm">
          Your changes to <strong>{name}</strong> have been saved to your catalog.
        </p>
      </div>
    );
  }

  const verificationStatus = productData?.verificationStatus || (productData?.isVerified ? 'APPROVED' : 'PENDING');
  const rejectionReason = productData?.rejectionReason;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#F8F9FA] pb-32">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-20 border-b border-gray-100 shadow-2xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Edit Product</h1>
            <p className="text-[11px] text-gray-500">Manage photos, pricing & specifications</p>
          </div>
        </div>

        {/* Verification Status Pill */}
        <div>
          {verificationStatus === 'APPROVED' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live & Verified</span>
            </span>
          )}
          {verificationStatus === 'PENDING' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>In Review</span>
            </span>
          )}
          {verificationStatus === 'REJECTED' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Needs Revision</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Form Content */}
      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
        
        {/* Rejection / Pending Warning Alert */}
        {verificationStatus === 'REJECTED' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-rose-900 mb-0.5">Verification Feedback from Admin</h4>
              <p className="text-rose-700 leading-relaxed">
                {rejectionReason || 'Please review your product details, images, and pricing to match marketplace guidelines.'}
              </p>
            </div>
          </div>
        )}

        {verificationStatus === 'PENDING' && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              This product is currently in review. You can make additional updates anytime.
            </p>
          </div>
        )}

        {/* Section 1: Product Photos */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#FF5A36]" />
                Product Photos ({mediaList.length})
              </h3>
              <p className="text-xs text-gray-500">Tap a photo to set it as the cover image</p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 text-[#FF5A36] hover:bg-orange-100 transition-all cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Add Photos
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              multiple 
              className="hidden" 
            />
          </div>

          {/* Photos Grid / Horizontal Scroll */}
          {mediaList.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {mediaList.map((media, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group bg-gray-100",
                    media.isPrimary ? "border-[#FF5A36] ring-2 ring-orange-400/30" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <img 
                    src={getMediaUrl(media.url)} 
                    alt={`Product photo ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />

                  {/* Primary Cover Badge */}
                  {media.isPrimary ? (
                    <div className="absolute top-1.5 left-1.5 bg-[#FF5A36] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                      Cover
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      className="absolute top-1.5 left-1.5 bg-black/60 hover:bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Set as Cover"
                    >
                      Make Cover
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(index)}
                    className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full transition-colors cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add Photo Tile */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#FF5A36] hover:bg-orange-50/50 flex flex-col items-center justify-center gap-1 transition-all text-gray-400 hover:text-[#FF5A36] cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#FF5A36]" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px] font-bold">Upload</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-[#FF5A36] rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors bg-gray-50/50"
            >
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-[#FF5A36]">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Upload Product Photos</p>
                <p className="text-xs text-gray-500">PNG, JPG or WebP. High resolution recommended.</p>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Basic Information */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3.5">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
            Basic Information
          </h3>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pure Cotton Handloom Saree"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:bg-white transition-all"
            />
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700">Category</label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-xs font-semibold text-[#FF5A36] hover:underline cursor-pointer"
              >
                {isCustomCategory ? 'Select from Store Categories' : '+ Custom Category'}
              </button>
            </div>

            {isCustomCategory ? (
              <input 
                type="text" 
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSelectedCategoryId('');
                }}
                placeholder="Enter custom category (e.g. Traditional Wear)"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:bg-white transition-all"
              />
            ) : (
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCategoryId(val);
                  const matched = categories.find((c: any) => c.id === val);
                  if (matched) setCategory(matched.name);
                }}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:bg-white transition-all"
              >
                <option value="">Select a Category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Brand & SKU */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Brand Name</label>
              <input 
                type="text" 
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Lokaya Artisan"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:bg-white transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">SKU / Item Code</label>
                <button
                  type="button"
                  onClick={() => setSku(generateStandardSku())}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-blue-50"
                  title="Generate standard 8-digit SKU"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  Auto-generate
                </button>
              </div>
              <input 
                type="text" 
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. LKY-84920153"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Product Description</label>
            <textarea 
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the materials, size measurements, care instructions, origin, etc..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Section 3: Pricing & Inventory */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-sm font-bold text-gray-900">Pricing & Inventory</h3>
            {discountPercent > 0 && (
              <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Selling Price ({currencySymbol}) <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="1500"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#FF5A36] focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Cost Price ({currencySymbol})
              </label>
              <input 
                type="number" 
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="1000"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:bg-white transition-all"
              />
              <p className="text-[10px] text-gray-400 mt-1">For 5% profit margin fee</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">MRP ({currencySymbol})</label>
              <input 
                type="number" 
                value={mrp}
                onChange={(e) => setMrp(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="2000"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Profit Margin & Platform Commission Tooltip Card */}
          {numericPrice > 0 && (
            <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-gray-800">Est. Merchant Margin: </span>
                <span className="font-extrabold text-emerald-600">
                  {currencySymbol}{estProfitMargin.toFixed(2)}
                </span>
                {costPrice === '' && <span className="text-[10px] text-gray-500 ml-1">(assumed 20%)</span>}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-gray-500">Platform Cut (5% Margin): </span>
                <span className="font-bold text-[#FF5A36]">{currencySymbol}{platformFeeFromMargin.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Stock Count */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Available Stock Count</label>
            <input 
              type="number" 
              value={stock}
              onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 50"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FF5A36] focus:bg-white transition-all"
            />
            <p className="text-[11px] text-gray-400 mt-1">Set to 0 to mark as Sold Out.</p>
          </div>
        </div>

        {/* Section 4: Fulfillment & Delivery Options */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
            Fulfillment Availability
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsAvailableForDelivery(!isAvailableForDelivery)}
              className={cn(
                "p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer",
                isAvailableForDelivery
                  ? "border-blue-300 bg-blue-50/60 text-blue-900"
                  : "border-gray-200 bg-gray-50 text-gray-400 opacity-60"
              )}
            >
              <Truck className={cn("w-4 h-4 shrink-0 mt-0.5", isAvailableForDelivery ? "text-blue-600" : "text-gray-400")} />
              <div>
                <span className="block text-xs font-bold">Delivery</span>
                <span className="text-[10px] opacity-80">Courier shipping</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsAvailableForPickup(!isAvailableForPickup)}
              className={cn(
                "p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer",
                isAvailableForPickup
                  ? "border-purple-300 bg-purple-50/60 text-purple-900"
                  : "border-gray-200 bg-gray-50 text-gray-400 opacity-60"
              )}
            >
              <ShoppingBag className={cn("w-4 h-4 shrink-0 mt-0.5", isAvailableForPickup ? "text-purple-600" : "text-gray-400")} />
              <div>
                <span className="block text-xs font-bold">In-Store Pickup</span>
                <span className="text-[10px] opacity-80">Counter collection</span>
              </div>
            </button>
          </div>

          {/* Free Delivery Toggle */}
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200 cursor-pointer">
              <div>
                <p className="font-bold text-xs text-gray-900">Free Delivery by Store</p>
                <p className="text-[11px] text-gray-500">Store covers the shipping cost for the customer</p>
              </div>
              <input 
                type="checkbox" 
                checked={isDeliveryIncluded}
                onChange={(e) => setIsDeliveryIncluded(e.target.checked)}
                className="w-4 h-4 accent-[#FF5A36] rounded cursor-pointer" 
              />
            </label>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button 
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
            className="h-12 px-5 rounded-xl text-sm font-semibold border-gray-200 text-gray-700"
          >
            Cancel
          </Button>

          <Button 
            type="button"
            className="flex-1 h-12 bg-[#FF5A36] hover:bg-[#e04d2d] text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
