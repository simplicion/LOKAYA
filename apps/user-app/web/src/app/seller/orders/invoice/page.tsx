'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGetOrderInvoiceQuery } from '@/lib/api';
import { InvoiceTemplate } from '@/components/invoice/InvoiceTemplate';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SellerInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';

  const { data: invoice, isLoading, isError, error } = useGetOrderInvoiceQuery(id, { skip: !id });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] p-6">
        <Loader2 className="w-9 h-9 animate-spin text-[#FF5A36] mb-3" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Generating Tax Invoice...
        </p>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-black text-gray-900">Invoice Not Found</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {(error as any)?.data?.message || 'Could not load invoice data for this order.'}
          </p>
        </div>
        <Button onClick={() => router.back()} className="rounded-xl font-bold">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <InvoiceTemplate 
      invoice={invoice} 
      onBack={() => router.back()} 
      showActions={true}
    />
  );
}

export default function SellerInvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5A36]" />
      </div>
    }>
      <SellerInvoiceContent />
    </Suspense>
  );
}
