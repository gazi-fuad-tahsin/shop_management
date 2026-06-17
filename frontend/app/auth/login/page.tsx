"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [branchCode, setBranchCode] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setPending(false)
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, branchCode }),
      })

      const data = await response.json()

      if (response.status === 403) {
        setPending(true)
        setError(data.message)
        return
      }

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      router.push(data.user?.role === "super_admin" ? "/super-admin" : "/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex items-center justify-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
          <Image
            src="/logo%20(2).png"
            alt="ShopManager"
            fill
            sizes="80px"
            className="object-contain p-2"
            priority
          />
        </div>
      </div>

      <Card className="border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Tenant users need their branch code. Super Admin can leave it blank.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {pending && (
              <Alert className="border-amber-200 bg-amber-50">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">{error}</AlertDescription>
              </Alert>
            )}

            {error && !pending && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier">Email or phone</Label>
              <Input
                id="identifier"
                placeholder="admin@example.com or +880..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branchCode">Branch code</Label>
              <Input
                id="branchCode"
                placeholder="SHOP-ABC123"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
              />
              <p className="text-xs text-muted-foreground">Required for shop admins, managers, and staff.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
