'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Image as ImageIcon, Upload, ChevronRight, X, RefreshCw, Sparkles, Layers, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerHeader } from '@/components/seller/SellerHeader';
import { toast } from 'sonner';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dropdown } from '@/components/ui/dropdown';
import { getMediaUrl, generateStandardSku, isVideoMedia } from '@/lib/utils';
import { ProductCard } from '@/components/ProductCard';
import { useCurrency } from '@/context/CurrencyContext';
import { AiStudioBottomSheet } from '@/components/seller/AiStudioBottomSheet';
import { VariantsBottomSheet, VariantItem } from '@/components/seller/VariantsBottomSheet';
import { 
  useGetMyStoreQuery, 
  useGetStoreCategoriesQuery, 
  useAddProductMutation, 
  useUpdateProductMutation,
  useGetProductByIdQuery,
  useCreateCategoryMutation, 
  useUploadMediaMutation, 
  useGetPresignedUrlMutation 
} from '@/lib/api';

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().optional(),
  price: z.coerce.number().min(0, 'Variant price cannot be negative'),
  stockCount: z.coerce.number({ invalid_type_error: 'Variant stock is required' }).int('Variant stock must be a whole number').min(0, 'Variant stock cannot be negative'),
  imageUrl: z.string().optional().nullable(),
  localPreview: z.string().optional().nullable()
});

const productFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  category: z.string().optional(),
  sku: z.string().optional(),
  mrp: z.coerce.number().min(0).optional(),
  sellingPrice: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  stockCount: z.coerce.number({ invalid_type_error: 'Stock quantity is required' }).int('Stock must be a whole number').min(0, 'Stock cannot be negative').optional(),
  isActive: z.boolean().optional(),
  hasVariants: z.boolean().optional(),
  isAvailableForDelivery: z.boolean().optional(),
  isAvailableForPickup: z.boolean().optional(),
  isDeliveryIncluded: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
  media: z.array(z.object({
    url: z.string().min(1, 'Media URL is required'),
    localPreview: z.string().optional(),
    type: z.enum(['IMAGE', 'VIDEO']).optional(),
    isPrimary: z.boolean().optional(),
    displayOrder: z.number().optional(),
    isUploading: z.boolean().optional(),
    fileId: z.string().optional()
  })).optional()
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const STEPS = ['Media', 'Basic Info', 'Pricing & Stock', 'Publish'];

function ManualAddProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdFromUrl = searchParams.get('draftId') || searchParams.get('id');
  const [draftProductId, setDraftProductId] = useState<string | null>(draftIdFromUrl || null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const { currencySymbol } = useCurrency();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const { data: storeData } = useGetMyStoreQuery();
  const { data: categories = [] } = useGetStoreCategoriesQuery(storeData?.id ?? '', {
    skip: !storeData?.id
  });
  const [addProduct, { isLoading: isSubmitting }] = useAddProductMutation();
  const [updateProduct, { isLoading: isUpdatingProduct }] = useUpdateProductMutation();
  const { data: remoteProduct, isLoading: isLoadingRemoteProduct } = useGetProductByIdQuery(draftIdFromUrl || '', {
    skip: !draftIdFromUrl
  });

  const [createCategory] = useCreateCategoryMutation();
  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: boolean }>({});
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [isVariantsSheetOpen, setIsVariantsSheetOpen] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      sku: generateStandardSku(),
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

  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control,
    name: 'variants'
  });

  const [isDraftRestored, setIsDraftRestored] = useState(false);

  // 1. Load from Remote DB Draft if draftId provided in URL
  useEffect(() => {
    if (remoteProduct) {
      const sanitizedMedia = (remoteProduct.media || []).map((m: any, idx: number) => ({
        url: getMediaUrl(m.url),
        localPreview: getMediaUrl(m.url),
        type: m.type || 'IMAGE',
        isPrimary: m.isPrimary ?? (idx === 0),
        displayOrder: m.displayOrder ?? idx,
        isUploading: false
      }));

      form.reset({
        name: (remoteProduct.name === 'Untitled Product' || remoteProduct.name === 'Untitled Draft') ? '' : remoteProduct.name,
        description: remoteProduct.description || '',
        category: remoteProduct.categoryId || remoteProduct.category || '',
        sku: remoteProduct.sku || generateStandardSku(),
        mrp: remoteProduct.mrp && remoteProduct.mrp > 0 ? remoteProduct.mrp : undefined,
        sellingPrice: remoteProduct.sellingPrice && remoteProduct.sellingPrice > 0 ? remoteProduct.sellingPrice : undefined,
        costPrice: remoteProduct.costPrice && remoteProduct.costPrice > 0 ? remoteProduct.costPrice : undefined,
        stockCount: remoteProduct.stockCount !== undefined ? remoteProduct.stockCount : undefined,
        isActive: remoteProduct.isActive ?? false,
        hasVariants: Boolean(remoteProduct.hasVariants),
        isAvailableForDelivery: remoteProduct.isAvailableForDelivery ?? true,
        isAvailableForPickup: remoteProduct.isAvailableForPickup ?? true,
        isDeliveryIncluded: remoteProduct.isDeliveryIncluded ?? false,
        variants: (remoteProduct.variants || []).map((v: any) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          stockCount: v.stockCount,
          imageUrl: v.imageUrl ? getMediaUrl(v.imageUrl) : null,
          localPreview: v.imageUrl ? getMediaUrl(v.imageUrl) : null
        })),
        media: sanitizedMedia
      });

      setDraftProductId(remoteProduct.id);
      setIsDraftRestored(true);
      setIsLoaded(true);
    }
  }, [remoteProduct, form]);

  // 2. Load from LocalStorage if no URL draftId
  useEffect(() => {
    if (draftIdFromUrl) return; // Handled by remoteProduct above

    const savedDraft = localStorage.getItem('lokaya_product_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed) {
          if (parsed.draftProductId) {
            setDraftProductId(parsed.draftProductId);
          }

          // Clean out any expired blob: URLs from previous session
          const cleanMedia = Array.isArray(parsed.media)
            ? parsed.media
                .filter((m: any) => m.url && !m.url.startsWith('blob:'))
                .map((m: any, idx: number) => ({
                  ...m,
                  url: getMediaUrl(m.url),
                  localPreview: getMediaUrl(m.url),
                  isUploading: false
                }))
            : [];

          form.reset({
            ...parsed,
            media: cleanMedia,
            sku: parsed.sku || generateStandardSku()
          });

          if (parsed.name || parsed.category || cleanMedia.length > 0) {
            setIsDraftRestored(true);
          }
        }
      } catch (e) {
        console.error('Failed to load draft', e);
      }
    } else {
      if (!form.getValues('sku')) {
        form.setValue('sku', generateStandardSku());
      }
    }
    setIsLoaded(true);
  }, [draftIdFromUrl, form]);

  const handleClearDraft = () => {
    localStorage.removeItem('lokaya_product_draft');
    setDraftProductId(null);
    setIsDraftRestored(false);
    form.reset({
      name: '',
      description: '',
      category: '',
      sku: generateStandardSku(),
      mrp: undefined,
      sellingPrice: undefined,
      costPrice: undefined,
      stockCount: undefined,
      isActive: true,
      hasVariants: false,
      isAvailableForDelivery: true,
      isAvailableForPickup: true,
      isDeliveryIncluded: false,
      variants: [],
      media: []
    });
    router.replace('/seller/products/add');
    toast.success('Draft cleared');
  };

  // Save draft on change to localStorage
  useEffect(() => {
    if (isLoaded) {
      const subscription = form.watch((value) => {
        const toSave = {
          ...value,
          draftProductId
        };
        localStorage.setItem('lokaya_product_draft', JSON.stringify(toSave));
      });
      return () => subscription.unsubscribe();
    }
  }, [form, isLoaded, draftProductId]);

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 0) {
      fieldsToValidate = [];
    }
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'category', 'description', 'sku'];
    }
    if (currentStep === 2) {
      if (watch('hasVariants')) {
        const currentVariants = watch('variants') || [];
        if (currentVariants.length === 0) {
          toast.error('Please add at least one variant option');
          setIsVariantsSheetOpen(true);
          return;
        }

        const invalidVariant = currentVariants.find((v: any) => 
          !v.name?.trim() || 
          v.price === undefined || 
          v.price === null || 
          isNaN(Number(v.price)) || 
          Number(v.price) < 0 ||
          v.stockCount === undefined ||
          v.stockCount === null ||
          isNaN(Number(v.stockCount)) ||
          Number(v.stockCount) < 0
        );

        if (invalidVariant) {
          toast.error(`Please ensure variant "${invalidVariant.name || 'Option'}" has a valid price and mandatory stock quantity.`);
          setIsVariantsSheetOpen(true);
          return;
        }
        fieldsToValidate = ['variants'];
      } else {
        const currentStock = watch('stockCount');
        if (currentStock === undefined || currentStock === null || isNaN(Number(currentStock)) || Number(currentStock) < 0) {
          toast.error('Stock quantity is mandatory (>= 0)');
          return;
        }
        fieldsToValidate = ['sellingPrice', 'mrp', 'stockCount'];
      }
    }
    
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

  const onInvalid = (validationErrors: any) => {
    console.error('Form validation errors:', validationErrors);
    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const err = validationErrors[firstKey];
      const message = err?.message || (typeof err === 'object' && err?.name?.message) || `Please check the ${firstKey} field.`;
      toast.error(`Validation: ${message}`);
    } else {
      toast.error('Please complete all required product fields.');
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    if (!storeData?.id) {
      toast.error('Store information not found');
      return;
    }

    if (Object.values(uploadingFiles).some(Boolean)) {
      toast.info('Finishing background media upload, please wait a moment...');
      return;
    }

    const pendingBlobs = (data.media || []).filter((m: any) => m.url?.startsWith('blob:'));
    if (pendingBlobs.length > 0) {
      toast.error('Some media files are still uploading or failed. Please wait or re-select them.');
      return;
    }

    try {
      const selectedCategory = categories.find((c: any) => c.id === data.category || c.name === data.category);
      
      const hasVariants = Boolean(data.hasVariants);
      const rawVariants = (data.variants && data.variants.length > 0)
        ? data.variants
        : (form.getValues('variants') || []);
      const variants = rawVariants || [];
      const primaryVariant = variants.length > 0 ? variants[0] : null;

      const computedSellingPrice = hasVariants && primaryVariant
        ? (Number(primaryVariant.price) || 0)
        : (data.sellingPrice !== undefined && data.sellingPrice !== null && !isNaN(Number(data.sellingPrice)) ? Number(data.sellingPrice) : 0);

      const computedMrp = hasVariants && primaryVariant
        ? (data.mrp ? Number(data.mrp) : computedSellingPrice)
        : (data.mrp !== undefined && data.mrp !== null && !isNaN(Number(data.mrp)) ? Number(data.mrp) : computedSellingPrice);

      const computedStockCount = hasVariants && variants.length > 0
        ? variants.reduce((sum: number, v: any) => sum + (Number(v.stockCount) || 0), 0)
        : (data.stockCount !== undefined && data.stockCount !== null && !isNaN(Number(data.stockCount)) ? Number(data.stockCount) : 0);

      const cleanCategoryId = selectedCategory?.id 
        ? selectedCategory.id 
        : (data.category && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.category) ? data.category : undefined);

      const payload = {
        storeId: storeData.id,
        name: data.name,
        description: data.description || '',
        category: selectedCategory ? selectedCategory.name : (data.category || 'General'),
        categoryId: cleanCategoryId,
        sku: data.sku || generateStandardSku(),
        sellingPrice: computedSellingPrice,
        mrp: computedMrp,
        costPrice: data.costPrice !== undefined && data.costPrice !== null && !isNaN(Number(data.costPrice)) ? Number(data.costPrice) : undefined,
        stockCount: computedStockCount,
        isActive: data.isActive ?? true,
        status: 'PUBLISHED',
        hasVariants: Boolean(hasVariants),
        isAvailableForDelivery: data.isAvailableForDelivery ?? true,
        isAvailableForPickup: data.isAvailableForPickup ?? true,
        isDeliveryIncluded: data.isDeliveryIncluded ?? false,
        variants: hasVariants ? variants.map((v: any, index: number) => ({
          ...(v.id ? { id: v.id } : {}),
          name: v.name,
          sku: v.sku || `${data.sku || 'SKU'}-V${index + 1}`,
          price: Number(v.price) || 0,
          stockCount: Number(v.stockCount) || 0,
          imageUrl: (v.imageUrl && !v.imageUrl.startsWith('blob:')) ? v.imageUrl : undefined
        })) : [],
        media: (data.media || []).filter((m: any) => !m.url?.startsWith('blob:')).map((m: any, index: number) => ({
          url: m.url,
          type: m.type || 'IMAGE',
          isPrimary: m.isPrimary ?? (index === 0),
          displayOrder: m.displayOrder ?? index
        }))
      };

      if (draftProductId) {
        // Update existing draft to published product!
        await updateProduct({
          productId: draftProductId,
          body: payload
        }).unwrap();
        toast.success('Product published successfully!');
      } else {
        // Create new published product!
        await addProduct({
          storeId: storeData.id,
          body: payload
        }).unwrap();
        toast.success('Product created successfully!');
      }

      localStorage.removeItem('lokaya_product_draft');
      router.push('/seller/products');
    } catch (error: any) {
      console.error('Failed to publish product:', error);
      toast.error(error?.data?.error || error?.message || 'Failed to publish product. Please try again.');
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      // If any uploads in flight, wait briefly for completion
      if (Object.values(uploadingFiles).some(Boolean)) {
        toast.info('Completing media uploads before saving draft...');
        let waitCount = 0;
        while (Object.values(uploadingFiles).some(Boolean) && waitCount < 10) {
          await new Promise(r => setTimeout(r, 300));
          waitCount++;
        }
      }

      const values = form.getValues();
      const rawName = values.name?.trim();
      const draftName = (rawName && rawName.length >= 1) ? rawName : 'Untitled Product';

      const cleanMedia = (values.media || [])
        .filter((m: any) => m.url && !m.url.startsWith('blob:'))
        .map((m: any, index: number) => ({
          url: m.url,
          type: m.type || 'IMAGE',
          isPrimary: m.isPrimary ?? (index === 0),
          displayOrder: m.displayOrder ?? index
        }));

      const selectedCategory = categories.find((c: any) => c.id === values.category || c.name === values.category);
      const hasVariants = Boolean(values.hasVariants);
      const rawVariants = (values.variants && values.variants.length > 0)
        ? values.variants
        : (form.getValues('variants') || []);
      const variants = rawVariants || [];
      const primaryVariant = variants.length > 0 ? variants[0] : null;

      const computedSellingPrice = hasVariants && primaryVariant
        ? (Number(primaryVariant.price) || 0)
        : (values.sellingPrice !== undefined && values.sellingPrice !== null && !isNaN(Number(values.sellingPrice)) ? Number(values.sellingPrice) : 0);

      const computedMrp = hasVariants && primaryVariant
        ? (values.mrp ? Number(values.mrp) : computedSellingPrice)
        : (values.mrp !== undefined && values.mrp !== null && !isNaN(Number(values.mrp)) ? Number(values.mrp) : computedSellingPrice);

      const computedStockCount = hasVariants && variants.length > 0
        ? variants.reduce((sum: number, v: any) => sum + (Number(v.stockCount) || 0), 0)
        : (values.stockCount !== undefined && values.stockCount !== null && !isNaN(Number(values.stockCount)) ? Number(values.stockCount) : 0);

      const cleanCategoryId = selectedCategory?.id 
        ? selectedCategory.id 
        : (values.category && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(values.category) ? values.category : undefined);

      const payload = {
        storeId: storeData?.id,
        name: draftName,
        description: values.description || '',
        category: selectedCategory ? selectedCategory.name : (values.category || 'General'),
        categoryId: cleanCategoryId,
        sku: values.sku || generateStandardSku(),
        sellingPrice: computedSellingPrice,
        mrp: computedMrp,
        costPrice: values.costPrice !== undefined && values.costPrice !== null && !isNaN(Number(values.costPrice)) ? Number(values.costPrice) : undefined,
        stockCount: computedStockCount,
        isActive: false, // Inactive draft
        status: 'DRAFT',
        hasVariants,
        isAvailableForDelivery: values.isAvailableForDelivery ?? true,
        isAvailableForPickup: values.isAvailableForPickup ?? true,
        isDeliveryIncluded: values.isDeliveryIncluded ?? false,
        variants: hasVariants ? variants.map((v: any, index: number) => ({
          ...(v.id ? { id: v.id } : {}),
          name: v.name,
          sku: v.sku || `${values.sku || 'SKU'}-V${index + 1}`,
          price: Number(v.price) || 0,
          stockCount: Number(v.stockCount) || 0,
          imageUrl: (v.imageUrl && !v.imageUrl.startsWith('blob:')) ? v.imageUrl : undefined
        })) : [],
        media: cleanMedia
      };

      let savedId = draftProductId;

      if (storeData?.id) {
        if (draftProductId) {
          await updateProduct({
            productId: draftProductId,
            body: payload
          }).unwrap();
        } else {
          const res = await addProduct({
            storeId: storeData.id,
            body: payload
          }).unwrap();
          savedId = res?.id || res?.data?.id || null;
          if (savedId) {
            setDraftProductId(savedId);
          }
        }
      }

      // Sync clean local state
      const savedLocalState = {
        ...values,
        name: rawName || '',
        media: cleanMedia,
        draftProductId: savedId
      };
      localStorage.setItem('lokaya_product_draft', JSON.stringify(savedLocalState));

      toast.success('Draft saved to store catalog!');
      router.push('/seller/products');
    } catch (err: any) {
      console.warn('Backend draft save fallback to local storage:', err);
      const values = form.getValues();
      localStorage.setItem('lokaya_product_draft', JSON.stringify({ ...values, draftProductId }));
      toast.info('Draft saved locally. You can resume editing anytime.');
      router.push('/seller/products');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentMedia = form.getValues('media') || [];
    if (currentMedia.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 media files.');
      return;
    }

    const filesArray = Array.from(files);
    const validFiles = filesArray.filter(file => {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Max size is 25MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // 1. INSTANT OPTIMISTIC PREVIEW (0ms latency UI-first rendering)
    const optimisticEntries = validFiles.map((file, idx) => {
      const fileId = `${file.name}-${Date.now()}-${idx}`;
      const blobUrl = URL.createObjectURL(file);
      return {
        file,
        fileId,
        blobUrl,
        mediaItem: {
          url: blobUrl,
          localPreview: blobUrl,
          type: file.type.startsWith('video/') ? ('VIDEO' as const) : ('IMAGE' as const),
          isPrimary: currentMedia.length === 0 && idx === 0,
          displayOrder: currentMedia.length + idx,
          isUploading: true,
          fileId
        }
      };
    });

    // Immediately display thumbnails in the UI!
    const immediateMedia = [...currentMedia, ...optimisticEntries.map(e => e.mediaItem)];
    setValue('media', immediateMedia as any, { shouldDirty: true });

    // Mark uploading indicators
    setUploadingFiles(prev => {
      const next = { ...prev };
      optimisticEntries.forEach(e => { next[e.fileId] = true; });
      return next;
    });

    // Reset input so user can pick again if desired
    e.target.value = '';

    // 2. CONCURRENT BACKGROUND UPLOADS
    await Promise.all(
      optimisticEntries.map(async ({ file, fileId, blobUrl }) => {
        try {
          let finalUrl = '';
          try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await uploadMedia(formData).unwrap();
            finalUrl = getMediaUrl(res.publicUrl || res.url);
          } catch (directErr) {
            console.warn('Direct upload fallback to presigned:', directErr);
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

          // Seamlessly swap local preview blob with final persistent URL
          const currentList = form.getValues('media') || [];
          const updated = currentList.map((m: any) => {
            if (m.fileId === fileId || m.localPreview === blobUrl || m.url === blobUrl) {
              return {
                ...m,
                url: finalUrl,
                localPreview: finalUrl,
                isUploading: false
              };
            }
            return m;
          });
          setValue('media', updated as any, { shouldDirty: true });
          toast.success(`Uploaded ${file.name}`);
        } catch (error) {
          console.warn('Backend upload failed, keeping local preview:', error);
          const currentList = form.getValues('media') || [];
          const updated = currentList.map((m: any) => {
            if (m.fileId === fileId || m.localPreview === blobUrl || m.url === blobUrl) {
              return {
                ...m,
                isUploading: false
              };
            }
            return m;
          });
          setValue('media', updated as any);
          toast.info(`Using local preview for ${file.name}`);
        } finally {
          setUploadingFiles(prev => ({ ...prev, [fileId]: false }));
        }
      })
    );
  };

  const removeMedia = (indexToRemove: number) => {
    const currentMedia = form.getValues('media') || [];
    const newMedia = currentMedia.filter((_, idx) => idx !== indexToRemove);
    if (currentMedia[indexToRemove].isPrimary && newMedia.length > 0) {
      newMedia[0].isPrimary = true;
    }
    setValue('media', newMedia);
  };

  const handleApplyAiPhotos = async (
    newPhotos: Array<{ url: string; type: 'IMAGE'; isPrimary?: boolean; displayOrder: number }>,
    details?: any
  ) => {
    const currentMedia = form.getValues('media') || [];
    const existing = currentMedia.map(m => ({ ...m, isPrimary: false }));
    const merged = [...newPhotos, ...existing];
    setValue('media', merged, { shouldValidate: true, shouldDirty: true });

    if (details) {
      const updatedFields: string[] = [];
      if (details.name) {
        setValue('name', details.name, { shouldValidate: true, shouldDirty: true });
        updatedFields.push('title');
      }
      if (details.description) {
        setValue('description', details.description, { shouldValidate: true, shouldDirty: true });
        updatedFields.push('description');
      }
      if (details.sellingPrice !== null && details.sellingPrice !== undefined && !isNaN(Number(details.sellingPrice))) {
        setValue('sellingPrice', Number(details.sellingPrice), { shouldValidate: true, shouldDirty: true });
        updatedFields.push('price');
      }
      if (details.mrp !== null && details.mrp !== undefined && !isNaN(Number(details.mrp))) {
        setValue('mrp', Number(details.mrp), { shouldValidate: true, shouldDirty: true });
      }
      if (details.costPrice !== null && details.costPrice !== undefined && !isNaN(Number(details.costPrice))) {
        setValue('costPrice', Number(details.costPrice), { shouldValidate: true, shouldDirty: true });
      }
      if (details.category) {
        const rawCatName = details.category.trim();
        const matched = categories.find((c: any) => 
          c.name?.toLowerCase() === rawCatName.toLowerCase() ||
          details.category?.toLowerCase().includes(c.name?.toLowerCase()) ||
          c.name?.toLowerCase().includes(details.category?.toLowerCase())
        );

        if (matched) {
          setValue('category', matched.id, { shouldValidate: true, shouldDirty: true });
          updatedFields.push(`category (${matched.name})`);
        } else if (storeData?.id) {
          try {
            const newCat = await createCategory({
              storeId: storeData.id,
              name: rawCatName
            }).unwrap();
            if (newCat?.id) {
              setValue('category', newCat.id, { shouldValidate: true, shouldDirty: true });
              updatedFields.push(`new category (${rawCatName})`);
            } else {
              setValue('category', rawCatName, { shouldValidate: true, shouldDirty: true });
              updatedFields.push('category');
            }
          } catch (catErr) {
            console.warn('Could not auto-create category on frontend, setting text value for backend resolution:', catErr);
            setValue('category', rawCatName, { shouldValidate: true, shouldDirty: true });
            updatedFields.push('category');
          }
        } else {
          setValue('category', rawCatName, { shouldValidate: true, shouldDirty: true });
          updatedFields.push('category');
        }
      }
      if (updatedFields.length > 0) {
        toast.success(`✨ Auto-filled: ${updatedFields.join(', ')}`);
      }
    }
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

      {/* Restored Draft Alert Banner */}
      {isDraftRestored && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="truncate">Restored from your previously saved draft</span>
          </div>
          <button 
            type="button"
            onClick={handleClearDraft}
            className="text-amber-700 hover:text-amber-900 underline font-semibold cursor-pointer shrink-0 ml-2"
          >
            Clear Draft
          </button>
        </div>
      )}

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
        {/* STEP 0: PRODUCT MEDIA */}
        {currentStep === 0 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-brand-navy">Product Media</h2>
                <p className="text-sm text-gray-500">Upload photos or use the AI Studio to generate 5 catalog shots.</p>
              </div>
            </div>

            {/* AI Studio Photoshoot Trigger Card */}
            <div className="p-4 bg-white border border-[#E5E2DC] rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-brand-navy flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-brand-navy" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-brand-navy">AI Product Studio</h4>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-blue-100">
                      5 Angles + Auto-Fill
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click 1–2 product photos to generate 5 studio-grade catalog shots and auto-fill details.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => setIsAiStudioOpen(true)}
                className="h-10 px-4 rounded-xl bg-brand-navy hover:bg-brand-dark-navy text-white font-semibold text-xs shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Launch Studio
              </Button>
            </div>
            
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
              <span className="text-xs text-gray-400 mt-1">Up to 5 files (Max 25MB each)</span>
            </div>
            
            {/* Uploading State */}
            {Object.values(uploadingFiles).some(isUploading => isUploading) && (
              <div className="text-sm text-brand-orange animate-pulse font-semibold">
                Uploading media...
              </div>
            )}
            
            {/* Image Placeholder Grid */}
            <div className="grid grid-cols-3 gap-3">
              {(watch('media') || []).map((m: any, idx: number) => {
                const isVideo = m.type?.toUpperCase() === 'VIDEO' || isVideoMedia(m.url);
                const mediaSrc = (m.localPreview && !m.localPreview.startsWith('blob:'))
                  ? m.localPreview
                  : (m.url && !m.url.startsWith('blob:'))
                    ? getMediaUrl(m.url)
                    : (m.localPreview || getMediaUrl(m.url));
                const isItemUploading = Boolean(m.isUploading);

                return (
                  <div key={idx} className="aspect-square bg-gray-100 rounded-xl relative overflow-hidden group border border-gray-200">
                    {isVideo ? (
                      <video src={mediaSrc} className="w-full h-full object-cover" />
                    ) : (
                      <img 
                        src={mediaSrc} 
                        alt="Product media" 
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          console.warn('Image preview load error for:', mediaSrc);
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                        }}
                      />
                    )}

                    {/* Instant Upload Overlay */}
                    {isItemUploading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1 z-10">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">Uploading</span>
                      </div>
                    )}

                    {m.isPrimary && (
                      <span className="absolute bottom-2 left-2 bg-brand-navy text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">Primary</span>
                    )}
                    <button 
                      onClick={() => removeMedia(idx)}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              
              {/* Fill remaining slots with empty dashed boxes */}
              {Array.from({ length: Math.max(0, 3 - (watch('media')?.length || 0)) }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center border border-dashed border-gray-300">
                  {i === 0 && !(watch('media')?.length) && <ImageIcon className="w-6 h-6 opacity-30 text-gray-400" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: BASIC INFORMATION */}
        {currentStep === 1 && (
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  SKU (Item Code)
                  <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">
                    Auto-assigned (8-Digit)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setValue('sku', generateStandardSku(), { shouldValidate: true })}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-blue-50 cursor-pointer"
                  title="Generate new standard 8-digit SKU"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
              </div>
              <input 
                {...register('sku')}
                type="text" 
                placeholder="e.g. LKY-84920153"
                className="w-full p-3.5 bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm font-mono tracking-wider font-semibold text-gray-800" 
              />
              <p className="text-[11px] text-gray-500">
                Standard 8-digit unique code automatically assigned for inventory tracking & barcodes. Editable if you have a custom store code.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: PRICING & INVENTORY */}
        {currentStep === 2 && (() => {
          const variantsList = watch('variants') || [];
          const totalVariantStock = variantsList.reduce((sum: number, v: any) => sum + (Number(v?.stockCount) || 0), 0);

          return (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-brand-navy">Pricing & Inventory</h2>
            
            <div className="pt-2 border-b border-[#E5E2DC] pb-4 mb-4">
              <label className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E5E2DC] cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-semibold text-sm text-gray-900">This product has variants</p>
                  <p className="text-xs text-gray-500">Multiple sizes, colors, or options</p>
                </div>
                <input 
                  type="checkbox" 
                  {...register('hasVariants')}
                  onChange={(e) => {
                    setValue('hasVariants', e.target.checked);
                    if (e.target.checked && (watch('variants') || []).length === 0) {
                      setIsVariantsSheetOpen(true);
                    }
                  }}
                  className="w-5 h-5 accent-brand-orange cursor-pointer" 
                />
              </label>
            </div>

            {!watch('hasVariants') ? (
              <>
                {(() => {
                  const watchSellingPrice = Number(watch('sellingPrice')) || 0;
                  const watchMrp = Number(watch('mrp')) || 0;
                  const liveDiscount = watchMrp > 0 && watchSellingPrice > 0 && watchMrp > watchSellingPrice
                    ? Math.round(((watchMrp - watchSellingPrice) / watchMrp) * 100)
                    : 0;

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* 1. MRP (Showing Reference Price) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-800">
                              MRP ({currencySymbol})
                            </label>
                            <span className="text-[10px] text-gray-500 font-medium">Showing Price</span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">{currencySymbol}</span>
                            <input 
                              {...register('mrp')}
                              type="number" 
                              placeholder="e.g. 1000"
                              className="w-full pl-8 p-3.5 bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm font-medium" 
                            />
                          </div>
                          <p className="text-[10px] text-gray-400">Reference price crossed out on product card</p>
                        </div>

                        {/* 2. Selling Price (Actual Customer Price) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-800">
                              Selling Price ({currencySymbol}) *
                            </label>
                            <span className="text-[10px] font-bold text-[#FF5A36]">Actual Price</span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">{currencySymbol}</span>
                            <input 
                              {...register('sellingPrice')}
                              type="number" 
                              placeholder="e.g. 500"
                              className={`w-full pl-8 p-3.5 bg-white border ${errors.sellingPrice ? 'border-red-500' : 'border-[#E5E2DC]'} rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm font-bold text-[#171717]`} 
                            />
                          </div>
                          {errors.sellingPrice ? (
                            <span className="text-xs text-red-500">{errors.sellingPrice.message}</span>
                          ) : (
                            <p className="text-[10px] text-gray-400">Actual amount the customer pays at checkout</p>
                          )}
                        </div>

                        {/* 3. Cost Price (Wholesale / Internal) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-800">
                              Cost Price ({currencySymbol})
                            </label>
                            <span className="text-[10px] text-gray-500 font-medium">Internal Only</span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">{currencySymbol}</span>
                            <input 
                              {...register('costPrice')}
                              type="number" 
                              placeholder="e.g. 350"
                              className="w-full pl-8 p-3.5 bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm font-medium" 
                            />
                          </div>
                          <p className="text-[10px] text-gray-400">Your wholesale cost (used for merchant margin)</p>
                        </div>
                      </div>

                      {/* Live Discount Preview Badge */}
                      {liveDiscount > 0 && (
                        <div className="p-3 bg-orange-50/80 border border-orange-200/80 rounded-xl flex items-center justify-between animate-in fade-in duration-200">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🎉</span>
                            <div>
                              <p className="text-xs font-bold text-[#FF5A36]">
                                {liveDiscount}% OFF discount badge will appear on your product card!
                              </p>
                              <p className="text-[11px] text-gray-500">
                                Buyers will see: <span className="line-through text-gray-400">{currencySymbol}{watchMrp}</span> → <span className="font-extrabold text-[#171717]">{currencySymbol}{watchSellingPrice}</span>
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-black text-[#FF5A36] bg-white px-2.5 py-1 rounded-md border border-orange-200 shadow-2xs shrink-0">
                            {liveDiscount}% OFF
                          </span>
                        </div>
                      )}

                      {watchMrp > 0 && watchSellingPrice > watchMrp && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
                          <span>⚠️</span>
                          <span>Selling price ({currencySymbol}{watchSellingPrice}) is greater than MRP ({currencySymbol}{watchMrp}). To display a discount, MRP should be greater than selling price.</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* MANDATORY STOCK QUANTITY */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-800">
                      Stock Quantity <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Required</span>
                  </div>
                  <input 
                    {...register('stockCount')}
                    type="number" 
                    step="1"
                    min="0"
                    placeholder="e.g. 50"
                    className={`w-full p-3.5 bg-white border ${errors.stockCount ? 'border-red-500' : 'border-[#E5E2DC]'} rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-sm font-medium`} 
                  />
                  {errors.stockCount ? (
                    <span className="text-xs text-red-500">{errors.stockCount.message}</span>
                  ) : (
                    <p className="text-[10px] text-gray-400">Total available stock units for customer orders</p>
                  )}
                </div>
              </>
            ) : (
              /* MODERN VARIANT MANAGEMENT CARD & BOTTOM SHEET TRIGGER */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-brand-orange" />
                    <h3 className="font-bold text-brand-navy text-base">Product Variants</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-brand-orange">
                    {(watch('variants') || []).length} {((watch('variants') || []).length === 1) ? 'Option' : 'Options'}
                  </span>
                </div>

                {(watch('variants') || []).length === 0 ? (
                  <div 
                    onClick={() => setIsVariantsSheetOpen(true)}
                    className="p-8 bg-gray-50 border-2 border-dashed border-orange-200 hover:border-brand-orange rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-orange-100 text-brand-orange flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Layers className="w-7 h-7" />
                    </div>
                    <p className="font-bold text-gray-900 text-sm">Add Sizes, Colors & Options</p>
                    <p className="text-xs text-gray-500 max-w-xs mt-1">
                      Configure individual pricing, mandatory stock inventory, and photos in the variant sheet.
                    </p>
                    <Button
                      type="button"
                      className="mt-4 h-10 px-5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Variant Options
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Summary Banner */}
                    <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-800">
                          Total Stock: <span className="text-[#FF5A36] font-extrabold">{totalVariantStock} units</span>
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Across {(watch('variants') || []).length} configured variants
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsVariantsSheetOpen(true)}
                        className="h-8 px-3 rounded-lg border-brand-orange text-brand-orange hover:bg-orange-100/50 font-bold text-xs cursor-pointer"
                      >
                        Manage All
                      </Button>
                    </div>

                    {/* Preview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(watch('variants') || []).map((v: any, index: number) => {
                        const previewImg = v.localPreview || (v.imageUrl ? getMediaUrl(v.imageUrl) : '');
                        return (
                          <div 
                            key={index} 
                            onClick={() => setIsVariantsSheetOpen(true)}
                            className="p-3 bg-white border border-[#E5E2DC] hover:border-gray-300 rounded-xl shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                {previewImg ? (
                                  <img src={previewImg} alt={v.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-bold text-xs text-gray-400">
                                    {v.name ? v.name.slice(0, 2).toUpperCase() : 'V'}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-gray-900 truncate">{v.name}</p>
                                <p className="text-[11px] text-gray-500 font-semibold">{currencySymbol}{v.price} • {v.stockCount} in stock</p>
                              </div>
                            </div>
                            <span className="text-gray-400 text-xs shrink-0">Edit →</span>
                          </div>
                        );
                      })}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsVariantsSheetOpen(true)}
                      className="w-full h-11 rounded-xl border-dashed border-2 border-brand-orange/40 text-brand-orange hover:bg-orange-50 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add / Edit Variant Options
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            <div className="pt-2 border-t border-[#E5E2DC] mt-4 space-y-3">
              <h3 className="font-semibold text-brand-navy">Fulfillment Options</h3>

              {/* Free Delivery Toggle */}
              <label className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E5E2DC]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-gray-900">Free Delivery Included</p>
                    <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Free Shipping
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Offer free shipping to buyers (delivery fee fulfilled by store)</p>
                </div>
                <input 
                  type="checkbox" 
                  {...register('isDeliveryIncluded')}
                  className="w-5 h-5 accent-brand-orange" 
                />
              </label>

              <label className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E5E2DC]">
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
        );
      })()}

        {currentStep === 3 && (() => {
          const mediaList = watch('media') || [];
          const primaryMedia = mediaList.find((m: any) => m.isPrimary && m.type !== 'VIDEO') 
            || mediaList.find((m: any) => m.type !== 'VIDEO')
            || mediaList[0];
          const previewImageUrl = primaryMedia?.url || '';

          const hasVariants = watch('hasVariants');
          const variants = watch('variants') || [];
          const primaryVariant = variants.length > 0 ? variants[0] : null;

          const rawSellingPrice = watch('sellingPrice');
          const rawMrp = watch('mrp');
          const rawStockCount = watch('stockCount');

          const previewPrice = hasVariants && primaryVariant
            ? (Number(primaryVariant.price) || 0)
            : (rawSellingPrice !== undefined && rawSellingPrice !== null && !isNaN(Number(rawSellingPrice)) ? Number(rawSellingPrice) : 0);

          const previewMrp = hasVariants && primaryVariant
            ? (rawMrp ? Number(rawMrp) : undefined)
            : (rawMrp !== undefined && rawMrp !== null && !isNaN(Number(rawMrp)) ? Number(rawMrp) : undefined);

          const previewStock = hasVariants && variants.length > 0
            ? variants.reduce((sum: number, v: any) => sum + (Number(v?.stockCount) || 0), 0)
            : (rawStockCount !== undefined && rawStockCount !== null && !isNaN(Number(rawStockCount)) ? Number(rawStockCount) : undefined);

          return (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 text-brand-navy">
                <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
                <div>
                  <h2 className="text-xl font-bold leading-tight">Ready to Publish</h2>
                  <p className="text-xs text-gray-500 font-medium">Customer store card preview</p>
                </div>
              </div>
              
              {/* Exact Product Card Preview */}
              <div className="bg-white rounded-2xl border border-[#E5E2DC] p-5 shadow-xs flex flex-col items-center">
                <div className="w-full max-w-[240px]">
                  <ProductCard
                    isPreview={true}
                    product={{
                      id: 'preview',
                      title: watch('name') || 'Product Name',
                      name: watch('name') || 'Product Name',
                      brand: storeData?.storeName || storeData?.name || 'Store',
                      image: previewImageUrl,
                      imageUrl: previewImageUrl,
                      sellingPrice: previewPrice,
                      price: previewPrice,
                      originalPrice: previewMrp,
                      mrp: previewMrp,
                      store: {
                        id: storeData?.id,
                        name: storeData?.storeName || storeData?.name || 'Store',
                        isVerified: Boolean(storeData?.isVerified && storeData?.verificationStatus === 'APPROVED')
                      },
                      stockCount: previewStock,
                      variants: variants,
                    }}
                  />
                </div>

                {/* Delivery & Category Badges */}
                <div className="w-full pt-4 mt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-center items-center">
                  {watch('category') && (
                    <span className="bg-orange-50 text-brand-orange text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {categories.find((c: any) => c.id === watch('category'))?.name || watch('category')}
                    </span>
                  )}
                  {watch('isAvailableForDelivery') && (
                    <span className="bg-green-50 text-green-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      ✓ Delivery Available
                    </span>
                  )}
                  {watch('isAvailableForPickup') && (
                    <span className="bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      ✓ Store Pickup
                    </span>
                  )}
                  {hasVariants && variants.length > 0 && (
                    <span className="bg-purple-50 text-purple-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      {variants.length} Variants ({previewStock ?? 0} in stock)
                    </span>
                  )}
                  {watch('sku') && (
                    <span className="bg-slate-100 text-slate-800 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border border-slate-200">
                      SKU: {watch('sku')}
                    </span>
                  )}
                </div>

                {watch('description') && (
                  <div className="w-full mt-3 text-xs text-gray-500 text-center line-clamp-2 px-2">
                    {watch('description')}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E2DC] p-4 flex gap-3 z-50 md:left-64">
        {currentStep < STEPS.length - 1 ? (
          <div className="flex w-full gap-3">
            <Button 
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting || isUpdatingProduct || isSavingDraft}
              className="h-12 px-4 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 text-xs sm:text-sm shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Draft'
              )}
            </Button>
            <Button 
              onClick={handleNext}
              className="flex-1 h-12 bg-brand-navy hover:bg-brand-dark-navy text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex w-full gap-3">
             <Button 
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting || isUpdatingProduct || isSavingDraft}
              className="flex-1 h-12 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save as Draft'
              )}
            </Button>
            <Button 
              onClick={handleSubmit(onSubmit, onInvalid)}
              disabled={isSubmitting || isUpdatingProduct || isSavingDraft}
              className="flex-1 h-12 bg-brand-orange hover:bg-[#E04B2A] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {(isSubmitting || isUpdatingProduct) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Publishing...</span>
                </>
              ) : (
                'Publish Product'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* AI Studio Bottom Sheet */}
      <AiStudioBottomSheet
        isOpen={isAiStudioOpen}
        onClose={() => setIsAiStudioOpen(false)}
        onApplyPhotos={handleApplyAiPhotos}
        productName={watch('name')}
        category={categories.find((c: any) => c.id === watch('category'))?.name || watch('category')}
      />

      {/* Variants Bottom Sheet */}
      <VariantsBottomSheet
        isOpen={isVariantsSheetOpen}
        onClose={() => setIsVariantsSheetOpen(false)}
        variants={(watch('variants') || []) as VariantItem[]}
        onChange={(updated) => {
          setValue('variants', updated as any, { shouldDirty: true, shouldValidate: true });
          replaceVariants(updated as any);
        }}
        parentSku={watch('sku') || generateStandardSku()}
        currencySymbol={currencySymbol}
        availableImages={(watch('media') || []).map((m: any) => m.url).filter(Boolean)}
      />
    </div>
  );
}

export default function ManualAddProductPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#FAF9F6]">
        <div className="w-8 h-8 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ManualAddProductForm />
    </Suspense>
  );
}
