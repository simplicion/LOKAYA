'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Landmark, MoreVertical, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetBankAccountsQuery, useSetPrimaryBankAccountMutation, useDeleteBankAccountMutation } from '@/lib/api';

export default function BankAccountsPage() {
  const router = useRouter();
  const { data: bankAccounts = [], isLoading, refetch } = useGetBankAccountsQuery();
  const [setPrimary] = useSetPrimaryBankAccountMutation();
  const [deleteAccount] = useDeleteBankAccountMutation();

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimary(id).unwrap();
      refetch();
    } catch (e) {
      console.error('Failed to set primary bank account:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this bank account?')) {
      try {
        await deleteAccount(id).unwrap();
        refetch();
      } catch (err: any) {
        alert(err?.data?.message || 'Failed to delete bank account');
      }
    }
  };

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
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {bankAccounts.map((account: any) => (
              <div key={account.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{account.bankName}</h3>
                      {account.isPrimary ? (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleSetPrimary(account.id)}
                          className="text-[10px] font-semibold text-gray-500 hover:text-indigo-600 underline"
                        >
                          Make Primary
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {!account.isPrimary && (
                    <button 
                      onClick={() => handleDelete(account.id)} 
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Remove Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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

            {bankAccounts.length === 0 && (
              <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center space-y-2">
                <Landmark className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="font-bold text-gray-800">No Bank Accounts Linked</h3>
                <p className="text-xs text-gray-500">Link your verified bank account to receive automatic order payouts.</p>
              </div>
            )}
            
            <button 
              onClick={() => router.push('/seller/finance/bank-accounts/add')}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Account</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
