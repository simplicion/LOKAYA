'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Upload, 
  Camera, 
  RefreshCw, 
  Check, 
  Layers, 
  Maximize2, 
  Info, 
  CheckCircle2, 
  Sliders, 
  Wand2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useGenerateAiPhotoshootMutation } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';

interface AiStudioBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPhotos: (photos: Array<{ url: string; type: 'IMAGE'; isPrimary?: boolean; displayOrder: number }>) => void;
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
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [regenerationsLeft, setRegenerationsLeft] = useState<number>(2);
  const [generatedShots, setGeneratedShots] = useState<any[]>([]);
  const [selectedShotIds, setSelectedShotIds] = useState<string[]>([]);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [generationStageText, setGenerationStageText] = useState<string>('Analyzing product materials and geometry...');

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
      toast.error('Please upload a valid image file (JPG or PNG)');
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
      toast.error('No custom regenerations left for this photoshoot session');
      return;
    }

    setStep('GENERATING');

    // Progressive stage animations
    const stage1Timer = setTimeout(() => {
      setGenerationStageText('Setting up dynamic 3-point studio lighting & softbox reflections...');
    }, 3500);

    const stage2Timer = setTimeout(() => {
      setGenerationStageText('Rendering 5 studio-grade commercial scenes & angles...');
    }, 7000);

    const formData = new FormData();
    if (image1) formData.append('images', image1);
    if (image2) formData.append('images', image2);
    if (productName) formData.append('productName', productName);
    if (category) formData.append('category', category);
    if (customPrompt) formData.append('customPrompt', customPrompt);

    try {
      const response = await generatePhotoshoot(formData).unwrap();

      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);

      if (response.shots && response.shots.length > 0) {
        setGeneratedShots(response.shots);
        // Select all shots by default
        setSelectedShotIds(response.shots.map((s: any) => s.id));
        if (isRegenerating) {
          setRegenerationsLeft(prev => Math.max(0, prev - 1));
          toast.success('Studio photos updated with your custom direction!');
        } else {
          toast.success('✨ 5 Studio photos generated successfully!');
        }
        setStep('RESULTS');
      } else {
        toast.info(response.message || 'AI Studio prompt planning completed. Configure GEMINI_API_KEY for live Imagen 3 rendering.');
        setStep('UPLOAD');
      }
    } catch (err: any) {
      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);
      console.error('Error generating AI photoshoot:', err);
      toast.error(err?.data?.error || err?.message || 'Failed to complete AI photoshoot');
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

    onApplyPhotos(formattedPhotos);
    toast.success(`🎉 Added ${formattedPhotos.length} AI Studio photos to product!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Sheet Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Mobile Drag Pill */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-slate-950">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">AI Product Photo Studio</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Gemini 2.0 + Imagen 3
                </span>
              </div>
              <p className="text-xs text-slate-300">Transform phone photos into 5 studio commercial shots</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sheet Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* STEP 1: UPLOAD REFERENCE PHOTOS */}
          {step === 'UPLOAD' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  1
                </div>
                <div className="text-xs text-indigo-950 leading-relaxed">
                  <p className="font-bold text-sm text-indigo-900">Upload 1 or 2 Reference Angles</p>
                  <p className="text-indigo-700/90 mt-0.5">
                    Our AI scans the product texture, colors, and branding to generate a 5-shot studio catalog (Hero, Lifestyle, Macro Detail, Perspective, and Editorial).
                  </p>
                </div>
              </div>

              {/* Upload Slots Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Slot 1: Front / Primary */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span>Angle 1: Front View *</span>
                    <span className="text-brand-orange text-[10px] font-semibold">Required</span>
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
                    <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-indigo-600 bg-gray-100 group shadow-sm">
                      <img src={preview1} alt="Angle 1" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => fileInputRef1.current?.click()}
                          className="bg-white/90 text-gray-900 p-2 rounded-xl text-xs font-bold hover:bg-white transition-all shadow-md"
                        >
                          Change
                        </button>
                        <button 
                          onClick={() => removeImage(1)}
                          className="bg-red-500 text-white p-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef1.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-500 bg-gray-50/50 hover:bg-indigo-50/30 flex flex-col items-center justify-center p-4 cursor-pointer transition-all text-center group"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white group-hover:bg-indigo-100 text-gray-400 group-hover:text-indigo-600 flex items-center justify-center mb-2 shadow-xs transition-colors">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">Tap to upload</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">Front/Main product angle</span>
                    </div>
                  )}
                </div>

                {/* Slot 2: Side / Detail Angle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span>Angle 2: Side / Close-up</span>
                    <span className="text-emerald-600 text-[10px] font-semibold">Recommended</span>
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
                    <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-indigo-600 bg-gray-100 group shadow-sm">
                      <img src={preview2} alt="Angle 2" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => fileInputRef2.current?.click()}
                          className="bg-white/90 text-gray-900 p-2 rounded-xl text-xs font-bold hover:bg-white transition-all shadow-md"
                        >
                          Change
                        </button>
                        <button 
                          onClick={() => removeImage(2)}
                          className="bg-red-500 text-white p-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef2.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-500 bg-gray-50/50 hover:bg-indigo-50/30 flex flex-col items-center justify-center p-4 cursor-pointer transition-all text-center group"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white group-hover:bg-indigo-100 text-gray-400 group-hover:text-indigo-600 flex items-center justify-center mb-2 shadow-xs transition-colors">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">Add 2nd angle</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">Side or texture shot</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Custom Direction */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                    Custom Setting / Mood (Optional)
                  </label>
                  <span className="text-[10px] text-gray-400">Auto-detected if left empty</span>
                </div>
                <input 
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Minimalist white marble countertop with morning sun rays"
                  className="w-full px-3.5 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Info & Shoot CTA */}
              <div className="pt-2">
                <Button 
                  onClick={() => handleStartGeneration(false)}
                  disabled={!image1 && !image2}
                  className="w-full py-4 h-auto rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  Generate 5 Studio Photos
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: GENERATION IN PROGRESS (Animated Studio Visualizer) */}
          {step === 'GENERATING' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-300">
              {/* Pulsing Studio Ring */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 animate-spin blur-md opacity-70" />
                <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center shadow-inner">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                    <Wand2 className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <h4 className="text-lg font-black text-gray-900 tracking-tight">
                  AI Studio Photoshoot in Progress
                </h4>
                <p className="text-xs text-indigo-600 font-semibold animate-pulse h-8 flex items-center justify-center">
                  {generationStageText}
                </p>
                <p className="text-[11px] text-gray-400">
                  Generating 5 4K studio angles tailored to your product...
                </p>
              </div>

              {/* Progress Shimmer Grid */}
              <div className="grid grid-cols-5 gap-2 w-full max-w-md pt-4">
                {['Hero', 'Lifestyle', 'Detail', 'Angle', 'Editorial'].map((name, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div className="w-full aspect-square bg-gray-100 rounded-xl animate-pulse border border-gray-200" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: RESULTS GALLERY & APPROVAL */}
          {step === 'RESULTS' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              
              {/* Top Controls Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-black text-gray-900">5 Studio Photos Generated</h4>
                  <p className="text-[11px] text-gray-500">Pick which photos to attach to your product catalog</p>
                </div>
                <button 
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100"
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
                      className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all border-2 group ${
                        isSelected 
                          ? 'border-indigo-600 ring-2 ring-indigo-600/30 shadow-md' 
                          : 'border-gray-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={getMediaUrl(shot.url || shot.publicUrl)} 
                        alt={shot.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Top Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm ${
                          isHero 
                            ? 'bg-amber-400 text-slate-950 border border-amber-300 font-extrabold' 
                            : 'bg-black/70 text-white backdrop-blur-xs'
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
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Bottom Checkbox Overlay */}
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-between">
                        <span className="text-[10px] font-bold text-white truncate max-w-[80%]">
                          {shot.title}
                        </span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-white/30 border border-white/60'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Regeneration / Custom Modification Box */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Refine Studio Lighting & Style
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    regenerationsLeft > 0 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {regenerationsLeft} regenerations left
                  </span>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g. Change to darker moody background with golden rim light..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button 
                    onClick={() => handleStartGeneration(true)}
                    disabled={regenerationsLeft <= 0}
                    variant="outline"
                    className="h-auto py-2 px-3 text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50 rounded-xl shrink-0"
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
        <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
          {step === 'RESULTS' ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setStep('UPLOAD')} 
                className="h-11 px-4 text-xs font-bold text-gray-600 rounded-xl"
              >
                Upload Different Photos
              </Button>
              <Button 
                onClick={handleApplyToProduct}
                disabled={selectedShotIds.length === 0}
                className="flex-1 h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Add Selected ({selectedShotIds.length}) to Product
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={onClose} 
                className="h-11 px-4 text-xs font-bold text-gray-500 rounded-xl hover:bg-gray-200"
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
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewModalUrl(null)}
          >
            <div className="relative max-w-2xl max-h-[85vh] w-full rounded-2xl overflow-hidden shadow-2xl">
              <img src={previewModalUrl} alt="Enlarged Studio Shot" className="w-full h-full object-contain" />
              <button 
                onClick={() => setPreviewModalUrl(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
