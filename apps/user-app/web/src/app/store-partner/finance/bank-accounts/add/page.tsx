'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AddBankAccountPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    accountName: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    branch: '',
    isPrimary: false
  });

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
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">Account Holder Name</label>
            <input 
              type="text" 
              placeholder="e.g. Rohit Sharma"
              value={formData.accountName}
              onChange={(e) => setFormData({...formData, accountName: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">Account Number</label>
            <input 
              type="text" 
              placeholder="e.g. 1234567890123"
              value={formData.accountNumber}
              onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">IFSC Code</label>
            <input 
              type="text" 
              placeholder="e.g. HDFC0001234"
              value={formData.ifsc}
              onChange={(e) => setFormData({...formData, ifsc: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium uppercase"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">Bank Name</label>
            <input 
              type="text" 
              placeholder="e.g. HDFC Bank"
              value={formData.bankName}
              onChange={(e) => setFormData({...formData, bankName: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500">Branch</label>
            <input 
              type="text" 
              placeholder="e.g. Koramangala, Bengaluru"
              value={formData.branch}
              onChange={(e) => setFormData({...formData, branch: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
            />
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-gray-50">
            <label className="text-sm font-semibold text-gray-900">Set as Primary Account</label>
            <button
              onClick={() => setFormData({...formData, isPrimary: !formData.isPrimary})}
              className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${
                formData.isPrimary ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  formData.isPrimary ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Button 
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-semibold text-base shadow-sm"
          onClick={() => {
            // Save logic here
            router.back();
          }}
        >
          Save Account
        </Button>
      </div>
    </div>
  );
}
