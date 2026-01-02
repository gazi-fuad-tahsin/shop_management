"use client"

import { useState, useCallback, useEffect } from "react"
import { getCacheValue, setCacheValue, getCacheKey } from "@/lib/cache"

interface UseApiOptions {
  cache?: boolean
  immediate?: boolean
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = { cache: true, immediate: true },
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = getCacheKey("api", JSON.stringify(dependencies))

  const execute = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check cache first
      if (options.cache) {
        const cached = getCacheValue(cacheKey)
        if (cached) {
          setData(cached)
          setIsLoading(false)
          return cached
        }
      }

      const result = await fetcher()
      setData(result)

      // Store in cache
      if (options.cache) {
        setCacheValue(cacheKey, result)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [cacheKey, fetcher, options.cache])

  useEffect(() => {
    if (options.immediate) {
      execute()
    }
  }, dependencies)

  return { data, isLoading, error, refetch: execute }
}
