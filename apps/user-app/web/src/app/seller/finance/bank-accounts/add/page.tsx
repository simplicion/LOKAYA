'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddBankAccountMutation } from '@/lib/api';

export default function AddBankAccountPage() {
  const router = useRouter();
  const [addBankAccount, { isLoading }] = useAddBankAccountMutation();
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    branch: '',
    isPrimary: false
  });

  const handleSave = async () => {
    if (!formData.accountName || !formData.accountNumber || !formData.ifsc || !formData.bankName) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setError('');
      await addBankAccount({
        accountName: formData.accountName,
        accountNumber: formData.accountNumber,
        ifsc: formData.ifsc,
        bankName: formData.bankName
      }).unwrap();
      router.back();
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to link bank account. Please verify IFSC and account number.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Add Bank Account</h1>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl">
            {error}
          </div>
        )}

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">Account Holder Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Rohit Sharma"
              value={formData.accountName}
              onChange={(e) => setFormData({...formData, accountName: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">Account Number *</label>
            <input 
              type="text" 
              placeholder="e.g. 1234567890123"
              value={formData.accountNumber}
              onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">IFSC Code *</label>
            <input 
              type="text" 
              placeholder="e.g. HDFC0001234"
              value={formData.ifsc}
              onChange={(e) => setFormData({...formData, ifsc: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium uppercase"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">Bank Name *</label>
            <input 
              type="text" 
              placeholder="e.g. HDFC Bank"
              value={formData.bankName}
              onChange={(e) => setFormData({...formData, bankName: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">Branch (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Koramangala, Bengaluru"
              value={formData.branch}
              onChange={(e) => setFormData({...formData, branch: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Button 
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-semibold text-base shadow-sm"
          disabled={isLoading}
          onClick={handleSave}
        >
          {isLoading ? 'Linking Account...' : 'Save Account'}
        </Button>
      </div>
    </div>
  );
}
