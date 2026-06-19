"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getNavigationItems } from "@/components/navigation"
import { BrandLogo } from "@/components/brand-logo"

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
    <div className="hidden h-full flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:w-[17rem] md:border-b-0 md:border-r">
      <div className="flex items-center justify-center border-b border-sidebar-border px-5 py-5">
        <Link
          href={homeHref}
          className="group inline-flex items-center justify-center transition-transform duration-200 hover:-translate-y-0.5"
          aria-label="Go to dashboard"
        >
          <BrandLogo variant="full" size="md" priority className="transition-transform duration-200 group-hover:scale-105" />
        </Link>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-5">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-cyan-300 text-slate-950 shadow-[0_10px_24px_rgba(34,211,238,0.22)]"
                  : "text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-white",
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
