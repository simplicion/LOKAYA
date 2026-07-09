'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerificationPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'approved'>('pending');

  // For demonstration, let's allow the user to simulate the approval process
  const simulateApproval = () => {
    setStatus('approved');
  };

  if (status === 'pending') {
    return (
      <div className="flex flex-col h-[100dvh] bg-white p-6">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-12 h-12 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Verification in Progress</h1>
          <p className="text-gray-500 mb-8 max-w-sm">
            We are reviewing your store details and documents. This usually takes up to 24 hours. We will notify you once approved.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-xl w-full text-left space-y-3">
            <div className="flex items-center text-sm">
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">Account Created</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">Documents Uploaded</span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="w-5 h-5 text-orange-500 mr-3" />
              <span className="text-gray-900 font-medium">Under Review</span>
            </div>
          </div>
        </div>

        <div className="pb-8 space-y-4">
          <Button 
            variant="outline"
            className="w-full h-14 text-lg border-gray-200 text-gray-600 rounded-2xl"
            onClick={() => router.push('/profile')}
          >
            Back to Profile
          </Button>
          
          <Button 
            className="w-full h-14 text-lg bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl font-medium mt-4"
            onClick={simulateApproval}
          >
            Simulate Approval
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Congratulations!</h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          Your store has been verified and is now live on Snapick. You can start managing orders and adding products.
        </p>
      </div>

      <div className="pb-8">
        <Button 
          className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center gap-2"
          onClick={() => router.push('/store-partner/home')}
        >
          <Store className="w-5 h-5" />
          Go to Store Dashboard
        </Button>
      </div>
    </div>
  );
}
