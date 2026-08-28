'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Store, Phone, FileText, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { useOnboardStoreMutation, useGetPresignedUrlMutation } from '@/lib/api';

export default function SellerOnboardingPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    contactPhone: '',
    aadharPanUrl: '',
    gstOrLicenseUrl: '',
    shopPhotos: [] as string[]
  });

  const [onboardStore, { isLoading: isSubmitting }] = useOnboardStoreMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();

  const [uploadingAadhar, setUploadingAadhar] = useState(false);
  const [uploadingGst, setUploadingGst] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const handleFileUpload = async (file: File, type: 'aadhar' | 'gst' | 'photo') => {
    // Validate file
    if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
      toast.error('Please select an image or PDF file');
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return null;
    }

    try {
      const { uploadUrl, publicUrl } = await getPresignedUrl({
        filename: `${type}-${Date.now()}.${file.name.split('.').pop()}`,
        contentType: file.type,
      }).unwrap();

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      return publicUrl;
    } catch (err: any) {
      console.error('File upload failed:', err);
      toast.error('Failed to upload file');
      return null;
    }
  };

  const onAadharUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAadhar(true);
    const url = await handleFileUpload(file, 'aadhar');
    if (url) setFormData(prev => ({ ...prev, aadharPanUrl: url }));
    setUploadingAadhar(false);
  };

  const onGstUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGst(true);
    const url = await handleFileUpload(file, 'gst');
    if (url) setFormData(prev => ({ ...prev, gstOrLicenseUrl: url }));
    setUploadingGst(false);
  };

  const onPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    if (formData.shopPhotos.length + files.length > 4) {
      toast.error('You can only upload up to 4 shop photos');
      return;
    }

    setUploadingPhotos(true);
    const urls: string[] = [];
    for (const file of files) {
      const url = await handleFileUpload(file, 'photo');
      if (url) urls.push(url);
    }
    if (urls.length) {
      setFormData(prev => ({ ...prev, shopPhotos: [...prev.shopPhotos, ...urls] }));
    }
    setUploadingPhotos(false);
    e.target.value = ''; // Reset input
  };

  const removePhoto = (index: number) => {
    setFormData(prev => {
      const newPhotos = [...prev.shopPhotos];
      newPhotos.splice(index, 1);
      return { ...prev, shopPhotos: newPhotos };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.aadharPanUrl) {
      return toast.error('Please upload your Aadhar/PAN Card');
    }
    if (!formData.gstOrLicenseUrl) {
      return toast.error('Please upload your GST Certificate or Shop License');
    }
    if (formData.shopPhotos.length === 0) {
      return toast.error('Please upload at least 1 shop photo');
    }

    try {
      await onboardStore(formData).unwrap();
      toast.success('Store created successfully! Waiting for verification.');
      router.push('/seller');
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || 'Failed to create store');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 md:py-12 px-4 md:px-0">
      <div className="text-center mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-[#171717] mb-2 md:mb-3">Set up your Store</h1>
        <p className="text-[#6B6B6B] text-sm md:text-base">Complete your KYC details to start selling on LOKAYA.</p>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-sm border border-[#E5E2DC]">
        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          
          <div className="space-y-3">
            <Label htmlFor="name" className="text-[#171717] font-semibold">Store Name</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#6B6B6B]">
                <Store className="h-5 w-5" />
              </div>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Lokaya Exclusives"
                required
                className="pl-10 h-14 rounded-2xl bg-[#F2EFE9] border-none focus-visible:ring-1 focus-visible:ring-[#FF5A36]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="contactPhone" className="text-[#171717] font-semibold">Contact Phone Number</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#6B6B6B]">
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
                className="pl-10 h-14 rounded-2xl bg-[#F2EFE9] border-none focus-visible:ring-1 focus-visible:ring-[#FF5A36]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[#171717] font-semibold">Aadhar / PAN Card Upload</Label>
            <div className="border-2 border-dashed border-[#E5E2DC] rounded-2xl p-4 text-center">
              {formData.aadharPanUrl ? (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">Document Uploaded Successfully</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(p => ({...p, aadharPanUrl: ''}))}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <input type="file" id="aadhar" accept="image/*,.pdf" className="hidden" onChange={onAadharUpload} />
                  <Label htmlFor="aadhar" className="cursor-pointer flex flex-col items-center gap-2">
                    {uploadingAadhar ? <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" /> : <FileText className="w-8 h-8 text-[#6B6B6B]" />}
                    <span className="text-sm font-medium text-[#FF5A36]">Click to upload Aadhar/PAN</span>
                    <span className="text-xs text-[#999999]">JPG, PNG or PDF (Max 10MB)</span>
                  </Label>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[#171717] font-semibold">GST Certificate or Shop License Upload</Label>
            <div className="border-2 border-dashed border-[#E5E2DC] rounded-2xl p-4 text-center">
              {formData.gstOrLicenseUrl ? (
                <div className="flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">Document Uploaded Successfully</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(p => ({...p, gstOrLicenseUrl: ''}))}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <input type="file" id="gst" accept="image/*,.pdf" className="hidden" onChange={onGstUpload} />
                  <Label htmlFor="gst" className="cursor-pointer flex flex-col items-center gap-2">
                    {uploadingGst ? <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" /> : <FileText className="w-8 h-8 text-[#6B6B6B]" />}
                    <span className="text-sm font-medium text-[#FF5A36]">Click to upload GST or License</span>
                    <span className="text-xs text-[#999999]">JPG, PNG or PDF (Max 10MB)</span>
                  </Label>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <Label className="text-[#171717] font-semibold">Shop Photos (Max 4)</Label>
              <span className="text-xs font-medium text-[#6B6B6B]">{formData.shopPhotos.length} / 4 uploaded</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {formData.shopPhotos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={url} alt={`Shop ${i+1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {formData.shopPhotos.length < 4 && (
                <div className="relative aspect-square border-2 border-dashed border-[#E5E2DC] rounded-xl flex items-center justify-center bg-[#F2EFE9]/50 hover:bg-[#F2EFE9] transition-colors">
                  {uploadingPhotos ? (
                    <Loader2 className="w-6 h-6 text-[#FF5A36] animate-spin" />
                  ) : (
                    <>
                      <input type="file" id="photos" accept="image/*" multiple className="hidden" onChange={onPhotosUpload} />
                      <Label htmlFor="photos" className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-[#6B6B6B] mb-1" />
                        <span className="text-xs font-medium text-[#6B6B6B]">Add Photo</span>
                      </Label>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting || uploadingAadhar || uploadingGst || uploadingPhotos}
              className="w-full h-14 rounded-2xl bg-[#FF5A36] hover:bg-[#e04d2d] text-white text-lg font-bold"
            >
              {isSubmitting ? 'Creating store...' : 'Complete Onboarding'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
