"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getNavigationItems } from "@/components/navigation"

interface SidebarProps {
  user: {
    role: "super_admin" | "admin" | "manager" | "staff"
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const navigationItems = getNavigationItems(user.role)
  const homeHref = user.role === "super_admin" ? "/super-admin" : "/dashboard"

  return (
    <div className="hidden h-full flex-col border-b border-border bg-card md:flex md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-center border-b border-borderpy-6">
        <Link
          href={homeHref}
          className="group inline-flex items-center justify-center transition-transform duration-200 hover:-translate-y-0.5"
          aria-label="Go to dashboard"
        >
          <Image
            src="/logo%20(2).png"
            alt="ShopManager"
            width={300}
            height={100}
            className="h-12 w-30 object-contain transition-transform duration-200 group-hover:scale-105 md:h-28 md:w-28"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
