'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useGetUserPublicProfileQuery, useFollowUserMutation } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Store, 
  UserCheck, 
  UserPlus, 
  Grid, 
  Heart, 
  MessageCircle, 
  Loader2,
  Share2
} from 'lucide-react';
import { ShareBottomSheet } from '@/components/ui/ShareBottomSheet';
import { toast } from 'sonner';

export default function UserPublicProfilePage({ params }: { params?: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const routeParams = useParams();
  const routeId = routeParams?.id as string | undefined;
  const pathId = typeof window !== 'undefined' 
    ? window.location.pathname.split('/user/')[1]?.split('/')[0]?.split('?')[0] 
    : undefined;

  const userId = (routeId && routeId !== '1') 
    ? routeId 
    : (pathId && pathId !== '1') 
      ? pathId 
      : (routeId || pathId || '');
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // If viewing own profile, seamlessly redirect to /profile
  useEffect(() => {
    if (currentUser?.id && currentUser.id === userId) {
      router.replace('/profile');
    }
  }, [currentUser?.id, userId, router]);

  const { data: profile, isLoading, error } = useGetUserPublicProfileQuery(userId, {
    skip: !userId,
  });

  const [followUser] = useFollowUserMutation();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (profile) {
      setIsFollowing(Boolean(profile.isFollowing));
      setFollowersCount(profile._count?.followers || 0);
    }
  }, [profile]);

  const handleToggleFollow = async () => {
    if (!currentUser) {
      toast.error('Please sign in to follow');
      router.push('/login');
      return;
    }

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowersCount(prev => nextState ? prev + 1 : Math.max(0, prev - 1));

    try {
      await followUser(userId).unwrap();
    } catch {
      setIsFollowing(!nextState);
      setFollowersCount(prev => !nextState ? prev + 1 : Math.max(0, prev - 1));
      toast.error('Failed to update follow status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">User Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">This profile may have been removed or does not exist.</p>
        <button
          onClick={() => router.push('/home')}
          className="px-6 py-2.5 bg-[#FF5A36] text-white font-semibold rounded-full text-sm hover:bg-[#e04f2f] transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  const primaryStore = profile.stores?.[0]?.store;
  const initialChar = profile.name ? profile.name.trim().charAt(0).toUpperCase() : 'U';
  const locationString = [profile.city, profile.state].filter(Boolean).join(', ');
  const joinedDate = profile.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24 text-[#171717]">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <span className="font-bold text-[15px] truncate max-w-[200px]">
          {profile.name}
        </span>
        <button
          onClick={() => setIsShareOpen(true)}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          aria-label="Share Profile"
        >
          <Share2 className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 flex flex-col gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center">
          {/* Avatar / Initials */}
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#FF5A36]/20 bg-stone-100 flex items-center justify-center shadow-sm">
              {profile.avatarUrl && !avatarError ? (
                <img
                  src={getMediaUrl(profile.avatarUrl)}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-3xl font-black text-[#FF5A36]">
                  {initialChar}
                </span>
              )}
            </div>
          </div>

          {/* Name */}
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            {profile.name}
          </h1>

          {/* Badges / Meta */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[12px] text-gray-500 font-medium">
            {locationString && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {locationString}
              </span>
            )}
            {joinedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Joined {joinedDate}
              </span>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 w-full border-t border-b border-gray-100 py-3 mt-5">
            <div className="flex flex-col items-center">
              <span className="text-[17px] font-bold text-gray-900 tabular-nums">
                {(profile._count?.posts || 0) + (profile._count?.reels || 0)}
              </span>
              <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Posts</span>
            </div>
            <div className="flex flex-col items-center border-x border-gray-100">
              <span className="text-[17px] font-bold text-gray-900 tabular-nums">
                {followersCount}
              </span>
              <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[17px] font-bold text-gray-900 tabular-nums">
                {profile._count?.following || 0}
              </span>
              <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Following</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex gap-3 mt-5">
            <button
              onClick={handleToggleFollow}
              className={`flex-1 h-11 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                isFollowing
                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  : 'bg-[#FF5A36] text-white hover:bg-[#e04f2f] shadow-sm'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Follow
                </>
              )}
            </button>

            {primaryStore && (
              <button
                onClick={() => router.push(`/store/${primaryStore.id}`)}
                className="flex-1 h-11 rounded-full border border-gray-200 font-semibold text-sm text-gray-800 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Store className="w-4 h-4 text-[#FF5A36]" />
                Visit Store
              </button>
            )}
          </div>
        </div>

        {/* Posts Tab Header */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <Grid className="w-4 h-4 text-[#FF5A36]" />
          <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Posts</span>
        </div>

        {/* Posts Grid */}
        {profile.posts && profile.posts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
            {profile.posts.map((post: any) => {
              const mediaUrl = post.media?.[0]?.url;
              return (
                <div
                  key={post.id}
                  onClick={() => router.push('/home')}
                  className="aspect-square bg-gray-100 relative group cursor-pointer overflow-hidden rounded-lg"
                >
                  {mediaUrl ? (
                    <img
                      src={getMediaUrl(mediaUrl)}
                      alt="Post"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 p-2 text-center text-xs text-gray-400">
                      Post
                    </div>
                  )}
                  {/* Hover stats overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      {post._count?.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      {post._count?.comments || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-gray-400 text-sm font-medium">No posts shared yet</p>
          </div>
        )}
      </div>

      <ShareBottomSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={currentUrl}
      />
    </div>
  );
}
