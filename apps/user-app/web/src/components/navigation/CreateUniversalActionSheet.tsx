'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useGetMyStoreQuery } from '@/lib/api';
import { AnimatedBottomSheet } from '@/components/ui/AnimatedBottomSheet';
import { motion } from 'framer-motion';
import { springs } from '@/lib/animations';
import { 
  Camera, 
  ShoppingBag, 
  Film, 
  Sparkles, 
  ChevronRight, 
  PlusCircle, 
  Store,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

interface CreateUniversalActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStoryModal?: () => void;
}

export function CreateUniversalActionSheet({
  isOpen,
  onClose,
  onOpenStoryModal,
}: CreateUniversalActionSheetProps) {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: myStore } = useGetMyStoreQuery(undefined, { skip: !user });

  const handleCreatePost = () => {
    onClose();
    if (!user) {
      toast.info('Please sign in to share posts');
      router.push('/login?redirect=/profile/create/post');
      return;
    }
    router.push('/profile/create/post');
  };

  const handleAddProduct = () => {
    onClose();
    if (!user) {
      toast.info('Please sign in to list products');
      router.push('/login?redirect=/seller/products/add');
      return;
    }
    if (myStore) {
      router.push('/seller/products/add');
    } else {
      toast.info('Set up your store in 2 minutes to start adding products!');
      router.push('/seller/onboarding');
    }
  };

  const handleAddStory = () => {
    onClose();
    if (!user) {
      toast.info('Please sign in to post stories');
      router.push('/login?redirect=/home');
      return;
    }
    if (myStore) {
      if (onOpenStoryModal) {
        onOpenStoryModal();
      }
    } else {
      toast.info('Stories are available for verified merchants. Launch your store to publish stories!');
      router.push('/seller/onboarding');
    }
  };

  const actions = [
    {
      id: 'post',
      title: 'Create Post',
      description: 'Share photos, short video clips, or tag products in your feed',
      badge: 'Feed',
      badgeColor: 'bg-orange-100 text-[#FF5A36] border-orange-200',
      icon: Camera,
      gradient: 'from-[#FF5A36] to-[#FF8A65]',
      onClick: handleCreatePost,
    },
    {
      id: 'product',
      title: 'Add Product',
      description: myStore 
        ? 'List a new item with variants, pricing & photos in your catalog' 
        : 'Register your store and publish your first product to local buyers',
      badge: myStore ? 'Store Catalog' : 'Seller Hub',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: ShoppingBag,
      gradient: 'from-emerald-500 to-teal-500',
      onClick: handleAddProduct,
    },
    {
      id: 'story',
      title: 'Add Story',
      description: 'Post a 24-hour photo or 30-second video flash update for customers',
      badge: '24h Expiry',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Film,
      gradient: 'from-purple-600 to-indigo-600',
      onClick: handleAddStory,
    },
  ];

  return (
    <AnimatedBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Create & Publish"
      subtitle="Share updates, add products, or broadcast a story"
      icon={
        <div className="w-9 h-9 rounded-2xl bg-orange-100 text-[#FF5A36] flex items-center justify-center font-bold">
          <Sparkles className="w-5 h-5" />
        </div>
      }
      footer={
        <div className="p-3.5 text-center bg-gray-50/70 border-t border-gray-100">
          <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1.5 font-medium">
            <Store className="w-3.5 h-3.5 text-[#FF5A36]" />
            Connect directly with shoppers in your local neighborhood
          </p>
        </div>
      }
    >
      <div className="p-4 sm:p-5 space-y-3">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              transition={springs.snappy}
              onClick={item.onClick}
              className="w-full p-4 rounded-2xl border border-[#E5E2DC] bg-white hover:bg-orange-50/40 hover:border-orange-200/80 flex items-center justify-between text-left transition-all group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-[15px] text-[#171717] group-hover:text-[#FF5A36] transition-colors truncate">
                      {item.title}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${item.badgeColor} tracking-wider`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6B6B] mt-0.5 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-orange-100 flex items-center justify-center shrink-0 text-gray-400 group-hover:text-[#FF5A36] transition-colors ml-1">
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </AnimatedBottomSheet>
  );
}
