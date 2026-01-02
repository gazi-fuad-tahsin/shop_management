// Simple client-side cache management
const cache: Record<string, { data: any; timestamp: number }> = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function setCacheValue(key: string, value: any) {
  cache[key] = {
    data: value,
    timestamp: Date.now(),
  }
}

export function getCacheValue(key: string) {
  const cached = cache[key]
  if (!cached) return null

  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    delete cache[key]
    return null
  }

  return cached.data
}

export function clearCache(key?: string) {
  if (key) {
    delete cache[key]
  } else {
    Object.keys(cache).forEach((k) => delete cache[k])
  }
}

export function getCacheKey(...parts: string[]) {
  return parts.join(":")
}
