"use client"

import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { PageLoading } from "@/components/page-loading"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"
import { useAuth } from "@/hooks/use-auth"

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <PageLoading />
  if (!user) redirect("/auth/login")
  if (user.role !== "super_admin") redirect("/dashboard")

  return (
    <div className="flex h-dvh overflow-hidden flex-col bg-background md:flex-row">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</main>
      </div>
    </div>
  )
}
