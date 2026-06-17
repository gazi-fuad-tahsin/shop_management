'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { ShopDialog } from '@/components/shop-dialog'
import { useAuth } from '@/hooks/use-auth'
import { PageLoading } from '@/components/page-loading'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, refreshUser } = useAuth()
  const pathname = usePathname()
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

  if (!mounted || isLoading) {
    return <PageLoading />
  }

  if (!user) {
    redirect('/auth/login')
  }

  if (user.role === 'super_admin') {
    redirect('/super-admin')
  }

  if (user.role === 'manager' && user.branchSetupStatus === 'pending' && pathname !== '/branch-setup') {
    redirect('/branch-setup')
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
    <div className="flex h-dvh overflow-hidden flex-col md:flex-row bg-background">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar user={user} mobileMenuOpen={mobileMenuOpen} onMobileMenuOpenChange={setMobileMenuOpen} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</main>
      </div>
      <ShopDialog
        open={showShopDialog}
        onOpenChange={setShowShopDialog}
        onSuccess={handleShopCreated}
      />
    </div>
  )
}
