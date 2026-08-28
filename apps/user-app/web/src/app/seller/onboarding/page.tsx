'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Store, MapPin, Building2 } from 'lucide-react';

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    businessType: '',
    gstNumber: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/seller/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || 'Failed to create store');
      }

      toast.success('Store created successfully! Waiting for verification.');
      router.push('/seller');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Set up your Store</h1>
        <p className="text-gray-500">Fill in your business details to start selling on LOKAYA.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-3">
            <Label htmlFor="name" className="text-gray-700 font-semibold">Store Name</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Store className="h-5 w-5" />
              </div>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Acme Electronics"
                required
                className="pl-10 h-14 rounded-2xl bg-gray-50"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="address" className="text-gray-700 font-semibold">Business Address</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <MapPin className="h-5 w-5" />
              </div>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Full address of your physical store or warehouse"
                required
                className="pl-10 h-14 rounded-2xl bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="businessType" className="text-gray-700 font-semibold">Business Type</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <Input
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                  placeholder="e.g. Retail, Wholesale"
                  className="pl-10 h-14 rounded-2xl bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="gstNumber" className="text-gray-700 font-semibold">GST Number (Optional)</Label>
              <Input
                id="gstNumber"
                value={formData.gstNumber}
                onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                placeholder="15-digit GSTIN"
                className="h-14 rounded-2xl bg-gray-50"
              />
            </div>
          </div>

          <div className="pt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-medium"
            >
              {isSubmitting ? 'Creating store...' : 'Complete Onboarding'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
