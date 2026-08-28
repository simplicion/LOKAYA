'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';

export function SocialHeader() {
  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-[#FAF9F6] px-4 py-3 flex items-center justify-between">
      {/* Logo Placeholder */}
      <div className="flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-sm tracking-tighter">
          UT
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 items-center">
        <div className="flex flex-col items-center cursor-pointer">
          <span className="font-bold text-[#171717] text-[15px]">For You</span>
          <div className="w-8 h-[3px] bg-[#FF5A36] rounded-full mt-1" />
        </div>
        <div className="flex flex-col items-center cursor-pointer">
          <span className="font-medium text-[#999999] text-[15px]">Following</span>
          <div className="w-8 h-[3px] bg-transparent rounded-full mt-1" />
        </div>
      </div>

      {/* Notifications */}
      <div className="flex-shrink-0 relative">
        <Link href="/notifications">
          <Bell className="w-6 h-6 text-[#171717]" />
          <div className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-[#FF5A36] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#FAF9F6]">
            3
          </div>
        </Link>
      </div>
    </div>
  );
}
