"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiCall } from "@/lib/api"

type User = {
  _id: string
  name: string
  email: string
  role: string
  approvalStatus: string
  isActive: boolean
  shop?: { name?: string }
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  const loadUsers = async () => {
    const params = new URLSearchParams()
    if (roleFilter !== "all") params.set("role", roleFilter)
    if (search.trim()) params.set("search", search.trim())
    const response = await apiCall(`/api/super-admin/users?${params.toString()}`)
    if (response.ok) setUsers(await response.json())
  }

  useEffect(() => {
    loadUsers()
  }, [roleFilter])

  const filtered = useMemo(
    () => users.filter((user) => [user.name, user.email, user.role, user.shop?.name].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())),
    [users, search],
  )

  const updateUser = async (id: string, updates: Partial<User>) => {
    const response = await apiCall(`/api/super-admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    })
    if (response.ok) loadUsers()
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="mt-1 text-muted-foreground">Global user and role management</p>
      </div>
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Users</CardTitle>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input className="w-72" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && loadUsers()} placeholder="Search users" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.shop?.name || "Global"}</TableCell>
                  <TableCell className="capitalize">{user.approvalStatus}</TableCell>
                  <TableCell>
                    <Select value={user.role} onValueChange={(role) => updateUser(user._id, { role })}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Shop Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={user.isActive ? "active" : "inactive"} onValueChange={(value) => updateUser(user._id, { isActive: value === "active" })}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No users found</div>}
        </CardContent>
      </Card>
    </div>
  )
}
