'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function AddProductPage() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  
  // scan states: 'scanning' -> 'found' -> 'added'
  const [scanState, setScanState] = useState<'scanning' | 'found' | 'added'>('scanning');
  
  // Store the scanned SKU / text
  const [scannedSku, setScannedSku] = useState('');

  // Handle Barcode Scanner Initialization
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    if (activeTab === 'scan' && scanState === 'scanning') {
      // Small delay to ensure the DOM element is mounted
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          'qr-reader',
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
          },
          false
        );
        
        scanner.render(
          (decodedText) => {
            // Success Callback
            setScannedSku(decodedText);
            setScanState('found');
            if (scanner) {
              scanner.clear().catch(console.error);
            }
          }, 
          (error) => {
            // Ignore error logs as it scans continuously
          }
        );
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(console.error);
        }
      };
    }
  }, [activeTab, scanState]);

  const handleBack = () => {
    if (activeTab === 'scan') {
      if (scanState === 'added') setScanState('found');
      else if (scanState === 'found') setScanState('scanning');
      else router.back();
    } else {
      router.back();
    }
  };

  const getHeaderTitle = () => {
    if (activeTab === 'scan') {
      if (scanState === 'found') return 'Product Found';
      if (scanState === 'added') return 'Product Added';
    }
    return 'Add Product';
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-white pb-24 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          {getHeaderTitle()}
        </h1>
      </div>

      {/* Tabs - Only show when in 'scanning' or 'manual' initial states */}
      {((activeTab === 'scan' && scanState === 'scanning') || activeTab === 'manual') && (
        <div className="flex px-4 border-b border-gray-200">
          <button 
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'scan' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
            onClick={() => setActiveTab('scan')}
          >
            Scan Barcode
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'manual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
            onClick={() => setActiveTab('manual')}
          >
            Add Manually
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 p-4 flex flex-col">

        {/* --- TAB: SCAN --- */}
        {activeTab === 'scan' && (
          <>
            {scanState === 'scanning' && (
              <div className="flex flex-col items-center pt-8 space-y-8">
                
                {/* HTML5 QR Code Scanner Container */}
                <div id="qr-reader" className="w-full max-w-sm rounded-3xl overflow-hidden shadow-lg border-2 border-gray-100"></div>

                <Button 
                  variant="outline" 
                  className="w-full h-14 border-gray-200 text-gray-700 rounded-2xl text-base font-medium"
                  onClick={() => setActiveTab('manual')}
                >
                  Enter SKU Manually
                </Button>
                <p className="text-sm text-gray-400 text-center max-w-[250px]">
                  Point your camera at a product barcode to automatically fetch its details.
                </p>
                
                {/* Fallback button if camera isn't working */}
                <button 
                  onClick={() => {
                    setScannedSku('MOCK-BARCODE-12345');
                    setScanState('found');
                  }}
                  className="text-xs text-gray-300 w-full text-center mt-4"
                >
                  (Simulate Scan Success)
                </button>
              </div>
            )}

            {scanState === 'found' && (
              <div className="flex flex-col space-y-6">
                <div className="flex flex-col items-center mt-4">
                  <div className="w-32 h-32 relative mb-4">
                    <Image 
                      src="https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&q=80&w=400&h=400" 
                      alt="Product"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Fortune Sunlite Refined Oil (1L)</h2>
                  <div className="text-sm text-gray-500 space-y-1 text-center">
                    <p>Brand: Fortune</p>
                    <p>Category: Edible Oil</p>
                    <p>Scanned SKU: <span className="font-semibold">{scannedSku}</span></p>
                    <p className="font-medium text-gray-700 mt-2">MRP: ₹185</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input type="number" defaultValue={165} className="w-full pl-8 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                    <input type="number" defaultValue={10} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-10 pb-safe">
                  <Button 
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-medium"
                    onClick={() => setScanState('added')}
                  >
                    Add to Inventory
                  </Button>
                </div>
              </div>
            )}

            {scanState === 'added' && (
              <div className="flex flex-col items-center mt-8">
                <div className="w-32 h-32 relative mb-6">
                  <Image 
                    src="https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?auto=format&fit=crop&q=80&w=400&h=400" 
                    alt="Product"
                    fill
                    className="object-contain"
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-900 text-center mb-6">Fortune Sunlite Refined Oil (1L)</h2>
                
                <div className="flex gap-12 text-center mb-8">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Selling Price</p>
                    <p className="font-bold text-gray-900 text-lg">₹165</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Stock</p>
                    <p className="font-bold text-gray-900 text-lg">10</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-green-600 font-medium mb-12">
                  <CheckCircle2 className="w-6 h-6" />
                  <span>Added to Inventory</span>
                </div>

                <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-10 pb-safe space-y-3">
                  <Button 
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-medium"
                    onClick={() => setScanState('scanning')}
                  >
                    Add Another Product
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-14 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl text-base font-medium"
                    onClick={() => router.push('/store-partner/products')}
                  >
                    View Inventory
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* --- TAB: MANUAL --- */}
        {activeTab === 'manual' && (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input type="text" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Aashirvaad Atta (5kg)" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option>Flour</option>
                <option>Edible Oil</option>
                <option>Pulses & Dals</option>
                <option>Snacks</option>
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input type="number" className="w-full pl-8 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input type="number" className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
              <div className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                <Upload className="w-6 h-6 mb-2 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">Upload Image</span>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 z-10 pb-safe">
              <Button 
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-medium"
                onClick={() => {
                  setActiveTab('scan');
                  setScanState('added'); // reuse the added state for demo
                }}
              >
                Save Product
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
