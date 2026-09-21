'use client';

import { useState } from 'react';
import {
  useGetNotificationCampaignsQuery,
  useBroadcastNotificationMutation,
  useGetNotificationStatsQuery,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Bell,
  Send,
  Smartphone,
  Users,
  Store,
  Bike,
  MapPin,
  Search,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Flame,
  Radio
} from 'lucide-react';

export default function NotificationMarketingPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [deepLink, setDeepLink] = useState('/home');
  const [customDeepLink, setCustomDeepLink] = useState('');
  const [targetAudience, setTargetAudience] = useState<string>('ALL_USERS');
  const [targetCity, setTargetCity] = useState('');
  const [specificUserQuery, setSpecificUserQuery] = useState('');

  const { data: stats, refetch: refetchStats, isFetching: isFetchingStats } = useGetNotificationStatsQuery();
  const { data: campaignsData, refetch: refetchCampaigns, isLoading: isLoadingCampaigns } = useGetNotificationCampaignsQuery();
  const [broadcastNotification, { isLoading: isBroadcasting }] = useBroadcastNotificationMutation();

  const campaigns = campaignsData?.items || [];

  const handleQuickPreset = (presetType: 'SALE' | 'ORDER' | 'STORY' | 'DELIVERY') => {
    switch (presetType) {
      case 'SALE':
        setTitle('🔥 Flash Deal Alert: Up to 50% Off!');
        setBody('Super discounts are live across trending stores in your area. Grab them before stock runs out!');
        setImageUrl('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop');
        setDeepLink('/explore');
        break;
      case 'ORDER':
        setTitle('🛍️ Craving Something Delicious?');
        setBody('Explore top-rated verified stores nearby with lightning-fast delivery.');
        setImageUrl('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop');
        setDeepLink('/home');
        break;
      case 'STORY':
        setTitle('⚡ New 24h Stories from Local Creators');
        setBody('See what stores and creators in your city are sharing today!');
        setImageUrl('https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop');
        setDeepLink('/home');
        break;
      case 'DELIVERY':
        setTitle('🚴 Partner Up & Earn with LOKAYA Delivery');
        setBody('Flexible schedules, instant payouts, and dynamic distance pricing. Join our rider fleet today!');
        setImageUrl('https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop');
        setDeepLink('/delivery/onboarding');
        break;
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast.error('Notification title and body message are required');
      return;
    }

    const resolvedDeepLink = deepLink === 'CUSTOM' ? (customDeepLink.trim() || '/') : deepLink;

    const targetFilter: any = {};
    if (targetAudience === 'CUSTOM_SEGMENT' && targetCity.trim()) {
      targetFilter.city = targetCity.trim();
    }
    if (targetAudience === 'SPECIFIC_USER' && specificUserQuery.trim()) {
      targetFilter.searchQuery = specificUserQuery.trim();
    }

    try {
      const res = await broadcastNotification({
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || undefined,
        deepLink: resolvedDeepLink,
        targetAudience,
        targetFilter: Object.keys(targetFilter).length > 0 ? targetFilter : undefined,
      }).unwrap();

      toast.success(res.message || 'Push notification campaign dispatched successfully!');
      setTitle('');
      setBody('');
      setImageUrl('');
      setCustomDeepLink('');
      setSpecificUserQuery('');
      setTargetCity('');
      refetchCampaigns();
      refetchStats();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to dispatch push campaign');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shadow-sm">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Push Notification Marketing Studio
              </h1>
              <p className="text-sm text-gray-500">
                Compose, preview, and broadcast rich FCM push notifications with deep links & audience targeting.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchStats();
              refetchCampaigns();
            }}
            disabled={isFetchingStats}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingStats ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Active Devices</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalDevices ?? 0}</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 mt-1">
              <Radio className="w-3.5 h-3.5" /> FCM Token Registered
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Android Native</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.androidDevices ?? 0}</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> APK / Play Store
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">iOS & Web Push</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {(stats?.iosDevices ?? 0) + (stats?.webDevices ?? 0)}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 mt-1">
              iOS: {stats?.iosDevices ?? 0} | Web: {stats?.webDevices ?? 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaigns Sent</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats?.totalCampaigns ?? 0}</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 mt-1">
              In-App Notifs: {stats?.totalInApp ?? 0}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Composer & Phone Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campaign Composer (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-rose-600" />
              Compose Broadcast Campaign
            </h2>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-400 font-medium mr-1">Templates:</span>
              <button
                type="button"
                onClick={() => handleQuickPreset('SALE')}
                className="text-[11px] font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
              >
                <Flame className="w-3 h-3" /> Flash Sale
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('ORDER')}
                className="text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
              >
                Explore
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('DELIVERY')}
                className="text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-md transition-colors"
              >
                Rider
              </button>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            {/* Target Audience Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Target Audience Segment
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'ALL_USERS', label: 'All Users', icon: Users, desc: 'Global platform' },
                  { id: 'STORE_OWNERS', label: 'Sellers', icon: Store, desc: 'Store owners' },
                  { id: 'RIDERS', label: 'Riders', icon: Bike, desc: 'Delivery partners' },
                  { id: 'CUSTOM_SEGMENT', label: 'Location', icon: MapPin, desc: 'City / Region' },
                  { id: 'SPECIFIC_USER', label: 'Single User', icon: Search, desc: 'Phone / Email' },
                ].map((aud) => {
                  const Icon = aud.icon;
                  const isSelected = targetAudience === aud.id;
                  return (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setTargetAudience(aud.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50/50 text-rose-900 shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-rose-600' : 'text-gray-500'}`} />
                        {isSelected && <span className="w-2 h-2 rounded-full bg-rose-600" />}
                      </div>
                      <div>
                        <p className="font-bold text-xs">{aud.label}</p>
                        <p className="text-[10px] text-gray-400">{aud.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional Filter Inputs */}
            {targetAudience === 'CUSTOM_SEGMENT' && (
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs">
                <label className="block font-semibold text-gray-700 mb-1">Target City / Region Name</label>
                <Input
                  placeholder="e.g. Kathmandu, Pokhara, Mumbai, Delhi, New York..."
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  className="bg-white"
                />
              </div>
            )}

            {targetAudience === 'SPECIFIC_USER' && (
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs">
                <label className="block font-semibold text-gray-700 mb-1">Search User (Phone, Email or Name)</label>
                <Input
                  placeholder="e.g. +9779800000000 or user@lokaya.shop"
                  value={specificUserQuery}
                  onChange={(e) => setSpecificUserQuery(e.target.value)}
                  className="bg-white"
                />
              </div>
            )}

            {/* Notification Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Notification Title *
              </label>
              <Input
                placeholder="e.g. Weekend Flash Sale! 🎁"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={80}
                className="font-medium"
              />
              <span className="text-[10px] text-gray-400 mt-1 block text-right">
                {title.length}/80 characters
              </span>
            </div>

            {/* Notification Body */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Notification Message Body *
              </label>
              <textarea
                placeholder="Write the message text that will display on the user's phone lock screen..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={3}
                maxLength={240}
                className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block text-right">
                {body.length}/240 characters
              </span>
            </div>

            {/* Image / Thumbnail URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Rich Banner Image URL (Optional)
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="https://... image banner URL for rich expanded notification"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            {/* Deep Link Destination */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                In-App Deep Link Destination
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={deepLink}
                  onChange={(e) => setDeepLink(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="/home">🏠 Home Screen (/home)</option>
                  <option value="/explore">🔍 Explore & Nearby Stores (/explore)</option>
                  <option value="/cart">🛒 Shopping Cart (/cart)</option>
                  <option value="/orders">📦 Order History (/orders)</option>
                  <option value="/delivery/orders">🚴 Rider Task Portal (/delivery/orders)</option>
                  <option value="/profile">👤 Profile & Account (/profile)</option>
                  <option value="CUSTOM">🔗 Custom App Link / URL</option>
                </select>

                {deepLink === 'CUSTOM' && (
                  <Input
                    placeholder="/store/id or /product/id"
                    value={customDeepLink}
                    onChange={(e) => setCustomDeepLink(e.target.value)}
                    className="text-xs"
                  />
                )}
              </div>
            </div>

            {/* Send Action */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Dispatches immediately to all eligible FCM tokens.
              </span>
              <Button
                type="submit"
                disabled={isBroadcasting || !title || !body}
                className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-sm font-semibold"
              >
                {isBroadcasting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Push Notification
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Live Phone Lock-Screen Mockup (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-gray-900 rounded-[42px] p-3.5 shadow-2xl border-4 border-gray-800 relative">
            {/* Phone Notch / Dynamic Island */}
            <div className="w-24 h-4 bg-black rounded-full mx-auto mb-3" />

            {/* Lock Screen UI */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 rounded-[32px] p-4 text-white min-h-[480px] flex flex-col justify-between relative overflow-hidden">
              {/* Lock Screen Clock */}
              <div className="text-center pt-2">
                <p className="text-[11px] font-medium text-slate-300">Monday, September 21</p>
                <p className="text-4xl font-extralight tracking-tight text-white mt-0.5">09:41</p>
              </div>

              {/* Push Notification Card */}
              <div className="my-auto space-y-2 animate-in fade-in-50 slide-in-from-top-4">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 text-gray-900 shadow-xl border border-white/40 space-y-2">
                  {/* Notification Header */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-md bg-emerald-600 flex items-center justify-center text-white text-[8px] font-bold">
                        L
                      </div>
                      <span className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">
                        LOKAYA
                      </span>
                    </div>
                    <span>now</span>
                  </div>

                  {/* Notification Content */}
                  <div>
                    <h3 className="font-bold text-xs text-gray-900 leading-tight">
                      {title || '🔥 Notification Title Preview'}
                    </h3>
                    <p className="text-[11px] text-gray-600 mt-1 leading-snug line-clamp-3">
                      {body || 'Your notification message body preview will be displayed here exactly as users see it on their Android & iOS devices.'}
                    </p>
                  </div>

                  {/* Rich Thumbnail Banner Preview */}
                  {imageUrl && (
                    <div className="rounded-xl overflow-hidden mt-2 border border-gray-100 max-h-32 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Push banner preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Deep Link Action Badge */}
                  <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <ExternalLink className="w-2.5 h-2.5" />
                      Opens {deepLink === 'CUSTOM' ? (customDeepLink || '/') : deepLink}
                    </span>
                    <span>Tap to view</span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Actions */}
              <div className="flex justify-between items-center px-4 pb-2 text-slate-400 text-xs">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Smartphone className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="w-16 h-1 bg-white/40 rounded-full" />
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign History Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            Recent Broadcast Campaigns History
          </h3>
          <span className="text-xs text-gray-400">
            Total {campaigns.length} campaigns
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">Campaign & Title</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4">Deep Link</th>
                <th className="py-3 px-4 text-right">Delivered</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Sent Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingCampaigns ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-600" />
                    Loading broadcast history...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No push campaigns dispatched yet. Use the composer above to launch your first marketing broadcast!
                  </td>
                </tr>
              ) : (
                campaigns.map((camp: any) => (
                  <tr key={camp.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {camp.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={camp.imageUrl}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                            <Bell className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">{camp.title}</p>
                          <p className="text-[11px] text-gray-500 line-clamp-1">{camp.body}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {camp.targetAudience}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-xs font-mono text-gray-600">
                      {camp.deepLink || '/'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-xs text-gray-900">
                      {camp.successCount} / {camp.sentCount}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {camp.status === 'SENT' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Sent
                        </span>
                      ) : camp.status === 'PROCESSING' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded-full">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Sending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-red-700 bg-red-50 rounded-full">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right text-xs text-gray-400">
                      {new Date(camp.sentAt || camp.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
