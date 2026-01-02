"use client"

import { getProducts, createProduct, updateProduct } from "@/lib/api-client"
import { useApi } from "./use-api"
import { clearCache, getCacheKey } from "@/lib/cache"

export function useProducts() {
  const { data: products, isLoading, error, refetch } = useApi(() => getProducts())

  const handleCreate = async (productData: any) => {
    await createProduct(productData)
    clearCache(getCacheKey("api", "[]"))
    refetch()
  }

  const handleUpdate = async (id: string, productData: any) => {
    await updateProduct(id, productData)
    clearCache(getCacheKey("api", "[]"))
    refetch()
  }

  return {
    products: products || [],
    isLoading,
    error,
    refetch,
    handleCreate,
    handleUpdate,
  }
}
