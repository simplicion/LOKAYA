'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, HelpCircle, PackageSearch, RotateCcw, Bell, MessageSquare, Phone, Star, ChevronRight } from 'lucide-react';

const helpItems = [
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'track', label: 'Track Your Order', icon: PackageSearch },
  { id: 'return', label: 'Return & Refund', icon: RotateCcw },
  { id: 'report', label: 'Report an Issue', icon: Bell },
  { id: 'chat', label: 'Chat with Us', icon: MessageSquare },
  { id: 'call', label: 'Call Us', icon: Phone },
  { id: 'rate', label: 'Rate Us', icon: Star },
];

export default function HelpAndSupportPage() {
  const router = useRouter();
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-center py-4 relative px-4 sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="absolute left-4 p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900">Help & Support</h1>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {helpItems.map((item, index) => (
            <div 
              key={item.id}
              className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors ${
                index !== helpItems.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-indigo-50/70 flex items-center justify-center text-indigo-700">
                  <item.icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-gray-800 text-[14px]">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
