"use client"

import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/brand-logo"

type PageLoadingProps = {
  compact?: boolean
  className?: string
}

export function BrandLoadingMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <BrandLogo variant="mark" size={compact ? "lg" : "lg"} alt="Loading" priority />
      <div className={cn("overflow-hidden rounded-full bg-cyan-100", compact ? "h-1 w-40" : "h-1 w-56")}>
        <div className="h-full w-1/3 animate-pulse rounded-full bg-cyan-500" />
      </div>
    </div>
  )
}

export function PageLoading({ compact = false, className }: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden vendastro-page px-4",
        compact ? "min-h-[320px]" : "min-h-[100svh]",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-lg border border-cyan-950/10 bg-white/85 px-8 py-10 text-center shadow-[0_24px_80px_rgba(8,31,68,0.12)] backdrop-blur-xl",
          compact ? "w-full max-w-xs py-8" : "w-full max-w-sm",
        )}
      >
        <BrandLoadingMark compact={compact} />
      </div>
    </div>
  )
}
