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
  ChevronRight 
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

  const handleCreatePost = () => {
    onClose();
    if (!user) {
      toast.info('Please sign in to share posts');
      router.push('/login?redirect=/profile/create/post');
      return;
    }
    router.push('/profile/create/post');
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
      id: 'product',
      title: 'Add Product',
      icon: ShoppingBag,
      gradient: 'from-emerald-500 to-teal-500',
      onClick: handleAddProduct,
    },
    {
      id: 'post',
      title: 'Create Post',
      icon: Camera,
      gradient: 'from-[#FF5A36] to-[#FF8A65]',
      onClick: handleCreatePost,
    },
    {
      id: 'story',
      title: 'Add Story',
      icon: Film,
      gradient: 'from-purple-600 to-indigo-600',
      onClick: handleAddStory,
    },
  ];

  return (
    <AnimatedBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Create"
      icon={
        <div className="w-9 h-9 rounded-2xl bg-orange-100 text-[#FF5A36] flex items-center justify-center font-bold">
          <Sparkles className="w-5 h-5" />
        </div>
      }
    >
      <div className="p-4 sm:p-5 space-y-2.5 pb-6">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              transition={springs.snappy}
              onClick={item.onClick}
              className="w-full p-3.5 sm:p-4 rounded-2xl border border-[#E5E2DC] bg-white hover:bg-orange-50/40 hover:border-orange-200/80 flex items-center justify-between text-left transition-all group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${item.gradient} text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-[15px] sm:text-base text-[#171717] group-hover:text-[#FF5A36] transition-colors truncate">
                  {item.title}
                </span>
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
