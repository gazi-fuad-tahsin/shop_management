import type React from 'react'
import type { Metadata } from 'next'
import './globals.css'
import { ServiceWorkerCleanup } from '@/components/sw-unregister'

export const metadata: Metadata = {
  title: 'Vendastra - Inventory and Sales Management',
  description:
    'Professional inventory and sales management for cables and mobile accessories',
  icons: {
    icon: '/navbar.png',
    shortcut: '/navbar.png',
    apple: '/navbar.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vendastra',
  },
  formatDetection: { telephone: false },
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <meta name="theme-color" content="#000000" />
        {process.env.NODE_ENV === "production" && <link rel="manifest" href="/manifest.json" />}
      </head>
      <body className="font-sans antialiased">
        <ServiceWorkerCleanup />
        {children}
      </body>
    </html>
  )
}
