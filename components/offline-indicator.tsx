"use client"

import { useOnlineStatus } from "@/hooks/use-online-status"
import { useSync } from "@/hooks/use-sync"
import { WifiOff, RefreshCw } from "lucide-react"

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  const { pendingSync, isSyncing } = useSync()

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 flex items-center gap-3 z-50">
        <WifiOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        <div>
          <p className="font-semibold text-yellow-900 dark:text-yellow-200">Offline</p>
          <p className="text-sm text-yellow-800 dark:text-yellow-300">Your changes will sync when you're online</p>
        </div>
      </div>
    )
  }

  if (isSyncing || pendingSync > 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4 flex items-center gap-3 z-50">
        <RefreshCw className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${isSyncing ? "animate-spin" : ""}`} />
        <div>
          <p className="font-semibold text-blue-900 dark:text-blue-200">Syncing</p>
          {pendingSync > 0 && <p className="text-sm text-blue-800 dark:text-blue-300">{pendingSync} changes pending</p>}
        </div>
      </div>
    )
  }

  return null
}
