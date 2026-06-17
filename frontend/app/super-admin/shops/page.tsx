"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiCall } from "@/lib/api"

type Shop = {
  _id: string
  name: string
  branchCode?: string
  email?: string
  phone?: string
  businessType?: string
  status: string
  subscriptionStatus?: string
  paymentStatus?: string
  owner?: { name?: string; email?: string }
}

export default function SuperAdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [search, setSearch] = useState("")

  const loadShops = async () => {
    const response = await apiCall("/api/super-admin/shops")
    if (response.ok) setShops(await response.json())
  }

  useEffect(() => {
    loadShops()
  }, [])

  const filtered = useMemo(
    () => shops.filter((shop) => [shop.name, shop.email, shop.phone, shop.owner?.name].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())),
    [shops, search],
  )

  const updateShop = async (shopId: string, updates: Partial<Shop>) => {
    const response = await apiCall(`/api/super-admin/shops/${shopId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    })
    if (response.ok) loadShops()
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Shops</h1>
        <p className="mt-1 text-muted-foreground">Manage tenants, status, subscriptions, and owners</p>
      </div>
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Shops</CardTitle>
          <div className="flex w-full items-center gap-2 sm:w-80">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shops" />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Branch Code</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((shop) => (
                <TableRow key={shop._id}>
                  <TableCell>
                    <div className="font-medium">{shop.name}</div>
                    <div className="text-xs text-muted-foreground">{shop.businessType || "General"}</div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md border bg-slate-50 px-2 py-1 font-mono text-xs">{shop.branchCode || "N/A"}</span>
                  </TableCell>
                  <TableCell>
                    <div>{shop.owner?.name || "N/A"}</div>
                    <div className="text-xs text-muted-foreground">{shop.owner?.email}</div>
                  </TableCell>
                  <TableCell>
                    <div>{shop.email || "N/A"}</div>
                    <div className="text-xs text-muted-foreground">{shop.phone}</div>
                  </TableCell>
                  <TableCell>
                    <Select value={shop.subscriptionStatus || "active"} onValueChange={(value) => updateShop(shop._id, { subscriptionStatus: value })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="past_due">Past due</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={shop.paymentStatus || "pending"} onValueChange={(value) => updateShop(shop._id, { paymentStatus: value })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="capitalize">{shop.status}</TableCell>
                  <TableCell className="text-right">
                    <Select value={shop.status} onValueChange={(value) => updateShop(shop._id, { status: value })}>
                      <SelectTrigger className="ml-auto w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No shops found</div>}
        </CardContent>
      </Card>
    </div>
  )
}
