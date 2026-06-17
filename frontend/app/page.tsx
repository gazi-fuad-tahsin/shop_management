"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Check,
  CreditCard,
  HelpCircle,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Package = {
  _id: string
  name: string
  description?: string
  price: number
  currency?: string
  billingCycle: string
  features?: string[]
}

const features = [
  { title: "Branch-code access", icon: Store, text: "Every shop gets a unique branch code so users enter the correct tenant before accessing data." },
  { title: "Tenant-ready inventory", icon: PackageSearch, text: "Products, categories, stock, customers, sales, and reports stay connected to each shop." },
  { title: "Daily revenue control", icon: BarChart3, text: "Track cash, bank revenue, product costs, expenses, and net balance from one dashboard." },
  { title: "Super Admin governance", icon: ShieldCheck, text: "Manage shops, branch codes, subscriptions, users, and access from a separate global panel." },
]

const fallbackPackages: Package[] = [
  { _id: "starter", name: "Starter", price: 29, currency: "usd", billingCycle: "monthly", description: "Single shop, inventory, POS, and reports" },
  { _id: "growth", name: "Growth", price: 79, currency: "usd", billingCycle: "monthly", description: "More users, higher limits, and daily finance controls" },
  { _id: "scale", name: "Scale", price: 149, currency: "usd", billingCycle: "monthly", description: "Advanced controls for larger teams and operations" },
]

export default function LandingPage() {
  const [packages, setPackages] = useState<Package[]>(fallbackPackages)
  const [isBuying, setIsBuying] = useState<string | null>(null)

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/packages`, { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data) && data.length) setPackages(data)
        }
      } catch {
        setPackages(fallbackPackages)
      }
    }
    loadPackages()
  }, [])

  const buyPackage = async (item: Package) => {
    setIsBuying(item._id)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: item._id }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "Unable to start checkout")
      window.location.href = data.url
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to start checkout")
    } finally {
      setIsBuying(null)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b bg-[linear-gradient(135deg,#f8fafc_0%,#ecfeff_45%,#fefce8_100%)]">
        <div className="mx-auto grid min-h-[88vh] max-w-7xl items-center gap-10 px-5 py-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <div className="space-y-8">
            <nav className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image src="/navbar.png" alt="Vendastra" width={44} height={44} className="h-11 w-11 rounded-md object-contain" />
                <span className="text-lg font-semibold">Vendastra</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
                  Buy Now
                </Button>
              </div>
            </nav>

            <div className="max-w-2xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm text-muted-foreground shadow-sm">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                Paid SaaS access with branch-code security
              </div>
              <h1 className="text-4xl font-semibold leading-tight tracking-normal md:text-6xl">
                Inventory SaaS built for multi-shop control
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                Sell a subscription, verify payment with Stripe, create a tenant, generate a branch code, and run inventory, POS, revenue, and reports per shop.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/login">Open dashboard</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl">
            <div className="rounded-lg border bg-white p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Today revenue</p>
                  <p className="text-2xl font-semibold">$18,420</p>
                </div>
                <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">BRAN-84A9F2</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {["Products", "Transactions", "Low stock"].map((item, index) => (
                  <div key={item} className="rounded-md border bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white">
                    <p className="text-sm text-muted-foreground">{item}</p>
                    <p className="mt-2 text-xl font-semibold">{[1248, 342, 19][index]}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 overflow-hidden rounded-md border">
                {["Cable Type-C 2m", "Fast Charger 30W", "Bluetooth Earbuds"].map((item, index) => (
                  <div key={item} className="grid grid-cols-[1fr_auto_auto] gap-3 border-b px-4 py-3 text-sm last:border-b-0">
                    <span>{item}</span>
                    <span className="text-muted-foreground">Stock {["84", "32", "17"][index]}</span>
                    <span className="font-medium">${["12.00", "24.00", "39.00"][index]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="transition hover:-translate-y-1 hover:shadow-lg">
                <CardHeader>
                  <Icon className="h-6 w-6 text-cyan-700" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">{feature.text}</CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section id="pricing" className="border-y bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold">Choose a plan and pay securely</h2>
            <p className="mt-3 text-muted-foreground">Stripe confirms payment before tenant setup and branch-code generation.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {packages.map((item) => (
              <Card key={item._id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{item.name}</CardTitle>
                  <div className="text-3xl font-semibold">
                    ${item.price}
                    <span className="text-sm font-normal text-muted-foreground">/{item.billingCycle}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-5 text-sm text-muted-foreground">
                  <div className="space-y-3">
                    <p>{item.description || "Inventory SaaS package"}</p>
                    {(item.features?.length ? item.features : ["Stripe checkout", "Branch code", "Tenant dashboard"]).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-foreground">
                        <Check className="h-4 w-4 text-emerald-600" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => buyPackage(item)} disabled={isBuying === item._id}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {isBuying === item._id ? "Opening..." : "Buy Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-3 lg:px-8">
        {[
          ["1", "Pay with Stripe", "Checkout creates a verified session and webhook marks it as paid."],
          ["2", "Complete setup", "Enter shop and owner details after successful payment."],
          ["3", "Use branch code", "Share the generated branch code with approved managers and staff."],
        ].map(([step, title, text]) => (
          <div key={step} className="rounded-md border p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-foreground text-background">{step}</div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <section className="border-t bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-16 md:grid-cols-3 lg:px-8">
          {["Fast setup", "Secure payments", "Strict tenant isolation"].map((item) => (
            <div key={item} className="rounded-md border bg-slate-50 p-5 text-sm text-muted-foreground">
              <ShieldCheck className="mb-3 h-5 w-5 text-emerald-600" />
              <div className="font-medium text-foreground">{item}</div>
              <p className="mt-2">Designed for SaaS operators who need controlled shop access and clean daily operations.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <h2 className="text-3xl font-semibold">FAQ</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["Can users log in without a branch code?", "No. Tenant users must provide the correct branch code. Super Admin login stays separate."],
            ["When is the shop created?", "After Stripe confirms payment and the owner completes setup."],
            ["Can a shop be suspended?", "Yes. Super Admin can suspend or cancel shops and block access."],
            ["Is data separated by shop?", "Yes. Business APIs are scoped to the authenticated user's shop."],
          ].map(([question, answer]) => (
            <div key={question} className="rounded-md border p-5">
              <div className="flex items-center gap-2 font-medium">
                <HelpCircle className="h-4 w-4" />
                {question}
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-foreground text-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-12 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <h2 className="text-2xl font-semibold">Start your shop workspace</h2>
            <p className="mt-2 text-sm text-background/70">Buy a plan, verify payment, and generate your branch code.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
              Buy Now
            </Button>
            <Button variant="outline" className="border-background/30 bg-transparent text-background hover:bg-background hover:text-foreground" asChild>
              <a href="mailto:support@vendastra.app">Contact</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
