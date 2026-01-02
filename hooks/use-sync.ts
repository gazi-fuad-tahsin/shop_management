"use client"

import { useEffect, useState } from "react"
import { processSyncQueue, getSyncQueueLength } from "@/lib/sync-service"

export function useSync() {
  const [pendingSync, setPendingSync] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        setIsSyncing(true)
        await processSyncQueue()
        setPendingSync(getSyncQueueLength())
        setIsSyncing(false)
      }
    }, 5000) // Sync every 5 seconds

    return () => clearInterval(syncInterval)
  }, [])

  return {
    pendingSync,
    isSyncing,
  }
}
