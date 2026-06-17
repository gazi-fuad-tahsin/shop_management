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

  const fetchUserById = async (userId: string): Promise<User | null> => {
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
      const storedUser = localStorage.getItem("user")

      if (!storedUser) {
        setIsLoading(false)
        router.push("/auth/login")
        return
      }

      try {
        const parsedUser: User = JSON.parse(storedUser)
        setUser(parsedUser)

        // Refresh user data in background
        const freshUser = await fetchUserById(parsedUser.id)
        if (freshUser) {
          setUser(freshUser)
          localStorage.setItem("user", JSON.stringify(freshUser))
        }
      } catch (error) {
        console.error("Failed to parse user:", error)
        localStorage.removeItem("user")
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [mounted, router])

  const refreshUser = async () => {
    if (!user) return null

    const updatedUser = await fetchUserById(user.id)
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
