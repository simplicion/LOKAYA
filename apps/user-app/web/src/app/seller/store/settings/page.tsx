'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  Wallet, 
  CreditCard, 
  ListTree, 
  ChevronRight,
  ArrowLeft,
  Store,
  FileText
} from 'lucide-react';
import { useGetMyStoreQuery, useUpdateStoreProfileMutation } from '@/lib/api';

export default function StoreSettingsMenuPage() {
  const router = useRouter();

  const { data: storeData } = useGetMyStoreQuery();
  const [updateStoreProfile, { isLoading: isUpdating }] = useUpdateStoreProfileMutation();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [acceptsOnline, setAcceptsOnline] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (storeData) {
      setName(storeData.name || '');
      setDescription(storeData.description || '');
      setIsActive(storeData.isActive ?? true);
      setAcceptsOnline(storeData.acceptedPayments?.includes('ONLINE PAYMENT') ?? true);
    }
  }, [storeData]);

  const handleSaveProfile = async () => {
    if (!storeData?.id) return;
    try {
      await updateStoreProfile({
        storeId: storeData.id,
        body: { 
          name, 
          description,
          isActive,
          acceptedPayments: acceptsOnline ? ['ONLINE PAYMENT', 'CASH'] : ['CASH']
        }
      }).unwrap();
      setSuccessMsg('Store profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Failed to update store profile:', error);
    }
  };

  const settingsLinks = [
    {
      title: 'Store Hours',
      description: 'Opening, closing, and working days',
      icon: <Clock className="w-6 h-6 text-green-500" />,
      href: '/seller/store/hours',
    },
    {
      title: 'Manage Categories',
      description: 'Add, reorder, and organize categories',
      icon: <ListTree className="w-6 h-6 text-orange-500" />,
      href: '/seller/store/categories',
    },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 pb-20">
      {/* Header */}
      <div className="flex items-center p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-lg font-bold text-center mr-8 text-gray-900">
          Store Settings
        </h1>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Store Profile Section */}
        <section>
          <p className="text-sm font-medium text-gray-500 mb-3 ml-1">Store Profile</p>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <Store className="w-4 h-4 mr-2 text-indigo-500" /> Store Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Store Name"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-gray-900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-indigo-500" /> Store Description
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers about your store..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium resize-none text-gray-800"
              />
            </div>

            {/* Quick Toggles */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Available on Lokaya</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Show your store to customers</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Accept Online Orders</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Allow customers to pay online</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={acceptsOnline} onChange={(e) => setAcceptsOnline(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <button 
              onClick={handleSaveProfile}
              disabled={isUpdating || !name.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-70 flex justify-center items-center shadow-md active:scale-[0.98]"
            >
              {isUpdating ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Save Changes'
              )}
            </button>
            {successMsg && (
              <div className="bg-green-50 text-green-700 text-sm font-bold p-3 rounded-lg text-center border border-green-100 animate-in fade-in zoom-in duration-300">
                {successMsg}
              </div>
            )}
          </div>
        </section>

        {/* Configuration Section */}
        <section>
          <p className="text-sm font-medium text-gray-500 mb-3 ml-1">Configuration</p>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {settingsLinks.map((link, idx) => (
              <button
                key={link.title}
                onClick={() => router.push(link.href)}
                className={`flex items-center p-5 w-full text-left transition-colors active:bg-gray-50 hover:bg-gray-50 ${
                  idx !== settingsLinks.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-12 h-12 bg-gray-50/80 rounded-2xl flex items-center justify-center mr-4 shrink-0 border border-gray-100">
                  {link.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-0.5">{link.title}</h3>
                  <p className="text-xs font-medium text-gray-500">{link.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
