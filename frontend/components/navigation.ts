import { BarChart3, Building2, CreditCard, FolderTree, LayoutDashboard, MessageSquare, Package, ReceiptText, Settings, ShoppingCart, Store, Users, Zap } from "lucide-react"

export type AppRole = "super_admin" | "admin" | "manager" | "staff"

export type NavigationItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

export function getNavigationItems(role: AppRole): NavigationItem[] {
  if (role === "super_admin") {
    return [
      { href: "/super-admin", label: "Global Dashboard", icon: LayoutDashboard },
      { href: "/super-admin/shops", label: "Shops", icon: Building2 },
      { href: "/super-admin/users", label: "Users", icon: Users },
      { href: "/super-admin/packages", label: "Packages", icon: CreditCard },
      { href: "/chat", label: "Chat", icon: MessageSquare },
      { href: "/feedback", label: "Feedback", icon: ReceiptText },
    ]
  }

  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Products", icon: Package },
    { href: "/inventory", label: "Inventory", icon: ShoppingCart },
    { href: "/sales", label: "Sales", icon: ShoppingCart },
    { href: "/pos", label: "POS", icon: Zap },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    ...(role === "admin" || role === "manager"
      ? [{ href: "/costs", label: "Costs", icon: ReceiptText }]
      : []),
    ...(role === "admin"
      ? [
          { href: "/branches", label: "Branches", icon: Building2 },
          { href: "/categories", label: "Categories", icon: FolderTree },
          { href: "/admin", label: "Shop Admin", icon: Store },
          { href: "/settings", label: "Shop Settings", icon: Settings },
        ]
      : []),
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/feedback", label: "Feedback", icon: ReceiptText },
  ]
}
