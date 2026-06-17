"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiCall } from "@/lib/api"

type Package = {
  _id: string
  name: string
  slug: string
  price: number
  currency?: string
  stripePriceId?: string
  billingCycle: string
  isActive: boolean
}

export default function SuperAdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [form, setForm] = useState({ name: "", slug: "", price: "", currency: "usd", stripePriceId: "", billingCycle: "monthly" })

  const loadPackages = async () => {
    const response = await apiCall("/api/super-admin/packages")
    if (response.ok) setPackages(await response.json())
  }

  useEffect(() => {
    loadPackages()
  }, [])

  const submitPackage = async (event: React.FormEvent) => {
    event.preventDefault()
    const response = await apiCall("/api/super-admin/packages", {
      method: "POST",
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    })
    if (response.ok) {
      setForm({ name: "", slug: "", price: "", currency: "usd", stripePriceId: "", billingCycle: "monthly" })
      loadPackages()
    }
  }

  const togglePackage = async (item: Package) => {
    const response = await apiCall(`/api/super-admin/packages/${item._id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...item, isActive: !item.isActive }),
    })
    if (response.ok) loadPackages()
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Packages</h1>
        <p className="mt-1 text-muted-foreground">Subscription package setup</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Package</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitPackage} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toLowerCase() })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripePriceId">Stripe Price ID</Label>
                <Input id="stripePriceId" value={form.stripePriceId} onChange={(event) => setForm({ ...form, stripePriceId: event.target.value })} placeholder="Optional price_..." />
              </div>
              <div className="space-y-2">
                <Label>Billing cycle</Label>
                <Select value={form.billingCycle} onValueChange={(value) => setForm({ ...form, billingCycle: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one_time">One time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Save package</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Packages</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stripe Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.slug}</TableCell>
                    <TableCell>
                      {item.currency || "usd"} {item.price}/{item.billingCycle}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.stripePriceId || "Inline price"}</TableCell>
                    <TableCell>{item.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => togglePackage(item)}>
                        {item.isActive ? "Disable" : "Enable"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
