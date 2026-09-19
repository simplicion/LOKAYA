import * as React from "react"
import { cn } from "@/lib/utils"

export interface LogoProps extends React.ComponentProps<"span"> {
  showWhiteBg?: boolean;
}

export function Logo({ className, showWhiteBg = true, ...props }: LogoProps) {
  return (
    <span 
      className={cn(
        "font-black tracking-tight inline-flex items-center select-none font-sans",
        showWhiteBg && "bg-white px-2.5 py-1 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        className
      )} 
      {...props}
    >
      <span className="text-[#171717]">L</span>
      <span className="inline-flex items-center justify-center mx-[0.08em]">
        <span className="w-[0.72em] h-[0.72em] rounded-full border-[0.19em] border-[#FF5400] inline-block shrink-0 align-middle" />
      </span>
      <span className="text-[#171717]">KAYA</span>
    </span>
  )
}
