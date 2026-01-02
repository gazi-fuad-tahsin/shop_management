"use client"

import { getSales, createSale } from "@/lib/api-client"
import { useApi } from "./use-api"
import { clearCache, getCacheKey } from "@/lib/cache"

export function useSales() {
  const { data: sales, isLoading, error, refetch } = useApi(() => getSales())

  const handleCreate = async (saleData: any) => {
    await createSale(saleData)
    clearCache(getCacheKey("api", "[]"))
    refetch()
  }

  return {
    sales: sales || [],
    isLoading,
    error,
    refetch,
    handleCreate,
  }
}
