import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SellerHeaderProps {
  title?: React.ReactNode;
  rightAction?: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  hideSearchIcon?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export function SellerHeader({ title, rightAction, searchQuery, onSearchChange, hideSearchIcon, showBack, onBack }: SellerHeaderProps) {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isSearching && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearching]);

  if (isSearching) {
    return (
      <div className="flex items-center p-4 bg-white sticky top-0 z-20 h-[72px] gap-3">
        <button 
          onClick={() => {
            setIsSearching(false);
            if (onSearchChange) onSearchChange('');
          }} 
          className="text-[#171717] p-1 -ml-1 transition-colors hover:bg-gray-100 rounded-full flex-shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 relative">
          <input 
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full bg-[#F9F9F9] rounded-full py-2.5 pl-4 pr-10 outline-none text-[#171717] text-sm focus:ring-1 focus:ring-[#E5E2DC]"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#171717] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white sticky top-0 z-20 h-[72px]">
      <div className="flex items-center gap-4">
        {showBack && (
          <button 
            onClick={onBack || (() => router.back())}
            className="text-[#171717] p-1 -ml-1 transition-colors hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        {title && (
          typeof title === 'string' 
            ? <h1 className="text-xl font-bold text-[#171717]">{title}</h1> 
            : title
        )}
      </div>
      <div className="flex items-center gap-3">
        {!hideSearchIcon && onSearchChange && (
          <button 
            onClick={() => setIsSearching(true)} 
            className="text-[#171717] p-2 transition-colors hover:bg-gray-100 rounded-full"
          >
            <Search className="w-6 h-6" />
          </button>
        )}
        {rightAction && (
          <div className="p-2 -mr-2 text-[#171717]">
            {rightAction}
          </div>
        )}
      </div>
    </div>
  );
}
