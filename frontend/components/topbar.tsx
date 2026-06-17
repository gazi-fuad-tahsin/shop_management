"use client"

import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, Store, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { getNavigationItems } from "@/components/navigation"
import { BrandLoadingMark } from "@/components/page-loading"

interface TopbarProps {
  user: {
    name?: string
    email?: string
    role?: string
    shop?: {
      _id?: string
      name?: string
    } | string | null
  }
  mobileMenuOpen?: boolean
  onMobileMenuOpenChange?: (open: boolean) => void
}

export function Topbar({ user, mobileMenuOpen, onMobileMenuOpenChange }: TopbarProps) {
  const { logout } = useAuth()
  const pathname = usePathname()
  const navigationItems = getNavigationItems(user.role as "super_admin" | "admin" | "manager" | "staff")
  const shopName = typeof user.shop === "object" && user.shop?.name ? user.shop.name : null

  if (!user?.name) {
    return (
      <div className="flex items-center justify-center h-16 px-4 md:px-6 bg-card border-b border-border">
        <BrandLoadingMark compact />
      </div>
    )
  }

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={onMobileMenuOpenChange}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-border bg-background shadow-sm transition-transform duration-200 active:scale-95 hover:-translate-y-0.5"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b p-6">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-muted/60 ring-1 ring-border">
                    <Image src="/navbar.png" alt="ShopManager" fill sizes="44px" className="object-contain p-1.5" />
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="text-left">ShopManager</SheetTitle>
                    <SheetDescription className="text-left">Navigate between dashboard sections.</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="p-4">
                <nav className="space-y-2">
                  {navigationItems.map((item, index) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => onMobileMenuOpenChange?.(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:translate-x-1",
                          "animate-in fade-in slide-in-from-left-2",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-transparent text-foreground hover:bg-accent",
                        )}
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-muted-foreground">Welcome back</h2>
          {shopName && user.role !== "super_admin" && (
            <div className="flex items-center gap-1 mt-1 text-xs text-foreground truncate">
              <Store className="w-3 h-3" />
              <span className="truncate">{shopName}</span>
            </div>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.role}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div>{user.name}</div>
            <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
            {shopName && user.role !== "super_admin" && (
              <div className="text-xs font-normal text-muted-foreground flex items-center gap-1 mt-1">
                <Store className="w-3 h-3" /> {shopName}
              </div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
