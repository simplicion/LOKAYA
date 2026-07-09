'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle2, ChevronRight, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function StoreOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = Welcome, 1-4 = Steps

  // --- Step 0: Welcome ---
  if (step === 0) {
    return (
      <div className="flex flex-col h-[100dvh] bg-white">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-8">
            <Store className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Grow Your Store, Serve Your Local</h1>
          <p className="text-gray-500 text-lg mb-12">
            Join Snapick and reach thousands of customers in your neighborhood. Quick setup, instant payouts.
          </p>
        </div>
        <div className="p-6 pb-8 space-y-4">
          <Button 
            className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
            onClick={() => setStep(1)}
          >
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  // --- Header for Steps 1-4 ---
  const stepTitles = [
    '', // 0
    'Store Details', // 1
    'Verify Business', // 2
    'Verify Identity', // 3
    'Verify Store' // 4
  ];

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      router.push('/store-partner/verification');
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          {stepTitles[step]}
        </h1>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-1">
        <div 
          className="bg-blue-600 h-1 transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
              <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Enter store name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Category</label>
              <select className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                <option>Grocery & Staples</option>
                <option>Pharmacy</option>
                <option>Electronics</option>
                <option>Fashion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
              <textarea className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Enter complete address" rows={3}></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (Optional)</label>
              <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Near famous place" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <select className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                <option>Individual</option>
                <option>Proprietorship</option>
                <option>Partnership</option>
                <option>Private Limited</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase" placeholder="Enter GSTIN" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 flex flex-col items-center pt-8">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
              <Upload className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-gray-900 mb-1">Upload Aadhar / PAN Card</h3>
              <p className="text-sm text-gray-500">Ensure the document is clear and readable</p>
            </div>
            <Button variant="outline" className="w-full h-12 border-dashed border-2 border-gray-300 text-gray-600 rounded-xl">
              Tap to Upload
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 flex flex-col items-center pt-8">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2">
              <Store className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-gray-900 mb-1">Upload Storefront Photo</h3>
              <p className="text-sm text-gray-500">Show the front of your store clearly</p>
            </div>
            <Button variant="outline" className="w-full h-12 border-dashed border-2 border-gray-300 text-gray-600 rounded-xl">
              Tap to Capture
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Fixed Area */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-10 pb-safe">
        <Button 
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-medium"
          onClick={handleNext}
        >
          {step === 4 ? 'Submit Application' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
