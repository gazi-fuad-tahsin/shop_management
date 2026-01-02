// Service Worker for offline support
const CACHE_NAME = "shop-manager-v1"
const STATIC_ASSETS = ["/", "/dashboard", "/products", "/inventory", "/sales", "/reports"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName)),
      )
    }),
  )
})

self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") {
    return
  }

  // API requests - network first, fall back to cache
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const clonedResponse = response.clone()
          // Cache the response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse)
          })
          return response
        })
        .catch(() => {
          // Return cached version
          return caches.match(event.request)
        }),
    )
    return
  }

  // Static assets - cache first, fall back to network
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        return (
          response ||
          fetch(event.request).then((response) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone())
            })
            return response
          })
        )
      })
      .catch(() => {
        // Return offline page if available
        return caches.match("/offline.html")
      }),
  )
})
