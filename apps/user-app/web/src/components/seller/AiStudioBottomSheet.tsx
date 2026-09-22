'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Upload, 
  Camera, 
  RefreshCw, 
  Check, 
  Maximize2, 
  CheckCircle2, 
  Sliders, 
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUploadMediaMutation } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';

export interface GeneratedProductDetails {
  name?: string;
  description?: string;
  category?: string;
  sellingPrice?: number | null;
  costPrice?: number | null;
  mrp?: number | null;
}

interface ShotItem {
  id: string;
  title: string;
  badge: string;
  description?: string;
  prompt?: string;
  status: 'pending' | 'rendering' | 'ready' | 'error';
  base64?: string;
  url?: string;
  publicUrl?: string;
}

interface AiStudioBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPhotos: (
    photos: Array<{ url: string; type: 'IMAGE'; isPrimary?: boolean; displayOrder: number }>,
    details?: GeneratedProductDetails
  ) => void;
  productName?: string;
  category?: string;
}

const DEFAULT_SHOTS: ShotItem[] = [
  { id: 'hero', title: 'Hero Studio Shot', badge: 'HERO', description: 'Clean minimalist studio shot with softbox lighting', status: 'pending' },
  { id: 'lifestyle', title: 'Lifestyle Context', badge: 'LIFESTYLE', description: 'In-situ ambient environment tailored to product', status: 'pending' },
  { id: 'detail', title: 'Macro & Detail', badge: 'DETAIL', description: 'Extreme close-up highlighting craftsmanship & texture', status: 'pending' },
  { id: 'perspective', title: 'Angle & Dimension', badge: 'PERSPECTIVE', description: 'Dynamic 45° isometric silhouette shot', status: 'pending' },
  { id: 'editorial', title: 'Creative Editorial', badge: 'EDITORIAL', description: 'Artistic high-fashion staging with props', status: 'pending' },
];

