'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Store, Phone, FileText, Loader2, CheckCircle2, CreditCard, Building2, UploadCloud } from 'lucide-react';
import { useOnboardStoreMutation, useGetPresignedUrlMutation, useUploadMediaMutation } from '@/lib/api';

export default function SellerOnboardingPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    contactPhone: '',
    aadhaarFrontUrl: '',
    aadhaarBackUrl: '',
    panCardUrl: '',
    gstOrLicenseUrl: '',
  });

  const [onboardStore, { isLoading: isSubmitting }] = useOnboardStoreMutation();
  const [uploadMedia] = useUploadMediaMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();

  const [uploadingAadhaarFront, setUploadingAadhaarFront] = useState(false);
  const [uploadingAadhaarBack, setUploadingAadhaarBack] = useState(false);
  const [uploadingPan, setUploadingPan] = useState(false);
  const [uploadingGst, setUploadingGst] = useState(false);

  const handleFileUpload = async (file: File, type: 'aadhaar-front' | 'aadhaar-back' | 'pan' | 'gst') => {
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast.error('Please select an image or PDF file');
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return null;
    }

    try {
      // 1. Direct Multipart Upload (Fastest, zero CORS issues, direct to backend & R2)
      const data = new FormData();
      data.append('file', file);
      
      const res = await uploadMedia(data).unwrap();
      const finalUrl = res?.publicUrl || res?.url;
      if (finalUrl) {
        return finalUrl;
      }
      throw new Error('Upload response missing URL');
    } catch (err: any) {
      console.warn('Direct upload attempt failed, falling back to presigned URL:', err);
      try {
        // 2. Fallback to Presigned URL upload
        const res = await getPresignedUrl({
          filename: `${type}-${Date.now()}.${file.name.split('.').pop()}`,
          contentType: file.type,
        }).unwrap();

        const uploadUrl = res.uploadUrl || res.signedUrl;
        const publicUrl = res.publicUrl || res.url;

        if (!uploadUrl) {
          throw new Error('No upload URL returned from server');
        }

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadRes.ok) {
          throw new Error(`Storage upload failed (${uploadRes.status})`);
        }

        return publicUrl;
      } catch (fallbackErr: any) {
        console.error('File upload failed:', fallbackErr);
        toast.error('Failed to upload file to storage');
        return null;
      }
    }
  };

  const onAadhaarFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAadhaarFront(true);
    const url = await handleFileUpload(file, 'aadhaar-front');
    if (url) {
      setFormData(prev => ({ ...prev, aadhaarFrontUrl: url }));
      toast.success('Aadhaar Front uploaded');
    }
    setUploadingAadhaarFront(false);
  };

  const onAadhaarBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAadhaarBack(true);
    const url = await handleFileUpload(file, 'aadhaar-back');
    if (url) {
      setFormData(prev => ({ ...prev, aadhaarBackUrl: url }));
      toast.success('Aadhaar Back uploaded');
    }
    setUploadingAadhaarBack(false);
  };

  const onPanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPan(true);
    const url = await handleFileUpload(file, 'pan');
    if (url) {
      setFormData(prev => ({ ...prev, panCardUrl: url }));
      toast.success('PAN Card uploaded');
    }
    setUploadingPan(false);
  };

  const onGstUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGst(true);
    const url = await handleFileUpload(file, 'gst');
    if (url) {
      setFormData(prev => ({ ...prev, gstOrLicenseUrl: url }));
      toast.success('GST / License uploaded');
    }
    setUploadingGst(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return toast.error('Please enter your store name');
    }
    if (!formData.contactPhone.trim()) {
      return toast.error('Please enter your contact phone number');
    }
    if (!formData.aadhaarFrontUrl) {
      return toast.error('Please upload your Aadhaar Card (Front Side)');
    }
    if (!formData.aadhaarBackUrl) {
      return toast.error('Please upload your Aadhaar Card (Back Side)');
    }
    if (!formData.panCardUrl) {
      return toast.error('Please upload your PAN Card (Front Side)');
    }

    try {
      await onboardStore(formData).unwrap();
      toast.success('Store created successfully! Waiting for verification.');
      router.push('/seller');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create store');
    }
  };

  const isUploadingAny = uploadingAadhaarFront || uploadingAadhaarBack || uploadingPan || uploadingGst;

  return (
    <div className="max-w-2xl mx-auto py-6 md:py-12 px-4 md:px-0">
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-[#171717] mb-2 md:mb-3">Set up your Store</h1>
        <p className="text-[#6B6B6B] text-sm md:text-base">Complete your KYC verification details to start selling on LOKAYA.</p>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-[#E5E2DC]">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Store Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#171717] font-semibold text-sm">Store Name <span className="text-red-500">*</span></Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#6B6B6B]">
                <Store className="h-5 w-5" />
              </div>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Lokaya Exclusives"
                required
                className="pl-11 h-14 rounded-2xl bg-[#F2EFE9] border-none focus-visible:ring-1 focus-visible:ring-[#FF5A36]"
              />
            </div>
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="text-[#171717] font-semibold text-sm">Contact Phone Number <span className="text-red-500">*</span></Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#6B6B6B]">
                <Phone className="h-5 w-5" />
              </div>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                placeholder="10-digit mobile number"
                required
                pattern="[0-9]{10}"
                className="pl-11 h-14 rounded-2xl bg-[#F2EFE9] border-none focus-visible:ring-1 focus-visible:ring-[#FF5A36]"
              />
            </div>
          </div>

          {/* KYC Documents Section */}
          <div className="pt-2 border-t border-[#E5E2DC] space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#171717]">KYC Identification Documents</h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Please provide government-issued identity documents for seller verification.</p>
            </div>

            {/* 1. Aadhaar Card (Front & Back) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-[#171717] font-semibold text-sm flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#FF5A36]" />
                  Aadhaar Card <span className="text-red-500">*</span>
                </Label>
                <span className="text-[11px] font-medium text-[#888] bg-[#F2EFE9] px-2 py-0.5 rounded-full">Front & Back Required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Aadhaar Front Card */}
                <div className="border-2 border-dashed border-[#E5E2DC] rounded-2xl p-4 text-center transition-all bg-[#FAF9F6] hover:bg-[#F2EFE9]/60">
                  {formData.aadhaarFrontUrl ? (
                    <div className="flex flex-col items-center justify-center p-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold text-emerald-800 mb-1">Aadhaar (Front) Uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(p => ({ ...p, aadhaarFrontUrl: '' }))}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 mt-1"
                      >
                        Remove / Re-upload
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-2">
                      <input type="file" id="aadhaarFront" accept="image/*,.pdf" className="hidden" onChange={onAadhaarFrontUpload} />
                      <Label htmlFor="aadhaarFront" className="cursor-pointer flex flex-col items-center gap-1.5 w-full">
                        {uploadingAadhaarFront ? (
                          <Loader2 className="w-7 h-7 text-[#FF5A36] animate-spin mb-1" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF5A36] mb-1">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                        )}
                        <span className="text-xs font-bold text-[#171717]">Front Side</span>
                        <span className="text-[11px] font-medium text-[#FF5A36]">Click to upload</span>
                        <span className="text-[10px] text-[#999999]">JPG, PNG or PDF (Max 10MB)</span>
                      </Label>
                    </div>
                  )}
                </div>

                {/* Aadhaar Back Card */}
                <div className="border-2 border-dashed border-[#E5E2DC] rounded-2xl p-4 text-center transition-all bg-[#FAF9F6] hover:bg-[#F2EFE9]/60">
                  {formData.aadhaarBackUrl ? (
                    <div className="flex flex-col items-center justify-center p-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold text-emerald-800 mb-1">Aadhaar (Back) Uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(p => ({ ...p, aadhaarBackUrl: '' }))}
                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 mt-1"
                      >
                        Remove / Re-upload
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-2">
                      <input type="file" id="aadhaarBack" accept="image/*,.pdf" className="hidden" onChange={onAadhaarBackUpload} />
                      <Label htmlFor="aadhaarBack" className="cursor-pointer flex flex-col items-center gap-1.5 w-full">
                        {uploadingAadhaarBack ? (
                          <Loader2 className="w-7 h-7 text-[#FF5A36] animate-spin mb-1" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF5A36] mb-1">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                        )}
                        <span className="text-xs font-bold text-[#171717]">Back Side</span>
                        <span className="text-[11px] font-medium text-[#FF5A36]">Click to upload</span>
                        <span className="text-[10px] text-[#999999]">JPG, PNG or PDF (Max 10MB)</span>
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. PAN Card (Front) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-[#171717] font-semibold text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#FF5A36]" />
                  PAN Card <span className="text-red-500">*</span>
                </Label>
                <span className="text-[11px] font-medium text-[#888] bg-[#F2EFE9] px-2 py-0.5 rounded-full">Front Side Required</span>
              </div>

              <div className="border-2 border-dashed border-[#E5E2DC] rounded-2xl p-4 text-center transition-all bg-[#FAF9F6] hover:bg-[#F2EFE9]/60">
                {formData.panCardUrl ? (
                  <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-semibold">PAN Card (Front) Uploaded Successfully</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(p => ({ ...p, panCardUrl: '' }))}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-2">
                    <input type="file" id="pan" accept="image/*,.pdf" className="hidden" onChange={onPanUpload} />
                    <Label htmlFor="pan" className="cursor-pointer flex flex-col items-center gap-1.5 w-full">
                      {uploadingPan ? (
                        <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin mb-1" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF5A36] mb-1">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                      )}
                      <span className="text-xs font-bold text-[#171717]">Upload PAN Card (Front Side)</span>
                      <span className="text-[11px] font-medium text-[#FF5A36]">Click to browse files</span>
                      <span className="text-[10px] text-[#999999]">JPG, PNG or PDF (Max 10MB)</span>
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* 3. GST Certificate or Shop License (Optional) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-[#171717] font-semibold text-sm flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#6B6B6B]" />
                  GST Certificate / Shop License
                </Label>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Optional</span>
              </div>

              <div className="border-2 border-dashed border-[#E5E2DC] rounded-2xl p-4 text-center transition-all bg-[#FAF9F6] hover:bg-[#F2EFE9]/60">
                {formData.gstOrLicenseUrl ? (
                  <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-semibold">GST / Trade License Uploaded</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(p => ({ ...p, gstOrLicenseUrl: '' }))}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-2">
                    <input type="file" id="gst" accept="image/*,.pdf" className="hidden" onChange={onGstUpload} />
                    <Label htmlFor="gst" className="cursor-pointer flex flex-col items-center gap-1.5 w-full">
                      {uploadingGst ? (
                        <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin mb-1" />
                      ) : (
                        <FileText className="w-8 h-8 text-[#888888] mb-1" />
                      )}
                      <span className="text-xs font-semibold text-[#555555]">Click to upload GST or License <span className="text-[#888] font-normal">(Optional)</span></span>
                      <span className="text-[10px] text-[#999999]">JPG, PNG or PDF (Max 10MB)</span>
                    </Label>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploadingAny}
              className="w-full h-14 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white text-base font-bold shadow-sm transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating store...
                </span>
              ) : 'Complete Onboarding'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
