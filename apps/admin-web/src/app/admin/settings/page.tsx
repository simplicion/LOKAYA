'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bot, 
  Cpu, 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw, 
  ExternalLink, 
  Layers, 
  Sliders, 
  Zap, 
  Info,
  Check,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { 
  useGetAiPlatformSettingsQuery, 
  useUpdateAiPlatformSettingsMutation, 
  useTestAiPlatformSettingsMutation 
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface DiagnosticResult {
  success: boolean;
  status: 'READY' | 'WARNING' | 'ERROR';
  code: string;
  issueCategory?: 'HEALTHY' | 'COST_OR_BALANCE' | 'AUTHENTICATION' | 'INTERNAL_PROVIDER_ERROR' | 'PERMISSION_OR_REGION' | 'RATE_LIMIT' | 'NETWORK' | 'UNKNOWN';
  headline: string;
  summary: string;
  actionRequired?: string;
  details?: {
    provider?: string;
    textVisionStatus?: string;
    imageGenStatus?: string;
    modelCount?: number;
    sampleModels?: string[];
    rawError?: string;
    rawCode?: number | string;
    helpUrl?: string;
  };
}

function DiagnosticCard({ result }: { result: DiagnosticResult }) {
  const isReady = result.status === 'READY';
  const isWarning = result.status === 'WARNING';
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(!isReady);

  // Category badge formatting
  const getCategoryBadge = () => {
    switch (result.issueCategory) {
      case 'COST_OR_BALANCE':
        return {
          label: 'Cost / Balance Limit',
          className: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200',
        };
      case 'INTERNAL_PROVIDER_ERROR':
        return {
          label: 'Provider Server Error (5xx)',
          className: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200',
        };
      case 'AUTHENTICATION':
        return {
          label: 'Authentication / Invalid Key',
          className: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/60 dark:text-red-200',
        };
      case 'PERMISSION_OR_REGION':
        return {
          label: 'Permission / API Disabled',
          className: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200',
        };
      case 'RATE_LIMIT':
        return {
          label: 'Rate Limit (429)',
          className: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/60 dark:text-orange-200',
        };
      case 'NETWORK':
        return {
          label: 'Network / Host Unreachable',
          className: 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-950/60 dark:text-slate-200',
        };
      case 'HEALTHY':
        return {
          label: 'All Systems Operational',
          className: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200',
        };
      default:
        return null;
    }
  };

  const categoryBadge = getCategoryBadge();

  return (
    <div className={`p-4 rounded-xl text-xs space-y-2.5 border transition-all animate-in fade-in duration-200 shadow-sm ${
      isReady 
        ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-200' 
        : isWarning 
          ? 'bg-amber-50/95 border-amber-300 text-amber-950 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200' 
          : 'bg-rose-50/95 border-rose-300 text-rose-950 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-200'
    }`}>
      <div className="flex items-start gap-3">
        {isReady && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
        {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
        {!isReady && !isWarning && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
        
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-sm tracking-tight">{result.headline}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              {categoryBadge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryBadge.className}`}>
                  {categoryBadge.label}
                </span>
              )}
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                isReady 
                  ? 'bg-emerald-200/80 text-emerald-900 border border-emerald-300' 
                  : isWarning 
                    ? 'bg-amber-200/80 text-amber-900 border border-amber-300' 
                    : 'bg-rose-200/80 text-rose-900 border border-rose-300'
              }`}>
                {result.code}
              </span>
            </div>
          </div>

          <p className="text-xs leading-relaxed opacity-95">{result.summary}</p>

          {/* Action guidance */}
          {result.actionRequired && (
            <div className="mt-2 p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs">
              <span className="font-bold uppercase text-[10px] tracking-wider block mb-0.5 opacity-80">Recommended Action:</span>
              <span className="leading-relaxed font-medium">{result.actionRequired}</span>
            </div>
          )}

          {/* Provider Specific Status Breakdown */}
          {result.details && (result.details.textVisionStatus || result.details.imageGenStatus) && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {result.details.textVisionStatus && (
                <div className="p-2 rounded bg-black/5 dark:bg-white/5 border border-black/5 flex items-center justify-between text-[11px]">
                  <span className="opacity-75">Vision & Taxonomy:</span>
                  <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
                    result.details.textVisionStatus === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {result.details.textVisionStatus}
                  </span>
                </div>
              )}
              {result.details.imageGenStatus && (
                <div className="p-2 rounded bg-black/5 dark:bg-white/5 border border-black/5 flex items-center justify-between text-[11px]">
                  <span className="opacity-75">Image Synthesis:</span>
                  <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
                    result.details.imageGenStatus === 'READY' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : result.details.imageGenStatus === 'QUOTA_ZERO_FREE_TIER' 
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                  }`}>
                    {result.details.imageGenStatus}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Raw Error Transparency for Technical / Admin Users */}
          {result.details?.rawError && (
            <div className="pt-1.5">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="text-[11px] font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
              >
                {showTechnicalDetails ? '▲ Hide Exact Provider Response' : '▼ View Exact Provider Response & Error Message'}
              </button>

              {showTechnicalDetails && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed border border-slate-700 space-y-1.5 overflow-x-auto shadow-inner">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                    <span>STATUS: {result.details.rawCode || 'N/A'}</span>
                    <span>PROVIDER: {result.details.provider?.toUpperCase()}</span>
                  </div>
                  <pre className="whitespace-pre-wrap break-all text-rose-300 font-mono text-[11px]">
                    {result.details.rawError}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Direct External Link */}
          {result.details?.helpUrl && (
            <div className="pt-1">
              <a
                href={result.details.helpUrl}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs font-bold hover:underline ${
                  isReady ? 'text-emerald-700 dark:text-emerald-400' : isWarning ? 'text-amber-800 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                Fix Issue in Provider Console <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlatformAiSettingsPage() {
  const { 
    data: config, 
    isLoading: isConfigLoading, 
    refetch,
    isFetching 
  } = useGetAiPlatformSettingsQuery();

  const [updateAiSettings, { isLoading: isSaving }] = useUpdateAiPlatformSettingsMutation();
  const [testAiConnection, { isLoading: isTesting }] = useTestAiPlatformSettingsMutation();

  // Local Form States
  const [enableAiStudio, setEnableAiStudio] = useState<boolean>(true);
  const [preferredProvider, setPreferredProvider] = useState<'auto' | 'gemini' | 'openai'>('auto');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');

  // UI States
  const [showGeminiKey, setShowGeminiKey] = useState<boolean>(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState<boolean>(false);
  const [testingProvider, setTestingProvider] = useState<'gemini' | 'openai' | null>(null);
  const [geminiTestResult, setGeminiTestResult] = useState<DiagnosticResult | null>(null);
  const [openaiTestResult, setOpenaiTestResult] = useState<DiagnosticResult | null>(null);

  // Sync with fetched data
  useEffect(() => {
    if (config) {
      setEnableAiStudio(config.enableAiStudio !== false);
      setPreferredProvider(config.preferredProvider || 'auto');
      setGeminiApiKey(config.geminiApiKey || '');
      setOpenaiApiKey(config.openaiApiKey || '');
    }
  }, [config]);

  // Handle Live Connection Test with Deep Diagnostics
  const handleTestConnection = async (provider: 'gemini' | 'openai') => {
    setTestingProvider(provider);
    const keyToTest = provider === 'gemini' ? geminiApiKey : openaiApiKey;
    try {
      const res = await testAiConnection({
        provider,
        apiKey: keyToTest || undefined
      }).unwrap();

      const diag: DiagnosticResult = {
        success: Boolean(res.success),
        status: (res as any).status || (res.success ? 'READY' : 'ERROR'),
        code: (res as any).code || (res.success ? 'READY' : 'ERROR'),
        headline: (res as any).headline || (res.success ? 'Connection Successful' : 'Connection Failed'),
        summary: (res as any).summary || res.message,
        actionRequired: (res as any).actionRequired,
        details: res.details,
      };

      if (provider === 'gemini') {
        setGeminiTestResult(diag);
      } else {
        setOpenaiTestResult(diag);
      }

      if (diag.status === 'READY') {
        toast.success(diag.headline);
      } else if (diag.status === 'WARNING') {
        toast.warning(diag.headline, { duration: 6000 });
      } else {
        toast.error(diag.headline);
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Connection test failed';
      const diag: DiagnosticResult = {
        success: false,
        status: 'ERROR',
        code: 'NETWORK_ERROR',
        headline: 'Connection Test Failed',
        summary: msg,
        actionRequired: 'Check your internet connection or verify the server is running.',
      };
      if (provider === 'gemini') {
        setGeminiTestResult(diag);
      } else {
        setOpenaiTestResult(diag);
      }
      toast.error(msg);
    } finally {
      setTestingProvider(null);
    }
  };

  // Handle Save
  const handleSaveSettings = async () => {
    try {
      await updateAiSettings({
        enableAiStudio,
        preferredProvider,
        geminiApiKey: geminiApiKey.trim() || undefined,
        openaiApiKey: openaiApiKey.trim() || undefined,
      }).unwrap();

      toast.success('AI Studio platform settings saved successfully to database!');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save platform AI settings');
    }
  };

  const hasConfiguredGemini = Boolean(config?.hasGeminiKey || (geminiApiKey && geminiApiKey.length > 5));
  const hasConfiguredOpenAi = Boolean(config?.hasOpenAiKey || (openaiApiKey && openaiApiKey.length > 5));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Studio & LLM Engine Settings</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Centralized cloud API keys, LLM provider routing, and autonomous e-commerce photoshoot engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs font-semibold text-gray-700 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-brand-navy hover:bg-brand-dark-navy text-white text-xs font-bold gap-2 px-4 shadow-sm"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Settings
          </Button>
        </div>
      </div>

      {/* Security & Database Notice */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 space-y-1">
          <p className="font-bold text-emerald-950">Database-Secured API Key Management</p>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            API keys saved here are stored directly in your PostgreSQL database in the <code className="font-mono bg-emerald-100/70 px-1 py-0.5 rounded text-[10px]">PlatformSetting</code> table.
            You do <strong>not</strong> need to commit keys or maintain them in server <code className="font-mono bg-emerald-100/70 px-1 py-0.5 rounded text-[10px]">.env</code> files. Any update made here takes effect immediately in real time.
          </p>
        </div>
      </div>

      {/* Grid: Master Toggles & Engine Provider */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Master Studio Switch */}
        <Card className="p-5 border-gray-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Engine Status</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                enableAiStudio ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {enableAiStudio ? 'ONLINE' : 'DISABLED'}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900">AI Product Studio</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Enables merchants and sellers to run autonomous 6-10 angle studio shoots, taxonomy forensics, and smart title/description generation.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant={enableAiStudio ? 'default' : 'outline'}
              onClick={() => setEnableAiStudio(!enableAiStudio)}
              className={`w-full text-xs font-bold h-10 ${
                enableAiStudio 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {enableAiStudio ? 'Active for Sellers (Click to Disable)' : 'Disabled Platform-Wide (Click to Enable)'}
            </Button>
          </div>
        </Card>

        {/* Engine Provider Selection */}
        <Card className="lg:col-span-2 p-5 border-gray-200 shadow-xs space-y-4">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Routing Strategy</span>
            <h3 className="text-base font-bold text-gray-900">Preferred AI Provider</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose which generative model handles image synthesis and vision analysis first.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Auto (Smart Cascade) */}
            <div 
              onClick={() => setPreferredProvider('auto')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                preferredProvider === 'auto'
                  ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-2 ring-purple-100'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Zap className="w-3.5 h-3.5 text-purple-700" />
                </div>
                {preferredProvider === 'auto' && (
                  <Check className="w-4 h-4 text-purple-600" />
                )}
              </div>
              <h4 className="text-xs font-bold text-gray-900">Auto (Recommended)</h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                Gemini Vision + Gemini Image, with automatic DALL-E 3 fallback if quota is exceeded.
              </p>
            </div>

            {/* Google Gemini */}
            <div 
              onClick={() => setPreferredProvider('gemini')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                preferredProvider === 'gemini'
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-100'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                </div>
                {preferredProvider === 'gemini' && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <h4 className="text-xs font-bold text-gray-900">Google Gemini</h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                Ultra-fast Gemini 3.6/3.7 Flash for taxonomy + Gemini Multimodal Image Edit.
              </p>
            </div>

            {/* OpenAI */}
            <div 
              onClick={() => setPreferredProvider('openai')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                preferredProvider === 'openai'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-100'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Bot className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                {preferredProvider === 'openai' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <h4 className="text-xs font-bold text-gray-900">OpenAI DALL-E</h4>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                DALL-E 3 for commercial studio generation and high-resolution rendering.
              </p>
            </div>

          </div>
        </Card>

      </div>

      {/* API Key Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Google Gemini Configuration */}
        <Card className="p-6 border-gray-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Google Gemini API Key</h3>
                <p className="text-xs text-gray-500">Google AI Studio / Generative Language API</p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
              hasConfiguredGemini
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {hasConfiguredGemini ? 'Configured' : 'Not Set'}
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-700">Gemini API Key</Label>
            <div className="relative">
              <Input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Paste Gemini API Key (AQ... or AIza...)"
                className="pr-10 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Get an API key from{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"
              >
                Google AI Studio <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>

          {/* Test Live Connection Button & Result */}
          <div className="pt-2 border-t border-gray-100 space-y-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isTesting || testingProvider === 'gemini'}
              onClick={() => handleTestConnection('gemini')}
              className="w-full text-xs font-semibold gap-2 h-9 border-blue-200 text-blue-800 hover:bg-blue-50"
            >
              {testingProvider === 'gemini' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-blue-600" />
              )}
              Run Gemini Diagnostic Test
            </Button>

            {geminiTestResult && (
              <DiagnosticCard result={geminiTestResult} />
            )}
          </div>

          {/* Google Quota Advisory */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Free Tier Notice:</strong> Google AI Studio Free Tier allows text/vision generation, but has a limit of 0 for image synthesis. Link a Google Cloud Billing account (Pay-as-you-go) in AI Studio to generate real photos.
            </p>
          </div>
        </Card>

        {/* 2. OpenAI Configuration */}
        <Card className="p-6 border-gray-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Bot className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">OpenAI API Key</h3>
                <p className="text-xs text-gray-500">OpenAI DALL-E 3 & Vision Models</p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
              hasConfiguredOpenAi
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              {hasConfiguredOpenAi ? 'Configured' : 'Not Set'}
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-700">OpenAI API Key</Label>
            <div className="relative">
              <Input
                type={showOpenAiKey ? 'text' : 'password'}
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="Paste OpenAI API Key (sk-...)"
                className="pr-10 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showOpenAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Get an API key from{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noreferrer"
                className="text-emerald-600 hover:underline font-medium inline-flex items-center gap-0.5"
              >
                OpenAI Dashboard <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>

          {/* Test Live Connection Button & Result */}
          <div className="pt-2 border-t border-gray-100 space-y-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isTesting || testingProvider === 'openai'}
              onClick={() => handleTestConnection('openai')}
              className="w-full text-xs font-semibold gap-2 h-9 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            >
              {testingProvider === 'openai' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
              )}
              Run OpenAI Diagnostic Test
            </Button>

            {openaiTestResult && (
              <DiagnosticCard result={openaiTestResult} />
            )}
          </div>

          {/* OpenAI Quality Advisory */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>DALL-E 3 Ready:</strong> OpenAI DALL-E 3 produces commercial 1024x1024 photorealistic shots. When active, it automatically serves as the primary or secondary render engine for your sellers.
            </p>
          </div>
        </Card>

      </div>

      {/* Save Button Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={() => {
            if (config) {
              setEnableAiStudio(config.enableAiStudio !== false);
              setPreferredProvider(config.preferredProvider || 'auto');
              setGeminiApiKey(config.geminiApiKey || '');
              setOpenaiApiKey(config.openaiApiKey || '');
            }
          }}
          disabled={isSaving}
          className="text-xs font-semibold text-gray-700"
        >
          Discard Changes
        </Button>

        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-brand-navy hover:bg-brand-dark-navy text-white text-xs font-bold gap-2 px-6 h-10 shadow-sm"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save AI Platform Settings
        </Button>
      </div>

    </div>
  );
}
