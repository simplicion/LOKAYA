'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  AlertCircle, 
  Layers, 
  Loader2, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedBottomSheet } from '@/components/ui/AnimatedBottomSheet';
import { toast } from 'sonner';
import { getMediaUrl, cn } from '@/lib/utils';
import { useUploadMediaMutation, useGetPresignedUrlMutation } from '@/lib/api';

export interface VariantItem {
  id?: string;
  name: string;
  sku?: string;
  price: number;
  stockCount: number;
  imageUrl?: string;
  localPreview?: string;
}

interface VariantsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  variants: VariantItem[];
  onChange: (updatedVariants: VariantItem[]) => void;
  parentSku?: string;
  currencySymbol?: string;
  availableImages?: string[];
}

const COMMON_PRESETS = [
  'Small (S)',
  'Medium (M)',
  'Large (L)',
  'XL',
  'XXL',
  'Black',
  'White',
  'Navy Blue',
  'Red',
  'Green',
  '128 GB',
  '256 GB',
  'Pack of 2',
  'Pack of 3'
];

export function VariantsBottomSheet({
  isOpen,
  onClose,
  variants,
  onChange,
  parentSku = 'LKY',
  currencySymbol = '₹',
  availableImages = []
}: VariantsBottomSheetProps) {
  const [localVariants, setLocalVariants] = useState<VariantItem[]>(variants || []);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Editor form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [stockCount, setStockCount] = useState<string>('');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [localPreview, setLocalPreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();

  // Sync external variants with local state
  useEffect(() => {
    setLocalVariants(variants || []);
  }, [variants, isOpen]);

  const openAddVariant = () => {
    setEditingIndex(null);
    setName('');
    setPrice('');
    setStockCount('');
    const nextIndex = localVariants.length + 1;
    setSku(`${parentSku}-V${nextIndex}`);
    setImageUrl('');
    setLocalPreview('');
    setIsEditorOpen(true);
  };

  const openEditVariant = (index: number) => {
    const item = localVariants[index];
    if (!item) return;
    setEditingIndex(index);
    setName(item.name || '');
    setPrice(item.price !== undefined ? String(item.price) : '');
    setStockCount(item.stockCount !== undefined ? String(item.stockCount) : '');
    setSku(item.sku || `${parentSku}-V${index + 1}`);
    setImageUrl(item.imageUrl || '');
    setLocalPreview(item.localPreview || (item.imageUrl ? getMediaUrl(item.imageUrl) : ''));
    setIsEditorOpen(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image size must be under 15MB');
      return;
    }

    // 1. INSTANT OPTIMISTIC UI PREVIEW (0ms latency)
    const blobPreview = URL.createObjectURL(file);
    setLocalPreview(blobPreview);
    setIsUploadingImage(true);

    try {
      let finalUploadedUrl = '';
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadMedia(formData).unwrap();
        finalUploadedUrl = getMediaUrl(res.publicUrl || res.url);
      } catch (err) {
        // Fallback to presigned upload
        const presigned = await getPresignedUrl({
          filename: file.name,
          contentType: file.type
        }).unwrap();
        const targetUrl = presigned.uploadUrl || presigned.signedUrl;
        if (!targetUrl) throw new Error('No upload URL');
        await fetch(targetUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });
        finalUploadedUrl = getMediaUrl(presigned.publicUrl || (presigned.fileKey ? `/media/view?key=${encodeURIComponent(presigned.fileKey)}` : ''));
      }

      if (finalUploadedUrl) {
        setImageUrl(finalUploadedUrl);
      } else {
        setImageUrl(blobPreview);
      }
      toast.success('Variant image uploaded');
    } catch (error) {
      console.warn('Variant image upload failed, using local preview:', error);
      setImageUrl(blobPreview);
      toast.info('Using local preview image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveVariant = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Variant name is required (e.g. Size M, Red, 256GB)');
      return;
    }

    const numPrice = Number(price);
    if (price === '' || isNaN(numPrice) || numPrice < 0) {
      toast.error('Please enter a valid price (>= 0)');
      return;
    }

    const numStock = Number(stockCount);
    if (stockCount === '' || isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      toast.error('Stock quantity is mandatory and must be a whole number (>= 0)');
      return;
    }

    const finalSku = sku.trim() || `${parentSku}-V${(editingIndex !== null ? editingIndex : localVariants.length) + 1}`;

    const newVariant: VariantItem = {
      id: editingIndex !== null ? localVariants[editingIndex]?.id : undefined,
      name: trimmedName,
      price: numPrice,
      stockCount: numStock,
      sku: finalSku,
      imageUrl: imageUrl || undefined,
      localPreview: localPreview || undefined
    };

    let updatedList: VariantItem[];
    if (editingIndex !== null) {
      updatedList = [...localVariants];
      updatedList[editingIndex] = newVariant;
      toast.success(`Updated variant "${trimmedName}"`);
    } else {
      updatedList = [...localVariants, newVariant];
      toast.success(`Added variant "${trimmedName}"`);
    }

    setLocalVariants(updatedList);
    onChange(updatedList);
    setIsEditorOpen(false);
  };

  const handleDeleteVariant = (index: number) => {
    const item = localVariants[index];
    const updated = localVariants.filter((_, i) => i !== index);
    setLocalVariants(updated);
    onChange(updated);
    toast.info(`Removed variant "${item?.name || 'Option'}"`);
  };

  const handleDone = () => {
    onChange(localVariants);
    onClose();
  };

  const totalStock = localVariants.reduce((sum, v) => sum + (Number(v.stockCount) || 0), 0);

  return (
    <>
      {/* SHEET 1: VARIANTS LIST & OVERVIEW */}
      <AnimatedBottomSheet
        isOpen={isOpen && !isEditorOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-orange" />
            <span className="font-bold text-gray-900 text-lg">Product Variants</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-brand-orange">
              {localVariants.length}
            </span>
          </div>
        }
        subtitle="Manage sizes, colors, pricing, and mandatory inventory stock"
        maxHeight="86vh"
        footer={
          <div className="flex items-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={openAddVariant}
              className="flex-1 h-12 rounded-xl border-dashed border-2 border-brand-orange/40 text-brand-orange hover:bg-orange-50 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Variant Option
            </Button>
            <Button
              type="button"
              onClick={handleDone}
              className="flex-1 h-12 rounded-xl bg-brand-navy hover:bg-brand-dark-navy text-white font-bold text-sm shadow-md cursor-pointer"
            >
              Done ({localVariants.length} Configured)
            </Button>
          </div>
        }
      >
        <div className="space-y-4 pb-4">
          {/* Inventory Summary Banner */}
          {localVariants.length > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-800">
                  Total Combined Stock: <span className="text-[#FF5A36] font-extrabold">{totalStock} units</span>
                </p>
                <p className="text-[11px] text-gray-500">
                  Across {localVariants.length} active variant {localVariants.length === 1 ? 'option' : 'options'}
                </p>
              </div>
              <span className="text-[11px] font-black text-brand-navy bg-white px-3 py-1 rounded-lg border border-orange-200 shadow-2xs">
                {localVariants.length} Variants
              </span>
            </div>
          )}

          {/* Variants List or Empty State */}
          {localVariants.length === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 bg-gray-50/60 rounded-2xl border border-dashed border-gray-300">
              <div className="w-14 h-14 rounded-2xl bg-orange-100/70 text-brand-orange flex items-center justify-center">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">No Variants Added Yet</h4>
                <p className="text-xs text-gray-500 max-w-xs mt-1">
                  Add sizes (S, M, L), colors (Red, Blue), or custom options with independent pricing and stock.
                </p>
              </div>
              <Button
                type="button"
                onClick={openAddVariant}
                className="mt-2 h-10 px-5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Your First Variant
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {localVariants.map((item, idx) => {
                const previewImg = item.localPreview || (item.imageUrl ? getMediaUrl(item.imageUrl) : '');
                const isZeroStock = Number(item.stockCount) <= 0;

                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-white border border-[#E5E2DC] hover:border-gray-300 rounded-2xl shadow-2xs flex items-center justify-between gap-3 transition-all"
                  >
                    {/* Variant Thumbnail */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                        {previewImg ? (
                          <img
                            src={previewImg}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-black text-sm text-gray-400">
                            {item.name ? item.name.slice(0, 2).toUpperCase() : 'V'}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-sm truncate">
                            {item.name}
                          </h4>
                          {item.sku && (
                            <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                              {item.sku}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-extrabold text-[#171717]">
                            {currencySymbol}{item.price}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              isZeroStock
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isZeroStock ? 'Out of Stock' : `${item.stockCount} in stock`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditVariant(idx)}
                        className="p-2 text-gray-500 hover:text-brand-navy hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        title="Edit Variant"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AnimatedBottomSheet>

      {/* SHEET 2: ADD / EDIT SINGLE VARIANT */}
      <AnimatedBottomSheet
        isOpen={isOpen && isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              className="p-1 -ml-1 text-gray-500 hover:text-gray-900 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-gray-900 text-lg">
              {editingIndex !== null ? 'Edit Variant Option' : 'Add Variant Option'}
            </span>
          </div>
        }
        subtitle="Specify variant name, price, photo, and mandatory stock quantity"
        maxHeight="90vh"
        footer={
          <div className="flex items-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditorOpen(false)}
              className="flex-1 h-12 rounded-xl border-[#E5E2DC] text-gray-700 font-semibold text-sm cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveVariant}
              disabled={isUploadingImage}
              className="flex-1 h-12 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-sm shadow-md cursor-pointer disabled:opacity-50"
            >
              {editingIndex !== null ? 'Update Variant' : 'Add Variant'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveVariant} className="space-y-4 pb-4">
          {/* 1. Variant Photo Upload with INSTANT Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
              <span>Variant Photo (Optional)</span>
              <span className="text-[10px] text-gray-400">Instant Preview</span>
            </label>

            <div className="flex items-center gap-3">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-[#E5E2DC] hover:border-brand-orange/60 transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group shrink-0"
              >
                {localPreview ? (
                  <>
                    <img
                      src={localPreview}
                      alt="Variant preview"
                      className="w-full h-full object-cover"
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                      Change
                    </div>
                  </>
                ) : (
                  <>
                    {isUploadingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin text-brand-orange" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-[10px] font-bold text-brand-navy">Add Photo</span>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-800">Assign image for this option</p>
                <p className="text-[11px] text-gray-400">
                  Allows buyers to preview this exact color or size when selected.
                </p>
                {localPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalPreview('');
                      setImageUrl('');
                    }}
                    className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Quick picker from existing product photos */}
            {availableImages && availableImages.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] font-semibold text-gray-600 mb-1.5">Or choose from uploaded product photos:</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {availableImages.map((imgUrl, i) => {
                    const formatted = getMediaUrl(imgUrl);
                    const isSelected = (imageUrl === imgUrl || localPreview === formatted || localPreview === imgUrl);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setImageUrl(imgUrl);
                          setLocalPreview(formatted);
                          toast.success('Selected photo for variant');
                        }}
                        className={cn(
                          "w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer",
                          isSelected
                            ? "border-[#FF5A36] ring-2 ring-[#FF5A36]/30 scale-105"
                            : "border-gray-200 opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={formatted} alt="" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Variant Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-800">
              Variant Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Size M, Red, 256GB, Pack of 2"
              className="w-full p-3.5 bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm font-medium"
              autoFocus
            />

            {/* Preset Suggestions */}
            <div className="pt-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Quick Presets
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                {COMMON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setName(preset)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-orange-50 hover:text-brand-orange hover:border-brand-orange text-gray-700 text-xs font-medium rounded-lg border border-gray-200 transition-colors cursor-pointer shrink-0"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Price and Mandatory Stock in 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-800">
                Price ({currencySymbol}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 p-3.5 bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm font-bold text-[#171717]"
                />
              </div>
            </div>

            {/* Mandatory Stock */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-800">
                  Stock <span className="text-red-500">*</span>
                </label>
                <span className="text-[9px] font-black text-red-500 uppercase">Required</span>
              </div>
              <input
                type="number"
                step="1"
                min="0"
                value={stockCount}
                onChange={(e) => setStockCount(e.target.value)}
                placeholder="e.g. 25"
                className="w-full p-3.5 bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm font-semibold text-gray-800"
              />
            </div>
          </div>

          {/* 4. Variant SKU */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700">Variant SKU</label>
              <span className="text-[9px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                Auto-assigned
              </span>
            </div>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. LKY-35011092-V1"
              className="w-full p-3 bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-xs font-mono text-gray-600"
            />
          </div>
        </form>
      </AnimatedBottomSheet>
    </>
  );
}
