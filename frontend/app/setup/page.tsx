"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Check, CreditCard, Store } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type VerifiedPayment = {
  sessionId: string
  paid: boolean
  status: string
  package?: { _id: string; name: string; price: number; billingCycle: string }
  customerEmail?: string
}

type CreatedShop = {
  _id: string
  name: string
  branchCode: string
}

export default function SetupPage() {
  const router = useRouter()
  const [payment, setPayment] = useState<VerifiedPayment | null>(null)
  const [createdShop, setCreatedShop] = useState<CreatedShop | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    businessType: "",
    logo: "",
    password: "",
  })

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = new URLSearchParams(window.location.search).get("session_id")
      if (!sessionId) {
        setError("A successful Stripe payment session is required before setup.")
        setIsVerifying(false)
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/session/${sessionId}`)
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || "Unable to verify payment")
        if (!data.paid) throw new Error("Payment is not verified yet. Please wait for Stripe confirmation.")
        setPayment(data)
        setFormData((current) => ({ ...current, email: data.customerEmail || current.email }))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to verify payment")
      } finally {
        setIsVerifying(false)
      }
    }
    verifyPayment()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!payment?.sessionId) return
    setError("")
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          sessionId: payment.sessionId,
          packageId: payment.package?._id,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Setup failed")
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      setCreatedShop(data.shop)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed")
    } finally {
      setIsLoading(false)
    }
  }

  if (createdShop) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-8">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Workspace created</CardTitle>
            <CardDescription>Save this branch code. Tenant users need it when logging in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-md border bg-emerald-50 p-5">
              <p className="text-sm text-emerald-800">Branch code</p>
              <p className="mt-2 text-3xl font-semibold tracking-wide text-emerald-950">{createdShop.branchCode}</p>
            </div>
            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Store className="h-4 w-4" />
            Vendastra
          </Link>
          <div>
            <h1 className="text-3xl font-semibold">Create your paid shop workspace</h1>
            <p className="mt-3 text-muted-foreground">Payment is verified before tenant setup and branch-code generation.</p>
          </div>
          <div className="space-y-3">
            {["Stripe payment verified", "Branch code generated", "Owner admin account created"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border bg-white p-3">
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
          {payment?.package && (
            <div className="rounded-md border bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4" />
                Paid plan
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {payment.package.name} - ${payment.package.price}/{payment.package.billingCycle}
              </p>
            </div>
          )}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Shop setup</CardTitle>
            <CardDescription>These details become the first tenant and shop admin.</CardDescription>
          </CardHeader>
          <CardContent>
            {isVerifying ? (
              <div className="py-8 text-sm text-muted-foreground">Verifying Stripe payment...</div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                {error && (
                  <Alert variant="destructive" className="md:col-span-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop name</Label>
                  <Input id="shopName" value={formData.shopName} onChange={(e) => setFormData({ ...formData, shopName: e.target.value })} required disabled={!payment?.paid} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business category</Label>
                  <Input id="businessType" value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} placeholder="Retail, accessories, grocery" disabled={!payment?.paid} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner name</Label>
                  <Input id="ownerName" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} required disabled={!payment?.paid} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Owner email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={!payment?.paid} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={!payment?.paid} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Admin password</Label>
                  <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} minLength={6} required disabled={!payment?.paid} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} disabled={!payment?.paid} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input id="logo" value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} placeholder="https://..." disabled={!payment?.paid} />
                </div>
                <Button type="submit" className="md:col-span-2" disabled={isLoading || !payment?.paid}>
                  {isLoading ? "Creating workspace..." : "Create workspace"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
