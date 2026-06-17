"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Building2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiCall } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

export default function BranchSetupPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    businessType: "",
    logo: "",
  })

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const response = await apiCall("/api/shops/branches/setup", {
        method: "POST",
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Branch setup failed")
      localStorage.setItem("user", JSON.stringify(data.user))
      await refreshUser()
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Branch setup failed")
    } finally {
      setIsLoading(false)
    }
  }

  if (user?.role !== "manager") {
    return <div className="p-8 text-sm text-muted-foreground">Only approved managers can setup a branch.</div>
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-foreground text-background">
            <Building2 className="h-5 w-5" />
          </div>
          <CardTitle>Setup Your Branch</CardTitle>
          <CardDescription>Your branch inventory and reports will stay separate from other branches.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            {error && (
              <Alert variant="destructive" className="md:col-span-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Branch name</Label>
              <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Branch category</Label>
              <Input id="businessType" value={form.businessType} onChange={(event) => setForm({ ...form, businessType: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" value={form.logo} onChange={(event) => setForm({ ...form, logo: event.target.value })} />
            </div>
            <Button type="submit" className="md:col-span-2" disabled={isLoading}>
              {isLoading ? "Creating branch..." : "Create Branch"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
