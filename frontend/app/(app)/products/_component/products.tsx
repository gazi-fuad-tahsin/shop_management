"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Trash2, Search } from "lucide-react"
import { apiCall } from "@/lib/api"
import { EnhancedProductDialog } from "@/components/enhanced-product-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageLoading } from "@/components/page-loading"

interface Product {
  _id?: string
  name: string
  sku: string
  barcode?: string
  retailPrice: number
  costPrice: number
  category?: string | { _id?: string; name?: string; description?: string; isActive?: boolean }
  color?: string
  specifications?: string
  isActive?: boolean
  shop?: { _id: string; name: string }
}

interface Shop {
  _id: string
  name: string
}

interface Category {
  _id: string
  name: string
}

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedShop, setSelectedShop] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    if (user?.role === "admin") fetchShops()
    fetchCategories()
  }, [user?.role])

  useEffect(() => {
    fetchProducts()
  }, [selectedShop, selectedCategory, minPrice, maxPrice, user?.role])

  const fetchShops = async () => {
    const response = await apiCall("/api/shops")
    const data = await response.json()
    setShops(data || [])
  }

  const fetchCategories = async () => {
    const response = await apiCall("/api/categories?type=product")
    if (response.ok) setCategories(await response.json())
  }

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (user?.role === "admin" && selectedShop !== "all") params.set("shopId", selectedShop)
      if (selectedCategory !== "all") params.set("category", selectedCategory)
      if (minPrice) params.set("minPrice", minPrice)
      if (maxPrice) params.set("maxPrice", maxPrice)
      const query = params.toString() ? `?${params.toString()}` : ""
      const response = await apiCall(`/api/products${query}`)
      const data = await response.json()
      const baseProducts = data.products || data
      setProducts(
        user?.role === "admin" && selectedShop !== "all"
          ? baseProducts.filter((product: Product) => product.shop?._id === selectedShop)
          : baseProducts,
      )
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      await apiCall(`/api/products/${id}`, {
        method: "DELETE",
      })
      setProducts(products.filter((p) => p._id !== id))
    } catch (error) {
      console.error("Failed to delete product:", error)
    }
  }

  const handleOpenDialog = (product: Product | null = null) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
  }

  const handleSuccess = () => {
    handleCloseDialog()
    fetchProducts()
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      p.barcode?.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  )

  const profit = (price: number, cost: number) => (((price - cost) / price) * 100)?.toFixed(1)
  const categoryLabel = (category: Product["category"]) => {
    if (!category) return "-"
    if (typeof category === "string") return category
    if (typeof category === "object") {
      return category.name || category._id || "-"
    }
    return "-"
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog with full details</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[220px]"
            />
            {user?.role === "admin" && (
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by shop" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shops</SelectItem>
                  {shops.map((shop) => (
                    <SelectItem key={shop._id} value={shop._id}>{shop.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input className="w-[130px]" type="number" placeholder="Min price" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} />
            <Input className="w-[130px]" type="number" placeholder="Max price" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} />
            <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedShop("all"); setSelectedCategory("all"); setMinPrice(""); setMaxPrice("") }}>
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoading compact />
          ) : filteredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No products found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    {user?.role === "admin" && <TableHead>Shop</TableHead>}
                    <TableHead>SKU</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Retail</TableHead>
                    <TableHead>Profit %</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow
                      key={product._id}
                      className={`${!product.isActive ? "opacity-50" : ""} cursor-pointer`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <TableCell className="font-medium">{product.name}</TableCell>
                      {user?.role === "admin" && <TableCell>{product.shop?.name || "-"}</TableCell>}
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>
                        {product.barcode ? (
                          <Badge variant="secondary" className="font-mono text-xs">
                            {product.barcode}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{categoryLabel(product.category)}</TableCell>
                      <TableCell>${product.costPrice?.toFixed(2)}</TableCell>
                      <TableCell>${product.retailPrice?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50">
                          {profit(product.retailPrice, product.costPrice)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(product)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => product._id && handleDelete(product._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Name</span><span>{selectedProduct.name}</span></div>
              <div className="flex justify-between"><span>Shop</span><span>{selectedProduct.shop?.name || "-"}</span></div>
              <div className="flex justify-between"><span>SKU</span><span>{selectedProduct.sku}</span></div>
              <div className="flex justify-between"><span>Barcode</span><span>{selectedProduct.barcode || "-"}</span></div>
              <div className="flex justify-between"><span>Cost Price</span><span>${selectedProduct.costPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Selling Price</span><span>${selectedProduct.retailPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Category</span><span>{categoryLabel(selectedProduct.category)}</span></div>
              <div className="flex justify-between"><span>Color</span><span>{selectedProduct.color || "-"}</span></div>
              <div><span className="font-medium">Specifications: </span>{selectedProduct.specifications || "-"}</div>
              <Button className="w-full mt-2" onClick={() => { setSelectedProduct(null); handleOpenDialog(selectedProduct) }}>
                Edit Product
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EnhancedProductDialog open={isDialogOpen} onOpenChange={handleCloseDialog} product={editingProduct} onSuccess={handleSuccess} />
    </div>
  )
}
