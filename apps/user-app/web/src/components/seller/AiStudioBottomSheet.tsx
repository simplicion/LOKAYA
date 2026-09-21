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
  ArrowRight,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useGenerateAiPhotoshootMutation } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';

export interface GeneratedProductDetails {
  name?: string;
  description?: string;
  category?: string;
  sellingPrice?: number | null;
  costPrice?: number | null;
  mrp?: number | null;
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

export function AiStudioBottomSheet({
  isOpen,
  onClose,
  onApplyPhotos,
  productName = '',
  category = '',
}: AiStudioBottomSheetProps) {
  const [generatePhotoshoot, { isLoading: isGeneratingApi }] = useGenerateAiPhotoshootMutation();

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
  const [generatedShots, setGeneratedShots] = useState<any[]>([]);
  const [generatedDetails, setGeneratedDetails] = useState<GeneratedProductDetails | undefined>(undefined);
  const [selectedShotIds, setSelectedShotIds] = useState<string[]>([]);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [generationStageText, setGenerationStageText] = useState<string>('Analyzing product geometry, materials & notes...');

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

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

    setStep('GENERATING');

    const stage1Timer = setTimeout(() => {
      setGenerationStageText('Setting studio lighting, shadows and background...');
    }, 3500);

    const stage2Timer = setTimeout(() => {
      setGenerationStageText('Rendering 5 studio commercial angles...');
    }, 7000);

    const formData = new FormData();
    if (image1) formData.append('images', image1);
    if (image2) formData.append('images', image2);
    if (productName) formData.append('productName', productName);
    if (category) formData.append('category', category);
    if (isRegenerating ? customPrompt : productNotes) {
      formData.append('customPrompt', isRegenerating ? customPrompt : productNotes);
    }

    try {
      const response = await generatePhotoshoot(formData).unwrap();

      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);

      if (response.shots && response.shots.length > 0) {
        setGeneratedShots(response.shots);
        setSelectedShotIds(response.shots.map((s: any) => s.id));
        if (response.generatedDetails) {
          setGeneratedDetails(response.generatedDetails);
        }
        if (isRegenerating) {
          setRegenerationsLeft(prev => Math.max(0, prev - 1));
          toast.success('Photos updated with your custom direction');
        } else {
          toast.success('5 Studio photos generated successfully');
        }
        setStep('RESULTS');
      } else {
        toast.info(response.message || 'AI Studio prompt planning completed.');
        setStep('UPLOAD');
      }
    } catch (err: any) {
      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);
      console.error('Error generating AI photoshoot:', err);
      toast.error(err?.data?.error || err?.message || 'Failed to complete photoshoot');
      setStep('UPLOAD');
    }
  };

  const toggleShotSelection = (shotId: string) => {
    setSelectedShotIds(prev => 
      prev.includes(shotId) ? prev.filter(id => id !== shotId) : [...prev, shotId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedShotIds.length === generatedShots.length) {
      setSelectedShotIds([]);
    } else {
      setSelectedShotIds(generatedShots.map(s => s.id));
    }
  };

  const handleApplyToProduct = () => {
    const selected = generatedShots.filter(s => selectedShotIds.includes(s.id));
    if (selected.length === 0) {
      toast.error('Please select at least 1 image to add');
      return;
    }

    const formattedPhotos = selected.map((s, idx) => ({
      url: s.url || s.publicUrl,
      type: 'IMAGE' as const,
      isPrimary: s.id === 'hero' || idx === 0,
      displayOrder: idx
    }));

    onApplyPhotos(formattedPhotos, autoFillDetails ? generatedDetails : undefined);
    toast.success(`Added ${formattedPhotos.length} studio photos to product`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
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
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                  5 Angles
                </span>
              </div>
              <p className="text-xs text-gray-500">Generate studio catalog photos & auto-fill product details</p>
            </div>
          </div>

          <button 
            onClick={onClose}
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

                  <input 
                    type="file" 
                    ref={fileInputRef1} 
                    accept="image/*" 
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
                          onClick={() => fileInputRef1.current?.click()}
                          className="bg-white text-gray-900 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs hover:bg-gray-100"
                        >
                          Change
                        </button>
                        <button 
                          onClick={() => removeImage(1)}
                          className="bg-red-600 text-white p-1.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-red-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef1.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#E5E2DC] hover:border-brand-navy bg-[#FAF9F6] hover:bg-white flex flex-col items-center justify-center p-3 cursor-pointer transition-colors text-center group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E2DC] text-gray-500 group-hover:text-brand-navy flex items-center justify-center mb-1.5 transition-colors">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-gray-800">Primary Angle</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">Front product photo</span>
                    </div>
                  )}
                </div>

                {/* Slot 2: Side / Detail Angle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>Angle 2: Side/Detail</span>
                    <span className="text-gray-400 text-[10px]">Optional</span>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef2} 
                    accept="image/*" 
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
                          onClick={() => fileInputRef2.current?.click()}
                          className="bg-white text-gray-900 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs hover:bg-gray-100"
                        >
                          Change
                        </button>
                        <button 
                          onClick={() => removeImage(2)}
                          className="bg-red-600 text-white p-1.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-red-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef2.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-[#E5E2DC] hover:border-brand-navy bg-[#FAF9F6] hover:bg-white flex flex-col items-center justify-center p-3 cursor-pointer transition-colors text-center group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E2DC] text-gray-500 group-hover:text-brand-navy flex items-center justify-center mb-1.5 transition-colors">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-gray-800">Second Angle</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">Side or texture shot</span>
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
                  <p className="text-[11px] text-gray-500">Automatically creates title, description and prices for the next step</p>
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

          {/* STEP 2: GENERATION IN PROGRESS */}
          {step === 'GENERATING' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-12 h-12 border-3 border-brand-navy border-t-transparent rounded-full animate-spin" />

              <div className="space-y-1 max-w-sm">
                <h4 className="text-base font-bold text-brand-navy">
                  Generating Studio Catalog
                </h4>
                <p className="text-xs text-brand-navy font-medium">
                  {generationStageText}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Rendering 5 high-resolution commercial views and drafting product details
                </p>
              </div>

              {/* Clean Skeletons */}
              <div className="grid grid-cols-5 gap-2 w-full max-w-md pt-3">
                {['Hero', 'Lifestyle', 'Detail', 'Perspective', 'Editorial'].map((name, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-square bg-gray-100 rounded-lg animate-pulse border border-[#E5E2DC]" />
                    <span className="text-[9px] font-semibold text-gray-500 uppercase">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: RESULTS GALLERY & APPROVAL */}
          {step === 'RESULTS' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Top Controls Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E2DC]">
                <div>
                  <h4 className="text-sm font-bold text-brand-navy">5 Studio Photos Generated</h4>
                  <p className="text-[11px] text-gray-500">Select which photos to include in your catalog</p>
                </div>
                <button 
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-brand-navy bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  {selectedShotIds.length === generatedShots.length ? 'Deselect All' : 'Select All (5)'}
                </button>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {generatedShots.map((shot) => {
                  const isSelected = selectedShotIds.includes(shot.id);
                  const isHero = shot.id === 'hero';

                  return (
                    <div 
                      key={shot.id} 
                      onClick={() => toggleShotSelection(shot.id)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all border-2 group bg-gray-50 ${
                        isSelected 
                          ? 'border-brand-navy ring-2 ring-brand-navy/20' 
                          : 'border-[#E5E2DC] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={getMediaUrl(shot.url || shot.publicUrl)} 
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
                          setPreviewModalUrl(getMediaUrl(shot.url || shot.publicUrl));
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
                })}
              </div>

              {/* Generated Details Preview Banner */}
              {generatedDetails?.name && autoFillDetails && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
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
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E5E2DC] bg-white flex items-center justify-between gap-3">
          {step === 'RESULTS' ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setStep('UPLOAD')} 
                className="h-11 px-4 text-xs font-semibold text-gray-700 border-[#E5E2DC] rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Upload Different Photos
              </Button>
              <Button 
                onClick={handleApplyToProduct}
                disabled={selectedShotIds.length === 0}
                className="flex-1 h-11 bg-brand-orange hover:bg-[#E04B2A] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Add Selected ({selectedShotIds.length}) to Product
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={onClose} 
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

      </div>
    </div>
  );
}
