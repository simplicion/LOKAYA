"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      richColors={false}
      icons={{
        success: (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 shrink-0" />
        ),
        info: (
          <Info className="w-5 h-5 text-blue-500 fill-blue-50 shrink-0" />
        ),
        warning: (
          <AlertTriangle className="w-5 h-5 text-amber-500 fill-amber-50 shrink-0" />
        ),
        error: (
          <AlertCircle className="w-5 h-5 text-rose-500 fill-rose-50 shrink-0" />
        ),
        loading: (
          <Loader2 className="w-5 h-5 text-[#FF5A36] animate-spin shrink-0" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast: "group toast !bg-white !text-gray-900 !border !border-gray-200/90 !shadow-[0_12px_36px_rgba(0,0,0,0.12)] !rounded-2xl !px-4 !py-3.5 !font-sans !text-sm !font-semibold !flex !items-center !gap-3",
          description: "!text-xs !font-normal !text-gray-500",
          actionButton: "!bg-[#171717] !text-white !rounded-xl !font-semibold",
          cancelButton: "!bg-gray-100 !text-gray-600 !rounded-xl",
          success: "!bg-white !text-gray-900 !border-emerald-200/90",
          error: "!bg-white !text-gray-900 !border-rose-200/90",
          warning: "!bg-white !text-gray-900 !border-amber-200/90",
          info: "!bg-white !text-gray-900 !border-blue-200/90",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

