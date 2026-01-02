// Offline-first data management using IndexedDB
export interface OfflineData {
  id: string
  type: "product" | "inventory" | "sale"
  data: any
  synced: boolean
  timestamp: number
}

const DB_NAME = "ShopManagerDB"
const DB_VERSION = 1
const STORE_NAME = "offline-data"

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
  })
}

export async function saveOfflineData(data: OfflineData) {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], "readwrite")
  const store = transaction.objectStore(STORE_NAME)
  return store.put(data)
}

export async function getOfflineData(type: string): Promise<OfflineData[]> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], "readonly")
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const results = request.result.filter((item) => item.type === type)
      resolve(results)
    }
  })
}

export async function clearOfflineData(id: string) {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], "readwrite")
  const store = transaction.objectStore(STORE_NAME)
  return store.delete(id)
}

export async function getUnsyncedData(): Promise<OfflineData[]> {
  const db = await openDB()
  const transaction = db.transaction([STORE_NAME], "readonly")
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const results = request.result.filter((item) => !item.synced)
      resolve(results)
    }
  })
}
