'use client';

import { useGetPlatformStatsQuery, useGetPendingStoresQuery } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Store, Users, ShoppingBag, ShieldAlert, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetPlatformStatsQuery();
  const { data: pendingStores } = useGetPendingStoresQuery();

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading dashboard data...</div>;
  }

  const pendingCount = stats?.pendingStores ?? (pendingStores?.length || 0);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time platform operations, verification queue, and activity</p>
        </div>
        <Link href="/admin/stores">
          <Button className="bg-[#FF5A36] hover:bg-[#e04d2d] text-white gap-2 font-semibold shadow-sm">
            <ShieldAlert className="w-4 h-4" />
            Verification Center
            {pendingCount > 0 && (
              <span className="bg-white text-[#FF5A36] text-xs px-2 py-0.5 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </Button>
        </Link>
      </div>

      {/* Pending KYC Action Banner */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                {pendingCount} {pendingCount === 1 ? 'Store Application' : 'Store Applications'} Awaiting KYC Verification
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                New sellers submitted identification documents and are waiting for your approval to start selling.
              </p>
            </div>
          </div>
          <Link href="/admin/stores">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 whitespace-nowrap text-xs">
              Review Submissions <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Stores */}
        <Card className="rounded-2xl border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Total Stores
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF5A36] flex items-center justify-center">
              <Store className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900">{stats?.totalStores || 0}</div>
            <p className="text-[11px] text-gray-500 mt-1">
              {stats?.verifiedStores || 0} verified & active
            </p>
          </CardContent>
        </Card>
        
        {/* Pending Stores */}
        <Card className="rounded-2xl border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Pending KYC
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
            <p className="text-[11px] text-gray-500 mt-1">
              Requires admin approval
            </p>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="rounded-2xl border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Active Users
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900">{stats?.totalUsers || 0}</div>
            <p className="text-[11px] text-gray-500 mt-1">
              Registered customers & sellers
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="rounded-2xl border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Total Orders
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-900">{stats?.totalOrders || 0}</div>
            <p className="text-[11px] text-gray-500 mt-1">
              Platform-wide orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <Link href="/admin/stores" className="group">
          <div className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-[#FF5A36] transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF5A36] flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#FF5A36] transition-colors" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">Store Verification Center</h3>
            <p className="text-xs text-gray-500 mt-1">
              Review owner identity documents, owner photographs, and commercial licenses. Approve or reject onboarding applications.
            </p>
          </div>
        </Link>

        <Link href="/admin/users" className="group">
          <div className="p-6 bg-white rounded-2xl border border-gray-200 hover:border-purple-500 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">User & Seller Directory</h3>
            <p className="text-xs text-gray-500 mt-1">
              Inspect user roles, attached stores, authentication methods (Google, Phone, Local), and timestamps.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
