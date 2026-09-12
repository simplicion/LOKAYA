'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  ShoppingBag, 
  Store, 
  Layers, 
  Copy, 
  Check, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { 
  useGetBannersQuery, 
  useCreateBannerMutation, 
  useUpdateBannerMutation, 
  useDeleteBannerMutation, 
  useToggleBannerMutation,
  useGetAllStoresQuery,
  useGetProductsQuery
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from 'sonner';

export default function EcommerceControlPage() {
  const { data: banners = [], isLoading: isBannersLoading } = useGetBannersQuery();
  const { data: stores = [] } = useGetAllStoresQuery({ status: 'VERIFIED' });
  const { data: products = [] } = useGetProductsQuery();

  const [createBanner, { isLoading: isCreating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteBannerMutation();
  const [toggleBanner] = useToggleBannerMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [buttonText, setButtonText] = useState('Shop Now');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setTagline('');
    setImageUrl('');
    setLinkUrl('');
    setButtonText('Shop Now');
    setDisplayOrder(banners.length + 1);
    setIsActive(true);
    setEditingBannerId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: any) => {
    setEditingBannerId(banner.id);
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setTagline(banner.tagline || '');
    setImageUrl(banner.imageUrl || '');
    setLinkUrl(banner.linkUrl || '');
    setButtonText(banner.buttonText || 'Shop Now');
    setDisplayOrder(banner.displayOrder || 1);
    setIsActive(banner.isActive ?? true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      toast.error('Please fill in both the Banner Title and Image URL');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        tagline: tagline.trim() || null,
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim() || null,
        buttonText: buttonText.trim() || 'Shop Now',
        displayOrder: Number(displayOrder) || 0,
        isActive: Boolean(isActive),
      };

      if (editingBannerId) {
        await updateBanner({ id: editingBannerId, body: payload }).unwrap();
        toast.success('Banner updated successfully!');
      } else {
        await createBanner(payload).unwrap();
        toast.success('Banner created successfully!');
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save banner');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBannerId) return;
    try {
      await deleteBanner(deletingBannerId).unwrap();
      setDeletingBannerId(null);
      toast.success('Banner deleted successfully');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete banner');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleBanner(id).unwrap();
      toast.success('Banner status toggled');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to toggle banner status');
    }
  };

  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const activeCount = banners.filter((b: any) => b.isActive).length;
  const pausedCount = banners.length - activeCount;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">E-Commerce & Banner Control</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage explore page promotional banners, interactive marketing carousels, and app deep links.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreate}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-sm flex items-center gap-2 px-5 py-2.5"
        >
          <Plus className="w-4 h-4" />
          Add Promotional Banner
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 border-gray-100 shadow-sm bg-white rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Banners</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{banners.length}</p>
          </div>
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
            <Layers className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 border-gray-100 shadow-sm bg-white rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live & Active</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Eye className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 border-gray-100 shadow-sm bg-white rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paused / Draft</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pausedCount}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <EyeOff className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Banners List Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Explore Promotional Banners</h2>
            <p className="text-xs text-gray-500">Live carousels visible in the customer explore feed.</p>
          </div>
          <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
            {banners.length} configured
          </span>
        </div>

        {isBannersLoading ? (
          <div className="py-16 text-center text-gray-400">Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="py-16 text-center px-4">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-gray-800">No banners configured yet</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Create your first promotional banner to showcase top collections, seasonal discounts, or featured stores.
            </p>
            <Button onClick={handleOpenCreate} className="mt-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Add First Banner
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {banners.map((banner: any) => (
              <div 
                key={banner.id}
                className={`flex flex-col rounded-2xl border overflow-hidden transition shadow-sm hover:shadow-md ${
                  banner.isActive ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 opacity-70'
                }`}
              >
                {/* Banner Visual Display */}
                <div className="relative h-44 bg-[#2D2321] overflow-hidden flex items-center">
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title} 
                    className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                  
                  <div className="relative z-10 p-5 flex flex-col items-start max-w-[70%]">
                    {banner.tagline && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-orange-600 text-white px-2 py-0.5 rounded-full mb-1.5 shadow-sm">
                        {banner.tagline}
                      </span>
                    )}
                    <h3 className="text-white text-lg font-bold leading-tight line-clamp-1">{banner.title}</h3>
                    {banner.subtitle && (
                      <p className="text-gray-300 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {banner.subtitle}
                      </p>
                    )}
                    <div className="mt-3 bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {banner.buttonText || 'Shop Now'}
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className="absolute top-3 right-3 z-20">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 ${
                      banner.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {banner.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {banner.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>

                {/* Banner Meta & Actions */}
                <div className="p-4 bg-white flex-1 flex flex-col justify-between border-t border-gray-100">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <LinkIcon className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span className="font-semibold text-gray-700">Target Route:</span>
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-mono text-[11px] truncate flex-1">
                        {banner.linkUrl || '/search'}
                      </code>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Order Priority: <strong className="text-gray-800">#{banner.displayOrder}</strong></span>
                      <span>•</span>
                      <span>Created: {new Date(banner.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggle(banner.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                        banner.isActive 
                          ? 'text-amber-700 border-amber-200 hover:bg-amber-50' 
                          : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {banner.isActive ? 'Pause Banner' : 'Activate Banner'}
                    </button>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenEdit(banner)}
                        className="rounded-lg h-8 px-2.5 text-gray-700 hover:text-orange-600 hover:border-orange-200"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <button 
                        onClick={() => setDeletingBannerId(banner.id)}
                        className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Deep Link Lookup Helper */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verified Stores Quick Links */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="text-base font-bold text-gray-900">Store Deep-Links</h3>
              <p className="text-xs text-gray-500">Copy store links to attach to promotional banners.</p>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {stores.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No verified stores found.</p>
            ) : (
              stores.map((s: any) => {
                const link = `/store/${s.id}`;
                return (
                  <div key={s.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs hover:bg-orange-50/50 transition">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
                        {s.name?.charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-800 truncate">{s.name}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(link)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shrink-0 shadow-2xs"
                    >
                      {copiedLink === link ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedLink === link ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Products Quick Links */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="text-base font-bold text-gray-900">Product Deep-Links</h3>
              <p className="text-xs text-gray-500">Direct buyers straight to product checkout & detail pages.</p>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {products.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No active products found.</p>
            ) : (
              products.map((p: any) => {
                const link = `/product/${p.id}`;
                return (
                  <div key={p.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-xs hover:bg-orange-50/50 transition">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={p.image || p.primaryImage} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 bg-gray-200" />
                      <div className="truncate">
                        <p className="font-semibold text-gray-800 truncate">{p.title || p.name}</p>
                        <p className="text-[10px] text-gray-500">₹{p.price}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(link)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shrink-0 shadow-2xs"
                    >
                      {copiedLink === link ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedLink === link ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Banner Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {editingBannerId ? 'Edit Promotional Banner' : 'Create New Promotional Banner'}
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Configure banner visuals, marketing messaging, and target deep-link navigation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Banner Title *</Label>
                  <Input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Summer Festival Sale"
                    required
                    className="rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Badge / Tagline</Label>
                  <Input 
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. 50% OFF or New Arrival"
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Subtitle / Description</Label>
                <Input 
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Discover authentic handmade apparel from local designers"
                  className="rounded-xl text-sm"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Banner Image URL *</Label>
                <Input 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or uploaded media URL"
                  required
                  className="rounded-xl text-sm"
                />
                <div className="flex gap-2 pt-1 overflow-x-auto no-scrollbar">
                  {[
                    'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop'
                  ].map((preset, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setImageUrl(preset)}
                      className="text-[10px] text-gray-600 bg-gray-100 hover:bg-orange-100 hover:text-orange-700 px-2 py-1 rounded-md transition"
                    >
                      Preset #{i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deep Link & Button Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Navigation Deep-Link</Label>
                  <Input 
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="e.g. /search?q=shoes or /store/..."
                    className="rounded-xl text-sm"
                  />
                  {/* Quick Route Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['/search?q=shoes', '/search?q=t-shirt', '/home/reels', '/wishlist'].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setLinkUrl(preset)}
                        className="text-[10px] bg-gray-100 hover:bg-orange-100 hover:text-orange-700 px-2 py-0.5 rounded transition text-gray-700 font-mono"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Button Text</Label>
                  <Input 
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. Shop Now, Explore, Visit"
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Display Order & Active State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Display Order Priority</Label>
                  <Input 
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                    min="1"
                    className="rounded-xl text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input 
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
                  />
                  <Label htmlFor="isActiveCheck" className="text-sm font-semibold text-gray-800 cursor-pointer">
                    Publish Live immediately
                  </Label>
                </div>
              </div>

              {/* Live Preview Card */}
              {imageUrl && (
                <div className="pt-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Live Mobile Banner Preview
                  </Label>
                  <div className="relative h-36 bg-[#2D2321] rounded-2xl overflow-hidden flex items-center shadow-sm border border-gray-200">
                    <img 
                      src={imageUrl} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
                    
                    <div className="relative z-10 p-4 flex flex-col items-start max-w-[70%]">
                      {tagline && (
                        <span className="text-[9px] font-extrabold uppercase bg-orange-600 text-white px-2 py-0.5 rounded-full mb-1">
                          {tagline}
                        </span>
                      )}
                      <h4 className="text-white text-base font-bold leading-tight line-clamp-1">{title || 'Banner Title'}</h4>
                      {subtitle && (
                        <p className="text-gray-300 text-[11px] mt-0.5 line-clamp-1">
                          {subtitle}
                        </p>
                      )}
                      <div className="mt-2 bg-white text-gray-900 text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                        {buttonText || 'Shop Now'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating || isUpdating}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-6 font-semibold shadow-sm"
                >
                  {isCreating || isUpdating ? 'Saving...' : editingBannerId ? 'Update Banner' : 'Create Banner'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Custom Confirmation Modal for Deleting Banners */}
      <ConfirmationModal
        isOpen={Boolean(deletingBannerId)}
        onClose={() => setDeletingBannerId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Promotional Banner?"
        description="Are you sure you want to delete this banner? It will immediately stop showing on the Explore page and mobile feed."
        confirmText="Delete Banner"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
