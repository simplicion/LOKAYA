'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  useGetOnboardingConfigQuery, 
  useUpdateOnboardingConfigMutation,
  useGetAllStoresQuery,
  useGetAllDeliveryPartnersQuery
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Sliders, 
  Store, 
  Bike, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileText, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Sparkles,
  Info,
  Lock,
  Unlock
} from 'lucide-react';

export default function OnboardingManagementPage() {
  const { 
    data: config, 
    isLoading: isConfigLoading, 
    refetch: refetchConfig,
    isFetching: isConfigFetching 
  } = useGetOnboardingConfigQuery();

  const { data: pendingStores = [] } = useGetAllStoresQuery({ status: 'PENDING' });
  const { data: pendingRiders = [] } = useGetAllDeliveryPartnersQuery({ status: 'PENDING' });

  const [updateConfig, { isLoading: isUpdating }] = useUpdateOnboardingConfigMutation();

  // Local optimistic toggle state
  const [requireSellerDocs, setRequireSellerDocs] = useState<boolean>(false);
  const [requireRiderDocs, setRequireRiderDocs] = useState<boolean>(false);

  useEffect(() => {
    if (config) {
      setRequireSellerDocs(Boolean(config.requireSellerDocs));
      setRequireRiderDocs(Boolean(config.requireRiderDocs));
    }
  }, [config]);

  const handleToggleSellerDocs = async () => {
    const nextVal = !requireSellerDocs;
    setRequireSellerDocs(nextVal);
    try {
      await updateConfig({
        requireSellerDocs: nextVal,
        autoApproveSeller: !nextVal,
      }).unwrap();
      toast.success(
        nextVal
          ? '🛡️ Seller Strict KYC enabled: Documents & Admin Review now mandatory.'
          : '⚡ Seller Fast-Track enabled: Documents bypassed & instant approval active!'
      );
    } catch (err: any) {
      setRequireSellerDocs(!nextVal); // revert
      toast.error(err?.data?.message || 'Failed to update seller onboarding policy');
    }
  };

  const handleToggleRiderDocs = async () => {
    const nextVal = !requireRiderDocs;
    setRequireRiderDocs(nextVal);
    try {
      await updateConfig({
        requireRiderDocs: nextVal,
        autoApproveRider: !nextVal,
      }).unwrap();
      toast.success(
        nextVal
          ? '🛡️ Rider Strict KYC enabled: Documents & Admin Review now mandatory.'
          : '⚡ Rider Fast-Track enabled: Documents bypassed & instant fleet access active!'
      );
    } catch (err: any) {
      setRequireRiderDocs(!nextVal); // revert
      toast.error(err?.data?.message || 'Failed to update rider onboarding policy');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Sliders className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Onboarding & KYC Management
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">
            Configure dynamic onboarding stages for Lokaya. Toggle whether new Store Merchants and Delivery Partners are fast-tracked with instant verification or require document verification before approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchConfig()}
            disabled={isConfigFetching}
            className="flex items-center gap-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isConfigFetching ? 'animate-spin' : ''}`} />
            Refresh Policy
          </Button>
        </div>
      </div>

      {/* Startup Advisory Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-white shadow-xs text-purple-600 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-purple-950">
              Startup Frictionless Onboarding Control
            </h3>
            <p className="text-xs text-purple-800/80 mt-1 leading-relaxed">
              When toggles are <strong>OFF (Fast-Track Mode)</strong>, applicants bypass document uploads and are automatically verified upon entering their basic information. Switch to <strong>Strict Mode</strong> whenever you need manual admin approval and compliance document collections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-900 shadow-2xs">
            {requireSellerDocs || requireRiderDocs ? 'Mixed Policy Active' : '🚀 Fast-Track Active for All'}
          </span>
        </div>
      </div>

      {/* Control Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ======================================================== */}
        {/* 1. SELLER / MERCHANT ONBOARDING */}
        {/* ======================================================== */}
        <Card className={`rounded-3xl p-6 border transition-all duration-300 shadow-xs flex flex-col justify-between ${
          requireSellerDocs ? 'border-indigo-200 bg-white' : 'border-emerald-200 bg-emerald-50/20'
        }`}>
          <div className="space-y-5">
            {/* Card Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  requireSellerDocs ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-base text-gray-900">Seller Onboarding</h2>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      requireSellerDocs 
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {requireSellerDocs ? 'Strict KYC Mode' : 'Fast-Track Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Store creation & seller workspace activation</p>
                </div>
              </div>

              {/* Master Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={requireSellerDocs}
                onClick={handleToggleSellerDocs}
                disabled={isUpdating || isConfigLoading}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                  requireSellerDocs ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    requireSellerDocs ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Current Behavior Description */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
              requireSellerDocs ? 'bg-indigo-50/60 border-indigo-100 text-indigo-950' : 'bg-emerald-50/80 border-emerald-100 text-emerald-950'
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                {requireSellerDocs ? <Lock className="w-3.5 h-3.5 text-indigo-700" /> : <Unlock className="w-3.5 h-3.5 text-emerald-700" />}
                <span>
                  {requireSellerDocs ? 'Document Requirement: MANDATORY' : 'Document Requirement: BYPASSED'}
                </span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-gray-600 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>
                    <strong>Step 1:</strong> Store name, phone, category, address & location.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>
                    <strong>Step 2 (Documents):</strong> {requireSellerDocs 
                      ? 'Government ID (Front & Back) and Owner Photograph are required to submit.' 
                      : 'Step 2 is completely hidden. Sellers complete onboarding in 1 single step.'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>
                    <strong>Approval Policy:</strong> {requireSellerDocs 
                      ? 'Store enters PENDING status; seller waits for admin approval in Store Verification queue.' 
                      : 'Store is instantly approved (VERIFIED) on submission; seller gets immediate access to dashboard & products.'}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Card Footer with Direct Queue Link */}
          <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending Queue:</span>
              <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full text-[11px]">
                {pendingStores.length} stores
              </span>
            </div>

            <Link href="/admin/stores">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-semibold gap-1">
                Review Stores
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* ======================================================== */}
        {/* 2. DELIVERY PARTNER (RIDER) ONBOARDING */}
        {/* ======================================================== */}
        <Card className={`rounded-3xl p-6 border transition-all duration-300 shadow-xs flex flex-col justify-between ${
          requireRiderDocs ? 'border-teal-200 bg-white' : 'border-emerald-200 bg-emerald-50/20'
        }`}>
          <div className="space-y-5">
            {/* Card Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  requireRiderDocs ? 'bg-teal-100 text-teal-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-base text-gray-900">Rider Onboarding</h2>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      requireRiderDocs 
                        ? 'bg-teal-100 text-teal-800 border border-teal-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {requireRiderDocs ? 'Strict KYC Mode' : 'Fast-Track Mode'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Delivery fleet registration & active delivery permissions</p>
                </div>
              </div>

              {/* Master Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={requireRiderDocs}
                onClick={handleToggleRiderDocs}
                disabled={isUpdating || isConfigLoading}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                  requireRiderDocs ? 'bg-teal-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    requireRiderDocs ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Current Behavior Description */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
              requireRiderDocs ? 'bg-teal-50/60 border-teal-100 text-teal-950' : 'bg-emerald-50/80 border-emerald-100 text-emerald-950'
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                {requireRiderDocs ? <Lock className="w-3.5 h-3.5 text-teal-700" /> : <Unlock className="w-3.5 h-3.5 text-emerald-700" />}
                <span>
                  {requireRiderDocs ? 'Document Requirement: MANDATORY' : 'Document Requirement: BYPASSED'}
                </span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-gray-600 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>
                    <strong>Step 1:</strong> Legal name, phone, age, operating location & vehicle type selection.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>
                    <strong>Step 2 (Documents):</strong> {requireRiderDocs 
                      ? 'Selfie photo, Government ID, and Vehicle RC document are mandatory.' 
                      : 'Document upload stages are completely bypassed.'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>
                    <strong>Approval Policy:</strong> {requireRiderDocs 
                      ? 'Rider is placed in PENDING verification state until an admin verifies documents.' 
                      : 'Rider is instantly marked APPROVED and can toggle ONLINE to accept delivery dispatches immediately.'}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Card Footer with Direct Queue Link */}
          <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending Queue:</span>
              <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full text-[11px]">
                {pendingRiders.length} riders
              </span>
            </div>

            <Link href="/admin/riders">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-teal-600 hover:text-teal-800 hover:bg-teal-50 font-semibold gap-1">
                Review Riders
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </Card>

      </div>

      {/* Audit Log / Metadata Card */}
      <div className="bg-white border rounded-2xl p-4 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gray-400" />
          <span>
            Current Active Policy: <strong>{requireSellerDocs ? 'Strict Seller KYC' : 'Fast-Track Sellers'}</strong> &bull; <strong>{requireRiderDocs ? 'Strict Rider KYC' : 'Fast-Track Riders'}</strong>
          </span>
        </div>
        {config?.updatedAt && (
          <span className="text-gray-400 text-[11px]">
            Last updated: {new Date(config.updatedAt).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
