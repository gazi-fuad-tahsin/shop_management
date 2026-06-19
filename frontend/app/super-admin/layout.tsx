"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageLoading } from "@/components/page-loading"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"
import { useAuth } from "@/hooks/use-auth"
import { PresenceSocket } from "@/components/presence-socket"

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/auth/login")
      return
    }
    if (user.role !== "super_admin") {
      router.replace("/dashboard")
    }
  }, [isLoading, user, router])

  if (isLoading) return <PageLoading />
  if (!user || user.role !== "super_admin") return <PageLoading />

  return (
    <div className="vendastro-page flex h-dvh overflow-hidden flex-col bg-background md:flex-row">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</main>
      </div>
      <PresenceSocket enabled={!!user} />
    </div>
  )
}
