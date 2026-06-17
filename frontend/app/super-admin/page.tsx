"use client"

import { useEffect, useState } from "react"
import { BarChart3, Building2, Package, ReceiptText, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiCall } from "@/lib/api"

type GlobalStats = {
  shops: number
  users: number
  products: number
  customers: number
  inventoryItems: number
  totalRevenue: number
  transactions: number
  shopsByStatus: Array<{ _id: string; count: number }>
}

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      const response = await apiCall("/api/super-admin/dashboard")
      if (response.ok) setStats(await response.json())
    }
    loadStats()
  }, [])

  const cards = [
    { title: "Shops", value: stats?.shops || 0, icon: Building2 },
    { title: "Users", value: stats?.users || 0, icon: Users },
    { title: "Products", value: stats?.products || 0, icon: Package },
    { title: "Transactions", value: stats?.transactions || 0, icon: ReceiptText },
    { title: "Revenue", value: `$${Number(stats?.totalRevenue || 0).toFixed(2)}`, icon: BarChart3 },
  ]

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Super Admin</h1>
        <p className="mt-1 text-muted-foreground">Global SaaS control center</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Shop Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {(stats?.shopsByStatus || []).map((item) => (
            <div key={item._id || "unknown"} className="rounded-md border bg-slate-50 p-4">
              <p className="text-sm capitalize text-muted-foreground">{item._id || "unknown"}</p>
              <p className="mt-2 text-2xl font-semibold">{item.count}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
