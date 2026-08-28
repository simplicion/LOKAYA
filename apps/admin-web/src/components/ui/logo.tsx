import * as React from "react"
import { cn } from "@/lib/utils"

export interface LogoProps extends React.ComponentProps<"span"> {}

export function Logo({ className, ...props }: LogoProps) {
  return (
    <span className={cn("font-black tracking-tight inline-flex items-baseline", className)} {...props}>
      L
      <span className="bg-gradient-to-b from-[#FF6B00] to-[#FF0000] bg-clip-text text-transparent">
        O
      </span>
      KAYA
    </span>
  )
}
