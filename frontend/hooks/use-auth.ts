"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiCall } from "@/lib/api"

interface Shop {
  _id: string
  name?: string
}

interface User {
  id: string
  name: string
  email: string
  role: "super_admin" | "admin" | "manager" | "staff"
  shop?: Shop | string | null
  mainShop?: Shop | string | null
  branchShop?: Shop | string | null
  approvalStatus?: "pending" | "approved" | "rejected"
  managerStatus?: "none" | "pending" | "approved" | "rejected"
  branchSetupStatus?: "not_required" | "pending" | "completed"
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  const fetchCurrentUser = async (): Promise<User | null> => {
    try {
      const response = await apiCall(`/api/auth/me`)

      if (!response.ok) {
        return null
      }

      const updatedUser = await response.json()
      return updatedUser
    } catch (error) {
      console.error("Failed to fetch user:", error)
      return null
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadUser = async () => {
      const token = localStorage.getItem("token")
      const storedUser = localStorage.getItem("user")

      if (!token) {
        localStorage.removeItem("user")
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        if (storedUser) {
          const parsedUser: User = JSON.parse(storedUser)
          setUser(parsedUser)
        }

        const freshUser = await fetchCurrentUser()
        if (freshUser) {
          setUser(freshUser)
          localStorage.setItem("user", JSON.stringify(freshUser))
        } else {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          setUser(null)
        }
      } catch (error) {
        console.error("Failed to parse user:", error)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [mounted, router])

  const refreshUser = async () => {
    if (!user) return null

    const updatedUser = await fetchCurrentUser()
    if (updatedUser) {
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }

    return updatedUser
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    router.push("/auth/login")
  }

  return { user, isLoading, logout, refreshUser }
}
