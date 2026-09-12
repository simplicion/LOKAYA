import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExportAnalyticsMutation } from '@/lib/api';
import { toast } from 'sonner';

export default function AnalyticsExportPage() {
  const router = useRouter();
  const [reportType, setReportType] = useState('Sales Report');
  const [dateRange, setDateRange] = useState('This Month');
  const [exportFormat, setExportFormat] = useState('CSV');
  const [exportAnalytics, { isLoading }] = useExportAnalyticsMutation();

  const handleExport = async () => {
    try {
      const csvData = await exportAnalytics({
        reportType,
        dateRange,
        format: exportFormat
      }).unwrap();

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${reportType.toLowerCase().replace(/\s+/g, '_')}_${dateRange.toLowerCase().replace(/\s+/g, '_')}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report exported successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to export report');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Analytics Export</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <p className="text-sm text-gray-500">Export your analytics report</p>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Select Data</label>
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Sales Report</option>
              <option>Customer Report</option>
              <option>Order Report</option>
              <option>Product Report</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Select Date Range</label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Year</option>
              <option>Custom Range</option>
            </select>

            {dateRange === 'Custom Range' && (
              <div className="flex items-center gap-2 mt-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-700">01 May 2024</span>
                <span className="text-gray-400 mx-2">-</span>
                <span className="text-sm text-gray-700 flex-1">31 May 2024</span>
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Export Format</label>
            <div className="grid grid-cols-3 gap-3">
              {['PDF', 'Excel', 'CSV'].map((format) => (
                <button
                  key={format}
                  onClick={() => setExportFormat(format)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-colors ${
                    exportFormat === format 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-100'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Button 
          onClick={handleExport}
          disabled={isLoading}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-semibold text-base shadow-sm flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating Report...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Export Report</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
