"use client"

import { getInventory, updateInventory } from "@/lib/api-client"
import { useApi } from "./use-api"
import { clearCache, getCacheKey } from "@/lib/cache"

export function useInventory() {
  const { data: inventory, isLoading, error, refetch } = useApi(() => getInventory())

  const handleUpdate = async (id: string, inventoryData: any) => {
    await updateInventory(id, inventoryData)
    clearCache(getCacheKey("api", "[]"))
    refetch()
  }

  return {
    inventory: inventory || [],
    isLoading,
    error,
    refetch,
    handleUpdate,
  }
}
