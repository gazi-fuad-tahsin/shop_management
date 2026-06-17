"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PaymentSuccessPage() {
  const [sessionId, setSessionId] = useState("")

  useEffect(() => {
    setSessionId(new URLSearchParams(window.location.search).get("session_id") || "")
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CheckCircle className="h-10 w-10 text-emerald-600" />
          <CardTitle>Payment successful</CardTitle>
          <CardDescription>Complete setup to create your shop and branch code.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" asChild disabled={!sessionId}>
            <Link href={`/setup?session_id=${encodeURIComponent(sessionId)}`}>Continue setup</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
