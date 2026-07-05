'use client';

import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function QRScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const router = useRouter();

  const handleScan = (result: any) => {
    if (result && result[0] && result[0].rawValue) {
      const orderId = result[0].rawValue;
      setScanResult(orderId);
      toast.success('QR Code Scanned!');
      
      // Redirect to the order fulfillment page
      router.push(`/seller/order/${orderId}`);
    }
  };

  const handleError = (error: any) => {
    console.error(error);
    // Suppress common errors like "No camera found" which continuously fire when scanning
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Scan Order QR</h1>
        <p className="text-gray-500 mt-2">Scan the buyer's QR code to pull up their order details and fulfill it.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scanner</CardTitle>
          <CardDescription>Point your camera at the QR code</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="w-full max-w-md overflow-hidden rounded-xl border bg-black mb-4">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              components={{
                audio: false,
                finder: true,
              }}
              allowMultiple={false}
              scanDelay={500}
            />
          </div>
          
          {scanResult && (
            <div className="text-sm font-medium text-green-600 mt-4">
              Scanned ID: {scanResult}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
