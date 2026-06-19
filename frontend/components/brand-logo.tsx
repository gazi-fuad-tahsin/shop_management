"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type BrandLogoProps = {
  variant?: "mark" | "full"
  size?: "sm" | "md" | "lg"
  className?: string
  imageClassName?: string
  priority?: boolean
  alt?: string
}

const sizeClasses = {
  mark: {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  },
  full: {
    sm: "h-14 w-36",
    md: "h-20 w-52",
    lg: "h-24 w-64",
  },
}

const imageSizes = {
  mark: {
    sm: "40px",
    md: "48px",
    lg: "64px",
  },
  full: {
    sm: "144px",
    md: "208px",
    lg: "256px",
  },
}

export function BrandLogo({
  variant = "mark",
  size = "md",
  className,
  imageClassName,
  priority = false,
  alt = "Vendastro",
}: BrandLogoProps) {
  const src = variant === "full" ? "/logo%20(2).png" : "/navbar.png"

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cyan-950/10 bg-[#f8fbff] p-2 shadow-sm",
        sizeClasses[variant][size],
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={imageSizes[variant][size]}
        className={cn("object-contain p-1", imageClassName)}
        priority={priority}
      />
    </div>
  )
}
