// Service for syncing data between client and server
import { clearCache } from "./cache"

interface SyncQueue {
  id: string
  type: "create" | "update" | "delete"
  endpoint: string
  data: any
  timestamp: number
}

const syncQueue: SyncQueue[] = []

export function addToSyncQueue(type: SyncQueue["type"], endpoint: string, data: any) {
  syncQueue.push({
    id: Math.random().toString(36).substr(2, 9),
    type,
    endpoint,
    data,
    timestamp: Date.now(),
  })
}

export async function processSyncQueue() {
  let processed = 0

  for (const item of syncQueue) {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${item.endpoint}`, {
        method: item.type === "create" ? "POST" : item.type === "update" ? "PUT" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(item.data),
      })

      if (response.ok) {
        syncQueue.splice(syncQueue.indexOf(item), 1)
        processed++
        clearCache()
      }
    } catch (error) {
      console.error("Sync failed for item:", item, error)
    }
  }

  return processed
}

export function getSyncQueueLength() {
  return syncQueue.length
}
