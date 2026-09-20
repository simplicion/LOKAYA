'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard, Landmark, Wallet, Banknote, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useCurrency } from '@/context/CurrencyContext';

const PAYMENT_METHODS = [
  { id: 'upi', title: 'UPI', subtitle: 'Pay using any UPI app', icon: <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="w-8 h-auto" /> },
  { id: 'card', title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, RuPay', icon: <CreditCard className="w-6 h-6 text-gray-500" /> },
  { id: 'netbanking', title: 'Net Banking', subtitle: 'All major banks supported', icon: <Landmark className="w-6 h-6 text-gray-500" /> },
  { id: 'wallet', title: 'Wallets', subtitle: 'Paytm, PhonePe, Amazon Pay', icon: <Wallet className="w-6 h-6 text-gray-500" /> },
  { id: 'cod', title: 'Cash on Delivery', subtitle: 'Pay via cash when delivered', icon: <Banknote className="w-6 h-6 text-gray-500" /> },
];

export default function PaymentMethodPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [selectedId, setSelectedId] = useState<string>('upi');
  const amountToPay = 4298;

  return (
    <div className="min-h-screen bg-white pb-safe flex flex-col max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={() => router.back()} className="mr-4 text-gray-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Payment Method</h1>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {PAYMENT_METHODS.map((method) => (
          <div 
            key={method.id}
            onClick={() => setSelectedId(method.id)}
            className={cn(
              "border-2 rounded-2xl p-4 transition-all cursor-pointer flex items-center justify-between",
              selectedId === method.id ? "border-[#FF6B00] bg-[#FF6B00]/5" : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="mt-0.5">
                {selectedId === method.id ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#FF6B00] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900">{method.title}</h3>
                <p className="text-sm text-gray-500 font-medium">{method.subtitle}</p>
              </div>
            </div>
            
            <div className="shrink-0 flex items-center justify-center w-10">
              {method.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Security info */}
      <div className="flex items-center justify-center gap-2 py-6 mb-[80px] text-gray-500">
        <ShieldCheck className="w-5 h-5" />
        <div className="text-sm font-medium">
          <span className="text-gray-900 font-bold block">100% Secure Payments</span>
          Your payment details are encrypted.
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button 
          onClick={() => router.push('/checkout/processing')}
          className="w-full h-12 rounded-xl bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold text-lg"
        >
          Pay {formatPrice(amountToPay)}
        </Button>
      </div>
    </div>
  );
}
