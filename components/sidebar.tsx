"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, Zap, Users } from "lucide-react"

interface SidebarProps {
  user: {
    role: "admin" | "manager" | "staff"
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const navigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Products", icon: Package },
    { href: "/inventory", label: "Inventory", icon: ShoppingCart },
    { href: "/sales", label: "Sales", icon: ShoppingCart },
    { href: "/sales/pos", label: "POS", icon: Zap },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    ...(user.role === "admin"
      ? [
          { href: "/admin/users", label: "User Approvals", icon: Users },
          { href: "/admin", label: "Admin Panel", icon: Settings },
        ]
      : []),
  ]

  return (
    <div className="w-64 bg-card border-r border-border">
      <div className="p-6">
        <h1 className="text-xl font-bold text-foreground">ShopManager</h1>
        <p className="text-xs text-muted-foreground">Management System</p>
      </div>

      <nav className="px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
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
