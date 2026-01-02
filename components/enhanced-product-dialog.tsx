"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { apiCall } from "@/lib/api"

interface Product {
  _id?: string
  name: string
  sku: string
  barcode?: string
  description?: string
  category?: string
  supplier?: string
  costPrice: number
  retailPrice: number
  wholesalePrice?: number
  color?: string
  specifications?: string
  warranty?: { duration: number; type: string }
  weight?: number
  dimensions?: { length: number; width: number; height: number; unit: string }
  images?: string[]
  manufacturer?: string
  unit?: string
  batchTrackingEnabled?: boolean
  expiryTrackingEnabled?: boolean
  minStock?: number
  maxStock?: number
}

interface Category {
  _id: string
  name: string
}

interface Supplier {
  _id: string
  name: string
}

export function EnhancedProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState<Product>({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    category: "",
    supplier: "",
    costPrice: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    color: "",
    specifications: "",
    warranty: { duration: 0, type: "months" },
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0, unit: "cm" },
    images: [],
    manufacturer: "",
    unit: "piece",
    batchTrackingEnabled: false,
    expiryTrackingEnabled: false,
    minStock: 5,
    maxStock: 100,
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      fetchCategories()
      fetchSuppliers()
      if (product) {
        setFormData(product)
      } else {
        setFormData({
          name: "",
          sku: "",
          barcode: "",
          description: "",
          category: "",
          supplier: "",
          costPrice: 0,
          retailPrice: 0,
          wholesalePrice: 0,
          color: "",
          specifications: "",
          warranty: { duration: 0, type: "months" },
          weight: 0,
          dimensions: { length: 0, width: 0, height: 0, unit: "cm" },
          images: [],
          manufacturer: "",
          unit: "piece",
          batchTrackingEnabled: false,
          expiryTrackingEnabled: false,
          minStock: 5,
          maxStock: 100,
        })
      }
    }
  }, [open, product])

  const fetchCategories = async () => {
    try {
      const response = await apiCall("/api/categories")
      const data = await response.json()
      console.log(data)
      setCategories(data)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await apiCall("/api/suppliers")
      const data = await response.json()
      setSuppliers(data)
    } catch (error) {
      console.error("Failed to fetch suppliers:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const url = product?._id ? `/api/products/${product._id}` : "/api/products"
      const method = product?._id ? "PUT" : "POST"

      const response = await apiCall(url, {
        method,
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to save product")
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., USB Type-C Cable"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g., USB-C-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="8901234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product details..."
                rows={2}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold">Pricing</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retailPrice">Retail Price *</Label>
                <Input
                  id="retailPrice"
                  type="number"
                  step="0.01"
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({ ...formData, retailPrice: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wholesalePrice">Wholesale Price</Label>
                <Input
                  id="wholesalePrice"
                  type="number"
                  step="0.01"
                  value={formData.wholesalePrice}
                  onChange={(e) => setFormData({ ...formData, wholesalePrice: Number.parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Physical Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Physical Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g., Black, Red"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g., Samsung, Apple"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (grams)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit || "piece"}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specifications">Specifications</Label>
              <Textarea
                id="specifications"
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                placeholder="e.g., Length: 2m, Material: Nylon"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warranty Duration (months)</Label>
                <Input
                  type="number"
                  value={formData.warranty?.duration || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      warranty: { ...formData.warranty, duration: Number.parseInt(e.target.value) },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Inventory Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Inventory Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStock">Maximum Stock</Label>
                <Input
                  id="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => setFormData({ ...formData, maxStock: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="batchTracking"
                  checked={formData.batchTrackingEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, batchTrackingEnabled: checked as boolean })}
                />
                <Label htmlFor="batchTracking" className="font-normal cursor-pointer">
                  Enable Batch Tracking
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="expiryTracking"
                  checked={formData.expiryTrackingEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, expiryTrackingEnabled: checked as boolean })}
                />
                <Label htmlFor="expiryTracking" className="font-normal cursor-pointer">
                  Enable Expiry Tracking
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {product ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
