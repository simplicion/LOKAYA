'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="h-screen w-full bg-white lg:bg-gray-50 flex overflow-hidden">
      {/* Left Marketing Side (Hidden on Mobile, visible on lg screens) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center bg-indigo-600 p-12 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl mix-blend-overlay"></div>
          <div className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full bg-white blur-3xl mix-blend-overlay"></div>
        </div>
        
        <div className="z-10 text-white max-w-lg text-center flex flex-col items-center">
          {/* Logo or Brand mark */}
          <div className="flex items-center space-x-3 mb-10">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-lg">
                S
             </div>
             <span className="text-3xl font-extrabold tracking-tight">Snapick</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Shop Local, <br/> Effortlessly.
          </h2>
          <p className="text-lg md:text-xl text-indigo-100 mb-12 leading-relaxed">
            Discover the best local stores, order with a tap, and pick up in minutes. Your neighborhood, in your pocket.
          </p>

          <div className="relative w-72 h-72 lg:w-96 lg:h-96">
             <Image 
               src="/images/onboarding_store.png" 
               alt="Store Illustration" 
               fill 
               className="object-contain"
               priority
             />
          </div>
        </div>
      </div>

      {/* Right Form Side (Full width on mobile, simulated phone on desktop) */}
      <div className="flex-1 flex items-center justify-center p-0 lg:p-8 bg-white lg:bg-transparent">
        {/* The Phone Mockup Container */}
        <div className="w-full h-full lg:h-[90vh] lg:max-h-[852px] lg:aspect-[393/852] lg:w-auto lg:shrink-0 lg:bg-white lg:rounded-[3rem] lg:border-[12px] lg:border-zinc-900 lg:shadow-2xl overflow-hidden relative flex flex-col mx-auto">
           
           {/* Phone Notch/Dynamic Island (Desktop only) */}
           <div className="hidden lg:block absolute top-0 inset-x-0 h-7 flex justify-center z-50">
             <div className="w-32 h-6 bg-zinc-900 rounded-b-3xl"></div>
           </div>

           {/* Content Area */}
           <div className="flex-1 flex flex-col h-full w-full bg-white overflow-y-auto no-scrollbar relative pt-12 lg:pt-0">
             
             {/* Mobile/In-App Navbar */}
             <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-indigo-600 bg-white sticky top-0 z-40">
               <div className="flex items-center text-xl font-extrabold tracking-tight">
                 <span className="text-indigo-600">Sna</span>
                 <span className="text-zinc-900 ml-1">pick</span>
               </div>
               <div className="flex items-center space-x-4">
                 <Link href="/login" className="text-sm font-semibold text-zinc-900 hover:text-indigo-600 transition-colors">
                   Login
                 </Link>
                 <Link href="/register" className="text-sm font-semibold bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors">
                   Sign Up
                 </Link>
               </div>
             </div>

             <div className="flex-1 flex flex-col w-full h-full relative">
               {children}
             </div>
           </div>
           
           {/* Home Indicator (Desktop only) */}
           <div className="hidden lg:block absolute bottom-2 inset-x-0 h-1.5 flex justify-center z-50 pointer-events-none">
             <div className="w-32 h-1.5 bg-gray-300 rounded-full mx-auto"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
