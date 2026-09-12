'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Image as ImageIcon, Upload, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { toast } from 'sonner';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAddProductMutation, useGetMyStoreQuery, useGetPresignedUrlMutation, useUploadMediaMutation, useGetStoreCategoriesQuery } from '@/lib/api';
import { Dropdown } from '@/components/ui/dropdown';
import { getMediaUrl } from '@/lib/utils';
const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().min(1, 'Variant SKU is required'),
  price: z.coerce.number().min(0, 'Variant price cannot be negative'),
  stockCount: z.coerce.number().int().min(0, 'Variant stock cannot be negative').optional()
});

const productFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  sku: z.string().optional(),
  mrp: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
  stockCount: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  hasVariants: z.boolean().optional(),
  isAvailableForDelivery: z.boolean().optional(),
  isAvailableForPickup: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
  media: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['IMAGE', 'VIDEO']).optional(),
    isPrimary: z.boolean().optional(),
    displayOrder: z.number().optional()
  })).optional()
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const STEPS = ['Basic Info', 'Pricing & Stock', 'Media', 'Publish'];

export default function ManualAddProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const { data: storeData } = useGetMyStoreQuery();
  const { data: categories = [] } = useGetStoreCategoriesQuery(storeData?.id ?? '', {
    skip: !storeData?.id
  });
  const [addProduct, { isLoading: isSubmitting }] = useAddProductMutation();
  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      sku: '',
      mrp: undefined,
      sellingPrice: undefined,
      stockCount: undefined,
      isActive: true,
      hasVariants: false,
      isAvailableForDelivery: true,
      isAvailableForPickup: true,
      variants: [],
      media: []
    }
  });

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = form;

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants'
  });

  // Load from draft
  useEffect(() => {
    const savedDraft = localStorage.getItem('lokaya_product_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (Array.isArray(parsed.media)) {
          parsed.media = parsed.media.map((m: any) => ({
            ...m,
            url: getMediaUrl(m.url)
          }));
        }
        form.reset(parsed);
      } catch (e) {
        console.error('Failed to load draft', e);
      }
    }
    setIsLoaded(true);
  }, [form]);

  // Save draft on change
  useEffect(() => {
    if (isLoaded) {
      const subscription = form.watch((value) => {
        localStorage.setItem('lokaya_product_draft', JSON.stringify(value));
      });
      return () => subscription.unsubscribe();
    }
  }, [form, isLoaded]);

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 0) fieldsToValidate = ['name', 'category', 'description', 'sku'];
    if (currentStep === 1) fieldsToValidate = ['sellingPrice', 'mrp', 'stockCount'];
    
    const isStepValid = await form.trigger(fieldsToValidate as any);
    
    if (isStepValid && currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.back();
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    if (!storeData?.id) {
      toast.error('Store information not found');
      return;
    }

    try {
      await addProduct({ 
        storeId: storeData.id, 
        body: data 
      }).unwrap();
      
      toast.success('Product published successfully!');
      localStorage.removeItem('lokaya_product_draft');
      router.push('/seller/products');
    } catch (error) {
      toast.error('Failed to publish product. Please check your inputs.');
      console.error(error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const fileId = Math.random().toString(36).substring(7);
      setUploadingFiles(prev => ({ ...prev, [fileId]: true }));
      
      try {
        let finalUrl = '';

        try {
          // 1. Direct Multipart upload (fastest, bypasses CORS, returns reliable publicUrl)
          const formData = new FormData();
          formData.append('file', file);
          const res = await uploadMedia(formData).unwrap();
          finalUrl = getMediaUrl(res.publicUrl || res.url);
        } catch (directErr) {
          console.warn('Direct upload fallback to presigned:', directErr);
          // 2. Presigned URL fallback
          const presignedRes = await getPresignedUrl({
            filename: file.name,
            contentType: file.type,
          }).unwrap();

          const targetUrl = presignedRes.uploadUrl || presignedRes.signedUrl;
          if (!targetUrl) throw new Error('No upload URL returned');

          const uploadRes = await fetch(targetUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });

          if (!uploadRes.ok) throw new Error('Upload failed');
          finalUrl = getMediaUrl(presignedRes.publicUrl || (presignedRes.fileKey ? `/media/view?key=${encodeURIComponent(presignedRes.fileKey)}` : ''));
        }

        if (!finalUrl) throw new Error('Failed to obtain uploaded file URL');

        const currentMedia = form.getValues('media') || [];
        const isPrimary = currentMedia.length === 0;

        setValue('media', [
          ...currentMedia,
          {
            url: finalUrl,
            type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
            isPrimary,
            displayOrder: currentMedia.length
          }
        ]);

        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        console.error('Upload failed', error);
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploadingFiles(prev => ({ ...prev, [fileId]: false }));
      }
    }
  };

  const removeMedia = (indexToRemove: number) => {
    const currentMedia = form.getValues('media') || [];
    const newMedia = currentMedia.filter((_, idx) => idx !== indexToRemove);
    // If we removed the primary, make the first one primary
    if (currentMedia[indexToRemove].isPrimary && newMedia.length > 0) {
      newMedia[0].isPrimary = true;
    }
    setValue('media', newMedia);
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24">
      <SellerHeader 
        showBack={true}
        onBack={handleBack}
        title={`Add Product - Step ${currentStep + 1} of ${STEPS.length}`}
        hideSearchIcon={true}
      />

      {/* Progress Bar */}
      <div className="bg-white px-4 py-3 border-b border-[#E5E2DC]">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-[#E5E2DC] -translate-y-1/2 rounded-full"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-brand-navy -translate-y-1/2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          ></div>
          
          {STEPS.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full border-[3px] transition-colors ${
                idx <= currentStep ? 'bg-brand-navy border-brand-navy' : 'bg-white border-[#E5E2DC]'
              }`}></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {STEPS.map((step, idx) => (
            <span key={idx} className={`text-[10px] font-semibold ${idx <= currentStep ? 'text-brand-navy' : 'text-[#999999]'}`}>
              {step}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {currentStep === 0 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-brand-navy">Basic Information</h2>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Product Name *</label>
              <input 
                {...register('name')}
                type="text" 
                placeholder="e.g. Premium Cotton T-Shirt"
                className={`w-full p-3.5 bg-white border ${errors.name ? 'border-red-500' : 'border-[#E5E2DC]'} rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm`} 
              />
              {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Category</label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Dropdown
                    {...field}
                    onChange={(value) => {
                      if (value === '__create_new__') {
                        // Draft is automatically saved via the form.watch useEffect
                        router.push('/seller/store/categories/add');
                        return;
                      }
                      field.onChange(value);
                    }}
                    placeholder="Select a category"
                    className={`w-full p-3.5 bg-white border ${errors.category ? 'border-red-500' : 'border-[#E5E2DC]'} rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm h-[50px]`}
                    options={[
                      ...categories.map((c: any) => ({ label: c.name, value: c.id })),
                      { label: "+ Create new category", value: "__create_new__" }
                    ]}
                  />
                )}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea 
                {...register('description')}
                placeholder="Describe your product..."
                rows={4}
                className="w-full p-3.5 bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm resize-none" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">SKU (Optional)</label>
              <input 
                {...register('sku')}
                type="text" 
                placeholder="e.g. TSH-BLK-M"
                className="w-full p-3.5 bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm" 
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-brand-navy">Pricing & Inventory</h2>
            
            <div className="pt-2 border-b border-[#E5E2DC] pb-4 mb-4">
              <label className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E5E2DC]">
                <div>
                  <p className="font-semibold text-sm text-gray-900">This product has variants</p>
                  <p className="text-xs text-gray-500">Multiple sizes, colors, or options</p>
                </div>
                <input 
                  type="checkbox" 
                  {...register('hasVariants')}
                  className="w-5 h-5 accent-brand-orange" 
                />
              </label>
            </div>

            {!watch('hasVariants') ? (
              <>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Selling Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                      <input 
                        {...register('sellingPrice')}
                        type="number" 
                        placeholder="0.00"
                        className={`w-full pl-8 p-3.5 bg-white border ${errors.sellingPrice ? 'border-red-500' : 'border-[#E5E2DC]'} rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm`} 
                      />
                    </div>
                    {errors.sellingPrice && <span className="text-xs text-red-500">{errors.sellingPrice.message}</span>}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">MRP (Original)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                      <input 
                        {...register('mrp')}
                        type="number" 
                        placeholder="0.00"
                        className="w-full pl-8 p-3.5 bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Stock Quantity</label>
                  <input 
                    {...register('stockCount')}
                    type="number" 
                    placeholder="e.g. 50"
                    className="w-full p-3.5 bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm" 
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-brand-navy">Variants</h3>
                {variantFields.map((field, index) => (
                  <div key={field.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 relative">
                    <button type="button" onClick={() => removeVariant(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4"/>
                    </button>
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Name (e.g. Size M)</label>
                        <input {...register(`variants.${index}.name`)} placeholder="Name" className={`w-full p-2 bg-white border ${errors.variants?.[index]?.name ? 'border-red-500' : 'border-[#E5E2DC]'} rounded-lg text-sm`} />
                        {errors.variants?.[index]?.name && <span className="text-[10px] text-red-500">{errors.variants[index]?.name?.message}</span>}
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-gray-700">SKU</label>
                        <input {...register(`variants.${index}.sku`)} placeholder="SKU" className="w-full p-2 bg-white border border-[#E5E2DC] rounded-lg text-sm" />
                        {errors.variants?.[index]?.sku && <span className="text-[10px] text-red-500">{errors.variants[index]?.sku?.message}</span>}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Price (₹)</label>
                        <input type="number" {...register(`variants.${index}.price`)} placeholder="0.00" className={`w-full p-2 bg-white border ${errors.variants?.[index]?.price ? 'border-red-500' : 'border-[#E5E2DC]'} rounded-lg text-sm`} />
                        {errors.variants?.[index]?.price && <span className="text-[10px] text-red-500">{errors.variants[index]?.price?.message}</span>}
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-gray-700">Stock</label>
                        <input type="number" {...register(`variants.${index}.stockCount`)} placeholder="0" className="w-full p-2 bg-white border border-[#E5E2DC] rounded-lg text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full border-dashed border-2 border-gray-300 text-gray-600 hover:border-brand-navy hover:text-brand-navy"
                  onClick={() => appendVariant({ name: '', sku: '', price: 0, stockCount: 0 })}
                >
                  + Add Variant Option
                </Button>
              </div>
            )}
            
            <div className="pt-2 border-t border-[#E5E2DC] mt-4">
              <h3 className="font-semibold text-brand-navy mb-3">Fulfillment Options</h3>
              <label className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E5E2DC] mb-3">
                <div>
                  <p className="font-semibold text-sm text-gray-900">Available for Delivery</p>
                  <p className="text-xs text-gray-500">Customers can order this online</p>
                </div>
                <input 
                  type="checkbox" 
                  {...register('isAvailableForDelivery')}
                  className="w-5 h-5 accent-brand-orange" 
                />
              </label>
              <label className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E5E2DC]">
                <div>
                  <p className="font-semibold text-sm text-gray-900">Available for Store Pickup</p>
                  <p className="text-xs text-gray-500">Customers can pick this up in store</p>
                </div>
                <input 
                  type="checkbox" 
                  {...register('isAvailableForPickup')}
                  className="w-5 h-5 accent-brand-orange" 
                />
              </label>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-xl font-bold text-brand-navy">Product Media</h2>
            <p className="text-sm text-gray-500">Upload high quality images or videos of your product.</p>
            
            <div className="relative w-full h-48 border-2 border-dashed border-[#E5E2DC] rounded-2xl flex flex-col items-center justify-center text-gray-500 bg-white hover:bg-gray-50 cursor-pointer transition-colors overflow-hidden">
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*" 
                onChange={handleFileUpload} 
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <Upload className="w-8 h-8 mb-3 text-brand-orange" />
              <span className="text-sm font-semibold text-brand-navy">Tap to upload</span>
              <span className="text-xs text-gray-400 mt-1">Up to 5 files (Max 5MB each)</span>
            </div>
            
            {/* Uploading State */}
            {Object.values(uploadingFiles).some(isUploading => isUploading) && (
              <div className="text-sm text-brand-orange animate-pulse font-semibold">
                Uploading media...
              </div>
            )}
            
            {/* Image Placeholder Grid */}
            <div className="grid grid-cols-3 gap-3">
              {(watch('media') || []).map((m, idx) => (
                <div key={idx} className="aspect-square bg-gray-100 rounded-xl relative overflow-hidden group border border-gray-200">
                  {m.type === 'IMAGE' ? (
                    <img src={getMediaUrl(m.url)} alt="Product media" className="w-full h-full object-cover" />
                  ) : (
                    <video src={getMediaUrl(m.url)} className="w-full h-full object-cover" />
                  )}
                  {m.isPrimary && (
                    <span className="absolute bottom-2 left-2 bg-brand-navy text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Primary</span>
                  )}
                  <button 
                    onClick={() => removeMedia(idx)}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {/* Fill remaining slots with empty dashed boxes */}
              {Array.from({ length: Math.max(0, 3 - (watch('media')?.length || 0)) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center border border-dashed border-gray-300">
                  {i === 0 && !(watch('media')?.length) && <ImageIcon className="w-6 h-6 opacity-30 text-gray-400" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 text-brand-navy mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <h2 className="text-xl font-bold">Ready to Publish</h2>
            </div>
            
            <div className="bg-white rounded-2xl border border-[#E5E2DC] overflow-hidden">
              <div className="h-48 bg-gray-100 flex items-center justify-center border-b border-[#E5E2DC] overflow-hidden">
                {watch('media')?.[0]?.url ? (
                  <img src={getMediaUrl(watch('media')?.[0]?.url || '')} alt={watch('name') || 'Product preview'} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight pr-4">{watch('name') || 'Product Name'}</h3>
                  <span className="font-bold text-brand-navy text-lg shrink-0">₹{watch('sellingPrice') || '0'}</span>
                </div>
                <p className="text-xs font-semibold text-brand-orange uppercase tracking-wider mt-1">{watch('category') || 'Category'}</p>
                <div className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {watch('description') || 'No description provided.'}
                </div>
                <div className="mt-4 flex gap-2">
                  {watch('isAvailableForDelivery') && <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md">Delivery</span>}
                  {watch('isAvailableForPickup') && <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md">Store Pickup</span>}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E2DC] p-4 flex gap-3 z-50 md:left-64">
        {currentStep < STEPS.length - 1 ? (
          <Button 
            onClick={handleNext}
            className="w-full h-12 bg-brand-navy hover:bg-brand-dark-navy text-white rounded-xl font-bold text-base flex items-center justify-center gap-2"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <div className="flex w-full gap-3">
             <Button 
              variant="outline"
              onClick={() => router.push('/seller/products')}
              className="flex-1 h-12 border-gray-300 text-gray-700 rounded-xl font-bold"
            >
              Save as Draft
            </Button>
            <Button 
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="flex-1 h-12 bg-brand-orange hover:bg-[#E04B2A] text-white rounded-xl font-bold flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Product'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
