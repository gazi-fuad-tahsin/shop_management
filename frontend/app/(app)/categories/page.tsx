"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Edit2, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { apiCall } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageLoading } from "@/components/page-loading"

type Shop = { _id: string; name: string; shopType?: string }
type Category = {
  _id: string
  name: string
  description?: string
  type: string
  shop?: Shop
  visibleToAllBranches?: boolean
  branchShops?: Shop[]
}

export default function CategoriesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "product",
    shop: "",
    visibleToAllBranches: true,
  })

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard")
    }
  }, [user, router])

  const load = async () => {
    setIsLoading(true)
    try {
      const [shopsRes, categoriesRes] = await Promise.all([apiCall("/api/shops"), apiCall("/api/categories")])
      if (shopsRes.ok) {
        const shopsData = await shopsRes.json()
        setShops(shopsData || [])
        setForm((current) => ({ ...current, shop: current.shop || shopsData?.[0]?._id || "" }))
      }
      if (categoriesRes.ok) setCategories(await categoriesRes.json())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user || user.role !== "admin") return
    load()
  }, [user])

  if (user && user.role !== "admin") return <PageLoading compact />

  const resetForm = () => {
    setEditing(null)
    setForm({ name: "", description: "", type: "product", shop: shops[0]?._id || "", visibleToAllBranches: true })
  }

  const saveCategory = async () => {
    if (!form.name.trim() || !form.shop) return
    const url = editing ? `/api/categories/${editing._id}` : "/api/categories"
    const method = editing ? "PUT" : "POST"
    const response = await apiCall(url, {
      method,
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description,
        type: form.type,
        shop: form.shop,
        visibleToAllBranches: form.visibleToAllBranches,
      }),
    })
    if (response.ok) {
      resetForm()
      await load()
    }
  }

  const editCategory = (category: Category) => {
    setEditing(category)
    setForm({
      name: category.name,
      description: category.description || "",
      type: category.type || "product",
      shop: category.shop?._id || shops[0]?._id || "",
      visibleToAllBranches: Boolean(category.visibleToAllBranches),
    })
  }

  const deleteCategory = async (category: Category) => {
    if (!confirm(`Delete category "${category.name}"?`)) return
    const response = await apiCall(`/api/categories/${category._id}`, { method: "DELETE" })
    if (response.ok) await load()
  }

  if (isLoading) return <PageLoading compact />

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = !search.trim() || [category.name, category.description, category.shop?.name].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || category.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="mt-1 text-muted-foreground">Create product and expense categories for your main shop and branches.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit Category" : "Add Category"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Owner Shop</Label>
            <Select value={form.shop} onValueChange={(value) => setForm({ ...form, shop: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {shops.map((shop) => (
                  <SelectItem key={shop._id} value={shop._id}>{shop.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex items-center gap-2 pb-2">
              <Switch checked={form.visibleToAllBranches} onCheckedChange={(checked) => setForm({ ...form, visibleToAllBranches: checked })} />
              <Label>All branches</Label>
            </div>
          </div>
          <div className="flex gap-2 md:col-span-5">
            <Button onClick={saveCategory}>
              <Plus className="mr-2 h-4 w-4" />
              {editing ? "Save Category" : "Add Category"}
            </Button>
            {editing && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Category List</CardTitle>
            <div className="flex gap-2">
              <Input className="w-64" placeholder="Search categories" value={search} onChange={(event) => setSearch(event.target.value)} />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Owner Shop</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category._id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="capitalize">{category.type}</TableCell>
                  <TableCell>{category.shop?.name || "-"}</TableCell>
                  <TableCell>{category.visibleToAllBranches ? "All branches" : category.branchShops?.map((shop) => shop.name).join(", ") || "Owner shop only"}</TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => editCategory(category)}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteCategory(category)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