export function AiStudioBottomSheet({
  isOpen,
  onClose,
  onApplyPhotos,
  productName = '',
  category = '',
}: AiStudioBottomSheetProps) {
  const [uploadMedia] = useUploadMediaMutation();

  // Local States
  const [step, setStep] = useState<'UPLOAD' | 'GENERATING' | 'RESULTS'>('UPLOAD');
  const [image1, setImage1] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string>('');
  const [image2, setImage2] = useState<File | null>(null);
  const [preview2, setPreview2] = useState<string>('');
  const [productNotes, setProductNotes] = useState<string>('');
  const [autoFillDetails, setAutoFillDetails] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [regenerationsLeft, setRegenerationsLeft] = useState<number>(2);

  // Live progressive shots & details
  const [shots, setShots] = useState<ShotItem[]>(DEFAULT_SHOTS);
  const [generatedDetails, setGeneratedDetails] = useState<GeneratedProductDetails | undefined>(undefined);
  const [selectedShotIds, setSelectedShotIds] = useState<string[]>([]);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [generationStageText, setGenerationStageText] = useState<string>('Analyzing product details & geometry...');
  const [isUploadingToStorage, setIsUploadingToStorage] = useState<boolean>(false);
  const [activePickerSlot, setActivePickerSlot] = useState<1 | 2 | null>(null);

  const galleryInputRef1 = useRef<HTMLInputElement>(null);
  const cameraInputRef1 = useRef<HTMLInputElement>(null);
  const galleryInputRef2 = useRef<HTMLInputElement>(null);
  const cameraInputRef2 = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Clean previews on unmount
  useEffect(() => {
    return () => {
      if (preview1 && preview1.startsWith('blob:')) URL.revokeObjectURL(preview1);
      if (preview2 && preview2.startsWith('blob:')) URL.revokeObjectURL(preview2);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [preview1, preview2]);

  if (!isOpen) return null;

  const handleImagePick = (file: File, slot: 1 | 2) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (JPG, PNG or WebP)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be under 20MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (slot === 1) {
      setImage1(file);
      setPreview1(previewUrl);
    } else {
      setImage2(file);
      setPreview2(previewUrl);
    }
  };

  const removeImage = (slot: 1 | 2) => {
    if (slot === 1) {
      if (preview1.startsWith('blob:')) URL.revokeObjectURL(preview1);
      setImage1(null);
      setPreview1('');
    } else {
      if (preview2.startsWith('blob:')) URL.revokeObjectURL(preview2);
      setImage2(null);
      setPreview2('');
    }
  };

  const handleStartGeneration = async (isRegenerating = false) => {
    if (!image1 && !image2) {
      toast.error('Please upload at least 1 product reference photo');
      return;
    }

    if (isRegenerating && regenerationsLeft <= 0) {
      toast.error('No regenerations left for this product session');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setStep('GENERATING');
    setGenerationStageText('Multimodal vision analyzing product geometry & styling...');

    // Initialize 5 shots in rendering state
    const initialShots: ShotItem[] = DEFAULT_SHOTS.map(s => ({
      ...s,
      status: 'rendering',
      base64: undefined
    }));
    setShots(initialShots);
    setSelectedShotIds([]);

    const formData = new FormData();
    if (image1) formData.append('images', image1);
    if (image2) formData.append('images', image2);
    if (productName) formData.append('productName', productName);
    if (category) formData.append('category', category);
    if (isRegenerating ? customPrompt : productNotes) {
      formData.append('customPrompt', isRegenerating ? customPrompt : productNotes);
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1';

    try {
      const response = await fetch(`${apiBase}/media/ai-photoshoot-stream`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned ${response.status}: Failed to start photoshoot stream`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const events = streamBuffer.split('\n\n');
        streamBuffer = events.pop() || '';

        for (const block of events) {
          if (!block.trim()) continue;
          let eventType = 'message';
          let dataStr = '';

          for (const line of block.split('\n')) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.replace('data: ', '').trim();
            }
          }

          if (!dataStr) continue;

          try {
            const parsedData = JSON.parse(dataStr);

            if (eventType === 'plan_ready') {
              setGenerationStageText('Rendering 5 studio commercial angles in parallel...');
              if (parsedData.generatedDetails) {
                setGeneratedDetails(parsedData.generatedDetails);
              }
              if (parsedData.shots && Array.isArray(parsedData.shots)) {
                setShots(parsedData.shots.map((s: any) => ({
                  id: s.id,
                  title: s.title,
                  badge: s.badge,
                  description: s.description,
                  prompt: s.prompt,
                  status: 'rendering'
                })));
              }
            } else if (eventType === 'shot_complete') {
              setShots(prev => {
                const nextShots = prev.map(s => {
                  if (s.id === parsedData.id) {
                    return {
                      ...s,
                      title: parsedData.title || s.title,
                      badge: parsedData.badge || s.badge,
                      description: parsedData.description || s.description,
                      status: 'ready' as const,
                      base64: parsedData.base64
                    };
                  }
                  return s;
                });
                return nextShots;
              });

              // Automatically select the completed shot
              setSelectedShotIds(prev => prev.includes(parsedData.id) ? prev : [...prev, parsedData.id]);
              setGenerationStageText(`Generating studio angles (${parsedData.completedCount || 1} of 5 ready)...`);
            } else if (eventType === 'shot_error') {
              setShots(prev => prev.map(s => {
                if (s.id === parsedData.id) {
                  return { ...s, status: 'error' as const };
                }
                return s;
              }));
            } else if (eventType === 'done') {
              if (isRegenerating) {
                setRegenerationsLeft(prev => Math.max(0, prev - 1));
                toast.success('Photos updated with your custom direction');
              } else {
                toast.success('Studio photos generated successfully!');
              }
              setStep('RESULTS');
            }
          } catch (jsonErr) {
            console.warn('Error parsing SSE block:', jsonErr);
          }
        }
      }

      setStep('RESULTS');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Photoshoot generation aborted by user');
        return;
      }
      console.error('Error in streaming AI photoshoot:', err);
      toast.error(err?.message || 'Photoshoot generation encountered an issue');
      setStep('RESULTS');
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onClose();
  };

  const toggleShotSelection = (shotId: string) => {
    setSelectedShotIds(prev => 
      prev.includes(shotId) ? prev.filter(id => id !== shotId) : [...prev, shotId]
    );
  };

  const readyShots = shots.filter(s => s.status === 'ready' && Boolean(s.base64 || s.url || s.publicUrl));

  const toggleSelectAll = () => {
    if (selectedShotIds.length === readyShots.length) {
      setSelectedShotIds([]);
    } else {
      setSelectedShotIds(readyShots.map(s => s.id));
    }
  };

  /**
   * Save selected images to R2 storage ONLY when user approves & adds them
   */
  const handleApplyToProduct = async () => {
    const selected = readyShots.filter(s => selectedShotIds.includes(s.id));
    if (selected.length === 0) {
      toast.error('Please select at least 1 image to add');
      return;
    }

    setIsUploadingToStorage(true);
    const toastId = toast.loading(`Uploading ${selected.length} studio photos to media storage...`);

    try {
      const uploadedPhotos: Array<{ url: string; type: 'IMAGE'; isPrimary?: boolean; displayOrder: number }> = [];

      for (let idx = 0; idx < selected.length; idx++) {
        const shot = selected[idx];
        let finalUrl = shot.url || shot.publicUrl || '';

        // If photo is in base64 data URL, upload to R2
        if (shot.base64 && shot.base64.startsWith('data:image/')) {
          const blobRes = await fetch(shot.base64);
          const blob = await blobRes.blob();
          const file = new File([blob], `ai-studio-${shot.id}-${Date.now()}.jpg`, { type: 'image/jpeg' });

          const uploadFormData = new FormData();
          uploadFormData.append('file', file);

          const uploadResult = await uploadMedia(uploadFormData).unwrap();
          finalUrl = uploadResult.publicUrl || uploadResult.url || '';
        }

        if (finalUrl) {
          uploadedPhotos.push({
            url: finalUrl,
            type: 'IMAGE',
            isPrimary: shot.id === 'hero' || idx === 0,
            displayOrder: idx
          });
        }
      }

      toast.dismiss(toastId);

      if (uploadedPhotos.length === 0) {
        throw new Error('Failed to upload photos to storage');
      }

      onApplyPhotos(uploadedPhotos, autoFillDetails ? generatedDetails : undefined);
      toast.success(`Added ${uploadedPhotos.length} studio photos to product!`);
      onClose();
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error('Error uploading selected photos to storage:', err);
      toast.error(err?.data?.error || err?.message || 'Failed to save photos to media storage');
    } finally {
      setIsUploadingToStorage(false);
    }
  };

  const completedReadyCount = readyShots.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={handleCancel}
      />

      {/* Main Sheet Modal Container */}
      <div className="relative w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#E5E2DC] z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Mobile Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Corporate Header */}
        <div className="px-6 py-4 border-b border-[#E5E2DC] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-brand-navy border border-slate-200 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-brand-navy" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-brand-navy">AI Product Studio</h3>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                  {step === 'GENERATING' ? `${completedReadyCount} of 5 Ready` : '5 Studio Angles'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {step === 'GENERATING' 
                  ? generationStageText 
                  : 'Generate studio catalog photos & auto-fill product details'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleCancel}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sheet Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-white">

          {/* STEP 1: UPLOAD REFERENCE PHOTOS & NOTES */}
          {step === 'UPLOAD' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Upload Slots Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Slot 1: Front / Primary */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>Angle 1: Front *</span>
                    <span className="text-brand-orange text-[10px] font-bold">Required</span>
                  </div>

                  {/* Hidden Inputs for Slot 1: Gallery & Camera */}
                  <input 
                    type="file" 
                    ref={galleryInputRef1} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImagePick(e.target.files[0], 1);
                    }}
                  />
                  <input 
                    type="file" 
                    ref={cameraInputRef1} 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImagePick(e.target.files[0], 1);
                    }}
                  />

                  {preview1 ? (
                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-brand-navy bg-gray-50 group">
                      <img src={preview1} alt="Angle 1" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setActivePickerSlot(1)}
                          className="bg-white text-gray-900 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs hover:bg-gray-100 cursor-pointer"
                        >
                          Change
                        </button>
                        <button 
                          onClick={() => removeImage(1)}
                          className="bg-red-600 text-white p-1.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-red-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setActivePickerSlot(1)}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#E5E2DC] hover:border-brand-navy bg-[#FAF9F6] hover:bg-white flex flex-col items-center justify-center p-3 cursor-pointer transition-colors text-center group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E2DC] text-gray-500 group-hover:text-brand-navy flex items-center justify-center mb-1.5 transition-colors">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-gray-800">Primary Angle</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">Camera or Gallery</span>
                    </div>
                  )}
                </div>

                {/* Slot 2: Side / Detail Angle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>Angle 2: Side/Detail</span>
                    <span className="text-gray-400 text-[10px]">Optional</span>
                  </div>

                  {/* Hidden Inputs for Slot 2: Gallery & Camera */}
                  <input 
                    type="file" 
                    ref={galleryInputRef2} 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImagePick(e.target.files[0], 2);
                    }}
                  />
                  <input 
                    type="file" 
                    ref={cameraInputRef2} 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImagePick(e.target.files[0], 2);
                    }}
                  />

                  {preview2 ? (
                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-brand-navy bg-gray-50 group">
                      <img src={preview2} alt="Angle 2" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setActivePickerSlot(2)}
                          className="bg-white text-gray-900 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs hover:bg-gray-100 cursor-pointer"
                        >
                          Change
                        </button>
                        <button 
                          onClick={() => removeImage(2)}
                          className="bg-red-600 text-white p-1.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-red-700 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setActivePickerSlot(2)}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#E5E2DC] hover:border-brand-navy bg-[#FAF9F6] hover:bg-white flex flex-col items-center justify-center p-3 cursor-pointer transition-colors text-center group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E2DC] text-gray-500 group-hover:text-brand-navy flex items-center justify-center mb-1.5 transition-colors">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-gray-800">Second Angle</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">Camera or Gallery</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Description / Notes Box */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>Describe your product (Optional)</span>
                  <span className="text-[10px] text-gray-400">Include features or price</span>
                </label>
                <textarea 
                  value={productNotes}
                  onChange={(e) => setProductNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Handmade cotton shirt, slim fit, breathable, Price 899, MRP 1499"
                  className="w-full p-3 bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy text-xs resize-none"
                />
              </div>

              {/* Auto-fill details checkbox */}
              <label className="flex items-center gap-2.5 bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E2DC] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoFillDetails} 
                  onChange={(e) => setAutoFillDetails(e.target.checked)}
                  className="w-4 h-4 accent-brand-navy rounded cursor-pointer"
                />
                <div className="text-xs">
                  <p className="font-semibold text-brand-navy">Auto-fill product details & pricing</p>
                  <p className="text-[11px] text-gray-500">Automatically creates title, description and prices for the product</p>
                </div>
              </label>

              {/* Shoot CTA */}
              <div className="pt-2">
                <Button 
                  onClick={() => handleStartGeneration(false)}
                  disabled={!image1 && !image2}
                  className="w-full h-12 rounded-xl bg-brand-navy hover:bg-brand-dark-navy text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate 5 Studio Photos
                </Button>
              </div>
            </div>
          )}

          {/* LIVE PROGRESSIVE GENERATION & RESULTS VIEW */}
          {(step === 'GENERATING' || step === 'RESULTS') && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Top Controls Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E2DC]">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-brand-navy">
                      {step === 'GENERATING' ? 'Generating Studio Catalog...' : `${readyShots.length} Photos Ready`}
                    </h4>
                    {step === 'GENERATING' && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-navy" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {step === 'GENERATING' 
                      ? `${completedReadyCount} of 5 generated in parallel (displaying in real-time)` 
                      : 'Select which photos to include in your catalog'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleSelectAll}
                    disabled={readyShots.length === 0}
                    className="text-xs font-semibold text-brand-navy bg-slate-100 hover:bg-slate-200 disabled:opacity-40 px-3 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    {selectedShotIds.length === readyShots.length && readyShots.length > 0 
                      ? 'Deselect All' 
                      : `Select All (${readyShots.length})`}
                  </button>
                </div>
              </div>

              {/* Photos & Progressive Skeletons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {shots.map((shot) => {
                  const isReady = shot.status === 'ready' && Boolean(shot.base64 || shot.url || shot.publicUrl);
                  const isSelected = selectedShotIds.includes(shot.id);
                  const isHero = shot.id === 'hero';
                  const imgSrc = shot.base64 || getMediaUrl(shot.url || shot.publicUrl || '');

                  if (isReady && imgSrc) {
                    return (
                      <div 
                        key={shot.id} 
                        onClick={() => toggleShotSelection(shot.id)}
                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all border-2 group bg-gray-50 animate-in zoom-in-95 duration-300 ${
                          isSelected 
                            ? 'border-brand-navy ring-2 ring-brand-navy/20' 
                            : 'border-[#E5E2DC] opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={imgSrc} 
                          alt={shot.title} 
                          className="w-full h-full object-cover"
                        />

                        {/* Top Badge */}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shadow-xs ${
                            isHero 
                              ? 'bg-brand-navy text-white' 
                              : 'bg-slate-900/80 text-white'
                          }`}>
                            {shot.badge || shot.id}
                          </span>
                        </div>

                        {/* Enlarge Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewModalUrl(imgSrc);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/60 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>

                        {/* Bottom Selection Bar */}
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end justify-between">
                          <span className="text-[10px] font-semibold text-white truncate max-w-[80%]">
                            {shot.title}
                          </span>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-brand-navy text-white' : 'bg-white/40 border border-white/80'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Rendering / Pending State Card
                  return (
                    <div 
                      key={shot.id} 
                      className="relative aspect-square rounded-xl border border-dashed border-gray-300 bg-slate-50/80 flex flex-col items-center justify-center p-3 text-center overflow-hidden"
                    >
                      {/* Top Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-gray-200 text-gray-700">
                          {shot.badge || shot.id}
                        </span>
                      </div>

                      {shot.status === 'error' ? (
                        <div className="flex flex-col items-center gap-1 text-gray-400">
                          <AlertCircle className="w-6 h-6 text-amber-500" />
                          <span className="text-[11px] font-semibold text-gray-700">{shot.title}</span>
                          <span className="text-[9px] text-amber-600">Retrying...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="relative w-8 h-8 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-brand-navy/30 border-t-brand-navy rounded-full animate-spin" />
                            <Sparkles className="w-3.5 h-3.5 text-brand-navy absolute" />
                          </div>
                          <span className="text-[11px] font-bold text-brand-navy">{shot.title}</span>
                          <span className="text-[9px] text-gray-400 animate-pulse">Rendering angle...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Generated Details Preview Banner */}
              {generatedDetails?.name && autoFillDetails && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Auto-Generated Product Details Ready
                  </div>
                  <p className="text-[11px] text-blue-800 line-clamp-1">
                    <span className="font-semibold">Title:</span> {generatedDetails.name}
                  </p>
                  {generatedDetails.sellingPrice && (
                    <p className="text-[10px] text-blue-700">
                      <span className="font-semibold">Detected Price:</span> ₹{generatedDetails.sellingPrice} {generatedDetails.mrp ? `(MRP: ₹${generatedDetails.mrp})` : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Refinement Box (Shown only in Results step) */}
              {step === 'RESULTS' && (
                <div className="p-3.5 bg-[#FAF9F6] border border-[#E5E2DC] rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-navy flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-brand-navy" />
                      Refine Lighting & Staging
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {regenerationsLeft} regenerations left
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g. Darker background, soft warm lighting..."
                      className="flex-1 px-3 py-2 text-xs bg-white border border-[#E5E2DC] rounded-xl outline-none focus:ring-2 focus:ring-brand-navy"
                    />
                    <Button 
                      onClick={() => handleStartGeneration(true)}
                      disabled={regenerationsLeft <= 0}
                      variant="outline"
                      className="h-auto py-2 px-3 text-xs font-bold border-[#E5E2DC] text-brand-navy hover:bg-white rounded-xl shrink-0 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E5E2DC] bg-white flex items-center justify-between gap-3">
          {step === 'RESULTS' || (step === 'GENERATING' && completedReadyCount > 0) ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (abortControllerRef.current) abortControllerRef.current.abort();
                  setStep('UPLOAD');
                }} 
                className="h-11 px-4 text-xs font-semibold text-gray-700 border-[#E5E2DC] rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Upload Different Photos
              </Button>
              <Button 
                onClick={handleApplyToProduct}
                disabled={selectedShotIds.length === 0 || isUploadingToStorage}
                className="flex-1 h-11 bg-brand-orange hover:bg-[#E04B2A] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploadingToStorage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Photos to Media Storage...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Add Selected ({selectedShotIds.length}) to Product
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                className="h-11 px-5 text-xs font-semibold text-gray-700 border-[#E5E2DC] rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </Button>
              <p className="text-[11px] text-gray-400 font-medium">
                Lokaya Virtual Photography Engine
              </p>
            </>
          )}
        </div>

        {/* Full Image Preview Zoom Modal */}
        {previewModalUrl && (
          <div 
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPreviewModalUrl(null)}
          >
            <div className="relative max-w-2xl max-h-[85vh] w-full rounded-xl overflow-hidden shadow-2xl bg-black">
              <img src={previewModalUrl} alt="Studio Preview" className="w-full h-full object-contain" />
              <button 
                onClick={() => setPreviewModalUrl(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Camera / Gallery Source Picker Action Sheet */}
        {activePickerSlot !== null && (
          <div 
            className="fixed inset-0 z-70 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={() => setActivePickerSlot(null)}
          >
            <div 
              className="w-full sm:max-w-xs bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-gray-100 space-y-3 animate-in slide-in-from-bottom-4 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center pb-1">
                <h4 className="text-sm font-bold text-gray-900">Add Product Photo</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Choose source for Angle {activePickerSlot}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {/* Option 1: Take Photo with Camera */}
                <button
                  type="button"
                  onClick={() => {
                    const slot = activePickerSlot;
                    setActivePickerSlot(null);
                    if (slot === 1) cameraInputRef1.current?.click();
                    if (slot === 2) cameraInputRef2.current?.click();
                  }}
                  className="flex items-center gap-3 w-full p-3 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] rounded-xl border border-slate-200/80 transition-all cursor-pointer group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-orange-50 text-[#FF5A36] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5 text-[#FF5A36]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Take Photo</span>
                    <span className="text-[10px] text-gray-400">Use device camera</span>
                  </div>
                </button>

                {/* Option 2: Choose from Photo Library / Gallery */}
                <button
                  type="button"
                  onClick={() => {
                    const slot = activePickerSlot;
                    setActivePickerSlot(null);
                    if (slot === 1) galleryInputRef1.current?.click();
                    if (slot === 2) galleryInputRef2.current?.click();
                  }}
                  className="flex items-center gap-3 w-full p-3 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] rounded-xl border border-slate-200/80 transition-all cursor-pointer group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Choose from Gallery</span>
                    <span className="text-[10px] text-gray-400">Select from photo library</span>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActivePickerSlot(null)}
                className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
