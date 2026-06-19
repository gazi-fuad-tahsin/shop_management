"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Trash2, Search, Store } from "lucide-react"
import { apiCall } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserDialog } from "@/components/user-dialog"
import { PageLoading } from "@/components/page-loading"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "manager" | "staff"
  isActive: boolean
}

interface Shop {
  _id: string
  name: string
  phone?: string
  email?: string
  city?: string
  state?: string
  owner: {
    _id: string
    name: string
    email: string
  }
  isActive: boolean
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchShopTerm, setSearchShopTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard")
    }
  }, [user, router])

  useEffect(() => {
    if (!user || user.role !== "admin") return
    fetchData()
  }, [user])

  if (user && user.role !== "admin") return <PageLoading compact />

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [usersRes, shopsRes] = await Promise.all([
        apiCall("/api/users"),
        apiCall("/api/shops")
      ])
      const usersData = await usersRes.json()
      const shopsData = await shopsRes.json()
      setUsers(usersData)
      setShops(shopsData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return

    try {
      await apiCall(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: false }),
      })
      setUsers(users.filter((u) => u._id !== id))
    } catch (error) {
      console.error("Failed to delete user:", error)
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredShops = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(searchShopTerm.toLowerCase()) ||
      s.owner?.name?.toLowerCase().includes(searchShopTerm.toLowerCase()),
  )

  const managerCount = users.filter((u) => u.role === "manager").length

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage users, shops and system settings</p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null)
            setIsDialogOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managerCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shops.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Users and Shops */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="shops" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Shops
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <PageLoading compact />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u._id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="capitalize">{u.role}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              u.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200"
                            }`}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingUser(u)
                              setIsDialogOpen(true)
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(u._id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shops" className="space-y-4">
          {/* Shops Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search shops or managers..."
                  value={searchShopTerm}
                  onChange={(e) => setSearchShopTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <PageLoading compact />
              ) : filteredShops.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No shops found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop Name</TableHead>
                      <TableHead>Manager Name</TableHead>
                      <TableHead>Manager Email</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShops.map((s) => (
                      <TableRow key={s._id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.owner?.name || "N/A"}</TableCell>
                        <TableCell>{s.owner?.email || "N/A"}</TableCell>
                        <TableCell>{s.city && s.state ? `${s.city}, ${s.state}` : "N/A"}</TableCell>
                        <TableCell>{s.phone || "N/A"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              s.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200"
                            }`}
                          >
                            {s.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={editingUser}
        onSuccess={() => {
          setIsDialogOpen(false)
          fetchData()
        }}
      />
    </div>
  )
}
