'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, Info, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmationModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setInternalLoading(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  const isBusy = isLoading || internalLoading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-50 text-red-600 border border-red-100',
          icon: <Trash2 className="w-7 h-7 text-red-600" />,
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 active:bg-red-800',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
          icon: <AlertTriangle className="w-7 h-7 text-amber-600" />,
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 active:bg-amber-800',
        };
      default:
        return {
          iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
          icon: <Info className="w-7 h-7 text-blue-600" />,
          confirmBtn: 'bg-[#171717] hover:bg-black text-white shadow-black/20 active:scale-95',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={!isBusy ? onClose : undefined} 
      />

      {/* Modal Card */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 z-10"
      >
        {/* Close Button */}
        {!isBusy && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Icon Badge */}
        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm", styles.iconBg)}>
          {styles.icon}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-[#171717] mb-2 px-2 leading-snug">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mb-6 px-3 leading-relaxed">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-2.5">
          <button
            onClick={handleConfirm}
            disabled={isBusy}
            className={cn(
              "w-full py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2",
              styles.confirmBtn,
              isBusy && "opacity-75 cursor-not-allowed"
            )}
          >
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>

          {!isBusy && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-2xl font-semibold text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
