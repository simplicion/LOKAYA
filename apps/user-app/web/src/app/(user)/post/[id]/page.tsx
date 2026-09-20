'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Compass, AlertCircle, Sparkles, MessageCircle } from 'lucide-react';
import { SocialPost } from '@/components/feed/SocialPost';
import { useGetPostByIdQuery, useGetPostsQuery } from '@/lib/api';
import { AdaptiveSkeleton } from '@/components/ui/AdaptiveSkeleton';
import { ShareBottomSheet } from '@/components/ui/ShareBottomSheet';
import { cn, formatTimeAgo } from '@/lib/utils';
import Link from 'next/link';

export default function SinglePostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const postId = resolvedParams.id;
  const router = useRouter();
  const [isShareOpen, setIsShareOpen] = React.useState(false);

  const { data: post, isLoading, error } = useGetPostByIdQuery(postId, {
    skip: !postId,
  });

  const { data: morePosts = [] } = useGetPostsQuery();
  const relatedPosts = morePosts.filter((p: any) => p.id !== postId).slice(0, 6);

  const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${postId}` : '';

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#FAF9F6] pb-24">
      {/* Top Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-4 py-3.5 border-b border-[#E5E2DC] flex items-center justify-between shadow-xs">
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 2) {
              router.back();
            } else {
              router.push('/home');
            }
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#171717] hover:bg-gray-100 active:scale-95 transition-all -ml-1 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.2} />
        </button>

        <h1 className="text-base font-bold text-[#171717] tracking-tight">Post</h1>

        <button
          onClick={() => setIsShareOpen(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#171717] hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-lg mx-auto w-full">
        {isLoading ? (
          <div className="p-3">
            <AdaptiveSkeleton variant="feed-post" count={1} />
          </div>
        ) : error || !post ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF5A36] flex items-center justify-center mb-4 shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1.5">Post Not Available</h2>
            <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
              This post may have been removed, made private, or the shared link has expired.
            </p>
            <button
              onClick={() => router.push('/home')}
              className="px-6 py-2.5 bg-[#FF5A36] text-white rounded-full text-sm font-bold shadow-md hover:bg-[#e04d2d] active:scale-95 transition-all cursor-pointer"
            >
              Explore Feed
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* The Post Card */}
            <SocialPost
              id={post.id}
              authorId={post.authorId}
              storeId={post.storeId}
              storeName={post.storeName}
              storeAvatar={post.storeAvatar}
              isVerified={post.isVerified}
              createdAt={post.createdAt}
              timeAgo={formatTimeAgo(post.createdAt)}
              media={post.media || []}
              likes={post.likes || '0'}
              likesCount={post.likesCount || 0}
              isLikedByMe={post.isLikedByMe}
              isSavedByMe={post.isSavedByMe}
              comments={post.comments || '0'}
              shares={post.shares || '0'}
              caption={post.caption || ''}
              hashtags={post.hashtags || []}
              product={post.product}
              isReel={Boolean(post.isReel || post.contentType === 'REEL')}
              contentType={post.contentType}
            />

            {/* Related Posts Section (Instagram Explore Style) */}
            {relatedPosts.length > 0 && (
              <div className="mt-6 px-4 pt-4 border-t border-[#E5E2DC]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#FF5A36]" />
                    More to explore
                  </h3>
                  <Link
                    href="/home"
                    className="text-xs font-bold text-[#FF5A36] hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
                  {relatedPosts.map((rel: any) => {
                    const firstMedia = rel.media?.[0]?.url || rel.media?.[0]?.posterUrl;
                    return (
                      <Link
                        key={rel.id}
                        href={`/post/${rel.id}`}
                        className="relative aspect-square bg-gray-100 overflow-hidden group block"
                      >
                        {firstMedia ? (
                          <img
                            src={firstMedia}
                            alt={rel.caption || 'Post'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-500">
                            Post
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <MessageCircle className="w-3.5 h-3.5 fill-white" />
                          <span>{rel.comments || 0}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Bottom Sheet */}
      <ShareBottomSheet
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={postUrl}
        title={post?.caption ? `${post.storeName}: "${post.caption.slice(0, 60)}..."` : 'Check out this post on Lokaya'}
      />
    </div>
  );
}
