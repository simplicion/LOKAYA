'use client';

import { useState } from 'react';
import { Smartphone, Download, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function DownloadAppBanner() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    toast.success('Downloading LOKAYA Android APK...', {
      description: 'Once downloaded, tap the notification or file to install on your Android device.',
      duration: 5000,
    });

    // Create invisible anchor to download
    const link = document.createElement('a');
    link.href = '/downloads/lokaya.apk';
    link.setAttribute('download', 'lokaya.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-md border border-emerald-500/30 relative overflow-hidden my-4">
      {/* Background ambient glow */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 max-w-md">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Native Android Experience</span>
          </div>

          <h3 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-200" />
            Download LOKAYA Android App
          </h3>

          <p className="text-xs text-emerald-50 leading-relaxed">
            Get instant order status push notifications, ultra-smooth reels, tactile haptics, and fast checkout.
          </p>

          <div className="flex items-center gap-3 pt-1 text-[11px] text-emerald-100">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Safe & Verified APK
            </span>
            <span>•</span>
            <span>v1.0.0 Release (~18 MB)</span>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
        >
          <Download className={`w-4 h-4 text-emerald-600 ${isDownloading ? 'animate-bounce' : ''}`} />
          {isDownloading ? 'Starting Download...' : 'Download APK'}
        </button>
      </div>
    </div>
  );
}
