import { apiCall } from "./api"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

// Products
export async function getProducts() {
  const response = await apiCall("/api/products")
  return response.json()
}

export async function getProduct(id: string) {
  const response = await apiCall(`/api/products/${id}`)
  return response.json()
}

export async function createProduct(data: any) {
  const response = await apiCall("/api/products", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function updateProduct(id: string, data: any) {
  const response = await apiCall(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Inventory
export async function getInventory() {
  const response = await apiCall("/api/inventory")
  return response.json()
}

export async function getInventoryByProduct(productId: string) {
  const response = await apiCall(`/api/inventory/product/${productId}`)
  return response.json()
}

export async function updateInventory(id: string, data: any) {
  const response = await apiCall(`/api/inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function createInventory(data: any) {
  const response = await apiCall("/api/inventory", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Sales
export async function getSales() {
  const response = await apiCall("/api/sales")
  return response.json()
}

export async function getSalesByDateRange(startDate: string, endDate: string) {
  const response = await apiCall(`/api/sales/range?startDate=${startDate}&endDate=${endDate}`)
  return response.json()
}

export async function createSale(data: any) {
  const response = await apiCall("/api/sales", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Users
export async function getUsers() {
  const response = await apiCall("/api/users")
  return response.json()
}

export async function getUser(id: string) {
  const response = await apiCall(`/api/users/${id}`)
  return response.json()
}

export async function updateUser(id: string, data: any) {
  const response = await apiCall(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}

// Auth
export async function login(email: string, password: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  return response.json()
}

export async function register(data: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return response.json()
}
