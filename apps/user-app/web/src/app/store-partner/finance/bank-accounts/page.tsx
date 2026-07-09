'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Landmark, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const mockBankAccounts = [
  {
    id: 1,
    bankName: 'HDFC Bank',
    accountName: 'Rohit Sharma',
    accountNumber: '****9042',
    ifsc: 'HDFC0001234',
    isPrimary: true,
    logoColor: 'bg-red-50 text-red-600',
  },
  {
    id: 2,
    bankName: 'State Bank of India',
    accountName: 'Rohit Sharma',
    accountNumber: '****4997',
    ifsc: 'SBIN0005678',
    isPrimary: false,
    logoColor: 'bg-blue-50 text-blue-600',
  },
];

export default function BankAccountsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Bank Accounts</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {mockBankAccounts.map((account) => (
          <div key={account.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${account.logoColor}`}>
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{account.bankName}</h3>
                  {account.isPrimary && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
              </div>
              
              <button className="text-gray-400 p-1">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Account Holder</p>
                <p className="text-sm font-semibold text-gray-900">{account.accountName}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Account Number</p>
                <p className="text-sm font-semibold text-gray-900">{account.accountNumber}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-0.5">IFSC Code</p>
                <p className="text-sm font-semibold text-gray-900">{account.ifsc}</p>
              </div>
            </div>
          </div>
        ))}
        
        <button 
          onClick={() => router.push('/store-partner/finance/bank-accounts/add')}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Account</span>
        </button>
      </div>
    </div>
  );
}
