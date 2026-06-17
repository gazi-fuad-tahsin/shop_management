"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiCall } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

export default function ShopSettingsPage() {
  const { user, refreshUser } = useAuth()
  const [shopId, setShopId] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    branchCode: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    businessType: "",
    logo: "",
    currency: "USD",
    taxRate: 0,
  })

  useEffect(() => {
    const loadShop = async () => {
      const response = await apiCall("/api/shops/my-shop")
      if (!response.ok) return
      const data = await response.json()
      setShopId(data._id)
      setForm({
        branchCode: data.branchCode || "",
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        businessType: data.businessType || "",
        logo: data.logo || "",
        currency: data.currency || "USD",
        taxRate: Number(data.taxRate || 0),
      })
    }
    loadShop()
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setMessage("")
    const response = await apiCall(`/api/shops/${shopId}`, {
      method: "PATCH",
      body: JSON.stringify(form),
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      setError(data?.message || "Failed to update shop")
      return
    }
    setMessage("Shop settings saved")
    await refreshUser()
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Shop Settings</h1>
        <p className="mt-1 text-muted-foreground">Configure tenant profile and business details</p>
      </div>
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>These details are used across the shop dashboard and reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            {error && (
              <Alert variant="destructive" className="md:col-span-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 md:col-span-2">{message}</div>}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="branchCode">Branch code</Label>
              <Input id="branchCode" value={form.branchCode} readOnly className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Shop name</Label>
              <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business category</Label>
              <Input id="businessType" value={form.businessType} onChange={(event) => setForm({ ...form, businessType: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" value={form.logo} onChange={(event) => setForm({ ...form, logo: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax rate</Label>
              <Input id="taxRate" type="number" step="0.01" value={form.taxRate} onChange={(event) => setForm({ ...form, taxRate: Number(event.target.value) })} />
            </div>
            <Button type="submit" className="md:col-span-2">Save settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
