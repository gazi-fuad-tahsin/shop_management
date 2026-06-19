'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { ShopDialog } from '@/components/shop-dialog'
import { useAuth } from '@/hooks/use-auth'
import { PageLoading } from '@/components/page-loading'
import { PresenceSocket } from '@/components/presence-socket'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, refreshUser } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showShopDialog, setShowShopDialog] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading) return

    if (user?.role === 'admin' && !user.shop) {
      setShowShopDialog(true)
    } else {
      setShowShopDialog(false)
    }
  }, [mounted, isLoading, user])

  useEffect(() => {
    if (!user) {
      setMobileMenuOpen(false)
    }
  }, [user])

  useEffect(() => {
    if (!mounted || isLoading) return

    if (!user) {
      router.replace('/auth/login')
      return
    }

    if (user.role === 'super_admin' && pathname !== '/chat' && pathname !== '/feedback') {
      router.replace('/super-admin')
      return
    }

    if (user.role === 'manager' && user.branchSetupStatus === 'pending' && pathname !== '/branch-setup') {
      router.replace('/branch-setup')
    }
  }, [mounted, isLoading, user, pathname, router])

  if (!mounted || isLoading) {
    return <PageLoading />
  }

  if (
    !user ||
    (user.role === 'super_admin' && pathname !== '/chat' && pathname !== '/feedback') ||
    (user.role === 'manager' && user.branchSetupStatus === 'pending' && pathname !== '/branch-setup')
  ) {
    return <PageLoading />
  }

  const handleShopCreated = async (createdShop?: any) => {
    setShowShopDialog(false)
    if (createdShop && user) {
      const updatedUser = { ...user, shop: createdShop }
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
    await refreshUser()
  }

  return (
    <div className="vendastro-page flex h-dvh overflow-hidden flex-col bg-background md:flex-row">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar user={user} mobileMenuOpen={mobileMenuOpen} onMobileMenuOpenChange={setMobileMenuOpen} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</main>
      </div>
      <PresenceSocket enabled={!!user} />
      <ShopDialog
        open={showShopDialog}
        onOpenChange={setShowShopDialog}
        onSuccess={handleShopCreated}
      />
    </div>
  )
}
