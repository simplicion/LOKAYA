'use client';

import React, { useState, useMemo } from 'react';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Copy, 
  Percent, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Search, 
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  Tag,
  ArrowUpDown,
  ShoppingBag
} from 'lucide-react';
import { 
  useGetCouponsQuery, 
  useGetCouponStatsQuery,
  useCreateCouponMutation, 
  useUpdateCouponMutation, 
  useDeleteCouponMutation, 
  useToggleCouponMutation 
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from 'sonner';

export default function CouponManagementPage() {
  const { data: coupons = [], isLoading: isCouponsLoading } = useGetCouponsQuery();
  const { data: statsData, isLoading: isStatsLoading } = useGetCouponStatsQuery();

  const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponMutation();
  const [deleteCoupon, { isLoading: isDeleting }] = useDeleteCouponMutation();
  const [toggleCoupon] = useToggleCouponMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PERCENTAGE' | 'FIXED'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('ALL');

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<string>('10');
  const [minCartValue, setMinCartValue] = useState<string>('');
  const [maxDiscount, setMaxDiscount] = useState<string>('');
  const [validFrom, setValidFrom] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const resetForm = () => {
    setCode('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('10');
    setMinCartValue('');
    setMaxDiscount('');
    setValidFrom(new Date().toISOString().split('T')[0]);
    setValidUntil('');
    setUsageLimit('');
    setIsActive(true);
    setEditingCouponId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: any) => {
    setEditingCouponId(coupon.id);
    setCode(coupon.code || '');
    setDiscountType(coupon.discountType || 'PERCENTAGE');
    setDiscountValue(coupon.discountValue?.toString() || '0');
    setMinCartValue(coupon.minCartValue ? coupon.minCartValue.toString() : '');
    setMaxDiscount(coupon.maxDiscount ? coupon.maxDiscount.toString() : '');
    setValidFrom(coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '');
    setValidUntil(coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '');
    setUsageLimit(coupon.usageLimit ? coupon.usageLimit.toString() : '');
    setIsActive(coupon.isActive ?? true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    const numVal = parseFloat(discountValue);
    if (isNaN(numVal) || numVal <= 0) {
      toast.error('Discount value must be a valid positive number');
      return;
    }

    if (discountType === 'PERCENTAGE' && numVal > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: numVal,
        minCartValue: minCartValue ? parseFloat(minCartValue) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        validFrom: validFrom ? new Date(validFrom).toISOString() : new Date().toISOString(),
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        isActive,
      };

      if (editingCouponId) {
        await updateCoupon({ id: editingCouponId, body: payload }).unwrap();
        toast.success(`Coupon ${payload.code} updated successfully!`);
      } else {
        await createCoupon(payload).unwrap();
        toast.success(`Coupon ${payload.code} created successfully!`);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save coupon');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCouponId) return;
    try {
      await deleteCoupon(deletingCouponId).unwrap();
      setDeletingCouponId(null);
      toast.success('Coupon deleted successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete coupon');
    }
  };

  const handleToggle = async (id: string, couponCode: string) => {
    try {
      await toggleCoupon(id).unwrap();
      toast.success(`Status updated for ${couponCode}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to toggle status');
    }
  };

  const handleCopy = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    toast.success(`Coupon code "${couponCode}" copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filter & Search Logic
  const filteredCoupons = useMemo(() => {
    const now = new Date();
    return coupons.filter((c: any) => {
      const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchesType = filterType === 'ALL' || c.discountType === filterType;
      
      const isExpired = c.validUntil && new Date(c.validUntil) < now;
      let matchesStatus = true;
      if (filterStatus === 'ACTIVE') {
        matchesStatus = c.isActive && !isExpired;
      } else if (filterStatus === 'INACTIVE') {
        matchesStatus = !c.isActive;
      } else if (filterStatus === 'EXPIRED') {
        matchesStatus = Boolean(isExpired);
      }

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [coupons, searchTerm, filterType, filterStatus]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            E-Commerce Growth Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Coupons & Promo Codes</h1>
          <p className="text-emerald-100/70 text-sm max-w-xl">
            Create high-converting flash discounts, tiered cart incentives, and usage-capped promo campaigns.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreate}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-6 rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 self-start md:self-auto shrink-0 relative z-10"
        >
          <Plus className="w-5 h-5" />
          Create New Coupon
        </Button>
      </div>

      {/* 2. Key Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6 rounded-3xl border border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Coupons</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-4">
            {statsData?.totalCoupons ?? coupons.length}
          </p>
          <span className="text-xs text-gray-400 mt-1 inline-block">Created across campaigns</span>
        </Card>

        <Card className="p-6 rounded-3xl border border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Campaigns</span>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-teal-700 mt-4">
            {statsData?.activeCoupons ?? coupons.filter((c: any) => c.isActive).length}
          </p>
          <span className="text-xs text-teal-600/70 mt-1 inline-block">Ready for checkout redemption</span>
        </Card>

        <Card className="p-6 rounded-3xl border border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Redemptions</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-indigo-900 mt-4">
            {statsData?.totalRedemptions ?? coupons.reduce((sum: number, c: any) => sum + (c.usedCount || 0), 0)}
          </p>
          <span className="text-xs text-indigo-500/70 mt-1 inline-block">Customer orders claimed</span>
        </Card>

        <Card className="p-6 rounded-3xl border border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expired / Capped</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-800 mt-4">
            {statsData?.expiredCoupons ?? coupons.filter((c: any) => c.validUntil && new Date(c.validUntil) < new Date()).length}
          </p>
          <span className="text-xs text-amber-600/70 mt-1 inline-block">Archived or expired dates</span>
        </Card>
      </div>

      {/* 3. Search, Filter & List Section */}
      <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search coupon by code (e.g. FESTIVE20)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-gray-50/70 border-gray-200 rounded-2xl text-sm focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Discount Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="h-11 px-4 text-xs font-semibold rounded-2xl bg-gray-50 border border-gray-200 text-gray-700 outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="ALL">All Discount Types</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (₹)</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="h-11 px-4 text-xs font-semibold rounded-2xl bg-gray-50 border border-gray-200 text-gray-700 outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="overflow-x-auto">
          {isCouponsLoading ? (
            <div className="p-16 flex flex-col items-center justify-center text-gray-400 gap-3">
              <Ticket className="w-8 h-8 animate-pulse text-emerald-500" />
              <span className="text-xs font-semibold">Loading Coupons...</span>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4 text-gray-300">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1">No coupons match your criteria</h3>
              <p className="text-xs text-gray-400 max-w-sm mb-6">
                Try searching for a different code or create your first promotional coupon to incentivize buyers.
              </p>
              <Button 
                onClick={handleOpenCreate} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs h-9 px-4"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Coupon
              </Button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Coupon Code</th>
                  <th className="py-4 px-6">Discount Value</th>
                  <th className="py-4 px-6">Usage & Redemptions</th>
                  <th className="py-4 px-6">Requirements</th>
                  <th className="py-4 px-6">Validity</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredCoupons.map((coupon: any) => {
                  const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
                  const usagePercent = coupon.usageLimit ? Math.min(Math.round((coupon.usedCount / coupon.usageLimit) * 100), 100) : 0;

                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50/80 transition-colors group">
                      {/* Code */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs tracking-wider uppercase">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopy(coupon.code)}
                            title="Copy code"
                            className="p-1 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 flex items-center gap-1">
                            {coupon.discountType === 'PERCENTAGE' ? (
                              <>
                                <span className="text-emerald-600">{coupon.discountValue}% OFF</span>
                              </>
                            ) : (
                              <>
                                <span className="text-emerald-600">₹{coupon.discountValue} FLAT OFF</span>
                              </>
                            )}
                          </span>
                          {coupon.maxDiscount && (
                            <span className="text-[11px] text-gray-400">
                              Max discount: ₹{coupon.maxDiscount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5 min-w-[130px]">
                          <div className="flex justify-between text-xs font-semibold text-gray-700">
                            <span>{coupon.usedCount} used</span>
                            <span className="text-gray-400">
                              {coupon.usageLimit ? `${coupon.usageLimit} max` : 'Unlimited'}
                            </span>
                          </div>
                          {coupon.usageLimit && (
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${usagePercent >= 100 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Requirements */}
                      <td className="py-4 px-6 text-xs text-gray-600">
                        {coupon.minCartValue ? (
                          <span className="bg-gray-100 px-2.5 py-1 rounded-lg font-medium text-gray-700">
                            Min. order: ₹{coupon.minCartValue}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">No min order</span>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="py-4 px-6 text-xs">
                        <div className="flex flex-col text-gray-600">
                          {coupon.validUntil ? (
                            <>
                              <span className={isExpired ? 'text-red-500 font-semibold' : 'text-gray-700'}>
                                Until {new Date(coupon.validUntil).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              {isExpired && <span className="text-[10px] text-red-400 uppercase font-bold">Expired</span>}
                            </>
                          ) : (
                            <span className="text-emerald-600 font-medium">Never expires</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggle(coupon.id, coupon.code)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            coupon.isActive && !isExpired
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${coupon.isActive && !isExpired ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {coupon.isActive && !isExpired ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(coupon)}
                            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            title="Edit coupon"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingCouponId(coupon.id)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* 4. Create / Edit Coupon Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    {editingCouponId ? 'Edit Coupon' : 'Create New Promotional Coupon'}
                  </h2>
                  <p className="text-xs text-gray-400">Configure discount value, usage limits, and validity</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Code */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700 uppercase">Coupon Code *</Label>
                <Input
                  type="text"
                  placeholder="e.g. WELCOME50, DIWALI20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  className="h-11 font-mono font-bold tracking-wider rounded-xl uppercase"
                  required
                />
                <span className="text-[11px] text-gray-400">Buyers will enter this exact code at checkout.</span>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700 uppercase">Discount Type</Label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full h-11 px-3.5 text-sm font-semibold rounded-xl bg-gray-50 border border-gray-200 text-gray-800 outline-none focus:bg-white focus:border-emerald-500"
                  >
                    <option value="PERCENTAGE">Percentage (%) Discount</option>
                    <option value="FIXED">Flat Currency (₹) Discount</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700 uppercase">
                    Discount Amount {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'} *
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max={discountType === 'PERCENTAGE' ? '100' : undefined}
                    placeholder={discountType === 'PERCENTAGE' ? '20' : '200'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="h-11 font-semibold rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700 uppercase">Min Cart Value (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 500 (Optional)"
                    value={minCartValue}
                    onChange={(e) => setMinCartValue(e.target.value)}
                    className="h-11 rounded-xl text-sm"
                  />
                  <span className="text-[11px] text-gray-400">Leave blank for no minimum requirement.</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700 uppercase">Max Discount Cap (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 300 (Optional for %)"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="h-11 rounded-xl text-sm"
                  />
                  <span className="text-[11px] text-gray-400">Ceiling cap for percentage discounts.</span>
                </div>
              </div>

              {/* Usage Limit & Expiration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700 uppercase">Usage Limit</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 100 (Total redemptions)"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="h-11 rounded-xl text-sm"
                  />
                  <span className="text-[11px] text-gray-400">Leave empty for unlimited claims.</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700 uppercase">Expiration Date</Label>
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="h-11 rounded-xl text-sm"
                  />
                  <span className="text-[11px] text-gray-400">Leave blank for perpetual coupons.</span>
                </div>
              </div>

              {/* Active Status Checkbox */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-gray-800 cursor-pointer select-none">
                  Activate this coupon immediately for buyer checkouts
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs font-semibold px-5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-6 h-10 shadow-md shadow-emerald-600/20"
                >
                  {isCreating || isUpdating ? 'Saving...' : editingCouponId ? 'Save Changes' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingCouponId)}
        onClose={() => setDeletingCouponId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Coupon"
        description="Are you sure you want to permanently delete this coupon? Existing orders will maintain their records, but no future checkouts will be able to apply it."
        confirmText="Yes, Delete Coupon"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
