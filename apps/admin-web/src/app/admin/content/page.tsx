"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldAlert, CheckCircle, Loader2, AlertTriangle, Eye } from "lucide-react";
import {
  useGetReportedContentQuery,
  useUpdateReportStatusMutation,
  useDeleteReportedPostMutation,
  useDeleteReportedReelMutation
} from "@/lib/api";
import { toast } from "sonner";

export default function AdminContentPage() {
  const { data: reports = [], isLoading, refetch } = useGetReportedContentQuery();
  const [updateReportStatus, { isLoading: isUpdating }] = useUpdateReportStatusMutation();
  const [deleteReportedPost, { isLoading: isDeletingPost }] = useDeleteReportedPostMutation();
  const [deleteReportedReel, { isLoading: isDeletingReel }] = useDeleteReportedReelMutation();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED'>('ALL');

  const filteredReports = reports.filter((r: any) => {
    if (activeFilter === 'ALL') return true;
    return (r.status || 'PENDING') === activeFilter;
  });

  const pendingCount = reports.filter((r: any) => (r.status || 'PENDING') === 'PENDING').length;
  const resolvedCount = reports.filter((r: any) => r.status === 'RESOLVED').length;
  const dismissedCount = reports.filter((r: any) => r.status === 'DISMISSED').length;

  const handleDismiss = async (reportId: string) => {
    try {
      await updateReportStatus({ id: reportId, status: 'DISMISSED' }).unwrap();
      toast.success('Report dismissed');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update report');
    }
  };

  const handleTakedown = async (report: any) => {
    if (!confirm(`Are you sure you want to take down this ${report.type}? This will permanently remove it from the platform.`)) {
      return;
    }

    try {
      if (report.type === 'Reel') {
        await deleteReportedReel(report.targetId).unwrap();
      } else {
        await deleteReportedPost(report.targetId).unwrap();
      }
      toast.success(`${report.type} taken down successfully`);
    } catch (err: any) {
      toast.error(err?.data?.message || `Failed to take down ${report.type}`);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Content Moderation</h2>
          <p className="text-gray-500 mt-1">Review live reported Reels and Posts submitted by users.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Reports</div>
          <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Pending Review</div>
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-green-200 bg-green-50/20 shadow-sm">
          <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Resolved / Taken Down</div>
          <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dismissed</div>
          <div className="text-2xl font-bold text-gray-600">{dismissedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {(['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeFilter === status
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-200 rounded-xl">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
          <span className="text-xs font-medium text-gray-500">Loading reported content...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-200 rounded-xl text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 text-base">No Reported Content</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            {activeFilter === 'ALL'
              ? 'There are currently no reported posts or reels in the system.'
              : `There are no reports matching the "${activeFilter}" filter.`}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 uppercase">Store / Author</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 uppercase">Report Reason</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 uppercase">Caption / Media</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 font-semibold text-xs text-gray-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.map((report: any) => {
                const isPending = (report.status || 'PENDING') === 'PENDING';
                return (
                  <tr key={report.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        report.type === 'Reel' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{report.storeName}</div>
                      <div className="text-xs text-gray-400">Reporter: {report.reporter}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-center text-red-600 font-semibold text-xs">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1 shrink-0" />
                        <span className="truncate">{report.reason}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs text-gray-600 truncate" title={report.caption}>
                        {report.caption || '(No caption)'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                        report.status === 'DISMISSED' ? 'bg-gray-100 text-gray-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {report.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {isPending && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-gray-600 border-gray-200 hover:bg-gray-50 text-xs h-8"
                          onClick={() => handleDismiss(report.id)}
                          disabled={isUpdating}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" /> Dismiss
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8"
                        onClick={() => handleTakedown(report)}
                        disabled={isDeletingPost || isDeletingReel}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Takedown
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
