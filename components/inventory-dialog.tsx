"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiCall } from "@/lib/api"

interface InventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Product {
  _id: string
  name: string
  sku: string
}

export function InventoryDialog({ open, onOpenChange, onSuccess }: InventoryDialogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    product: "",
    quantity: 0,
    reorderLevel: 10,
    reorderQuantity: 50,
    warehouse: "Main",
    lastRestockDate: "",
    lastRestockQuantity: 0,
    expiryDate: "",
    batchNumber: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  useEffect(() => {
    if (open) {
      fetchProducts()
    }
  }, [open])

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true)
      const response = await apiCall("/api/products")
      const data = await response.json()
      setProducts(Array.isArray(data) ? data : data.products || [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product) {
      alert("Please select a product")
      return
    }

    setIsLoading(true)

    try {
      const payload = {
        product: formData.product,
        quantity: Number(formData.quantity),
        reorderLevel: Number(formData.reorderLevel),
        reorderQuantity: Number(formData.reorderQuantity),
        warehouse: formData.warehouse,
        ...(formData.lastRestockDate && {
          lastRestockDate: new Date(formData.lastRestockDate).toISOString(),
        }),
        ...(formData.lastRestockQuantity && {
          lastRestockQuantity: Number(formData.lastRestockQuantity),
        }),
        ...(formData.expiryDate && {
          expiryDate: new Date(formData.expiryDate).toISOString(),
        }),
        ...(formData.batchNumber && {
          batchNumber: formData.batchNumber,
        }),
      }

      await apiCall("/api/inventory", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      onSuccess()
      setFormData({
        product: "",
        quantity: 0,
        reorderLevel: 10,
        reorderQuantity: 50,
        warehouse: "Main",
        lastRestockDate: "",
        lastRestockQuantity: 0,
        expiryDate: "",
        batchNumber: "",
      })
    } catch (error) {
      console.error("Failed to add inventory:", error)
      alert("Failed to add inventory item")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory</DialogTitle>
          <DialogDescription>Add a new item to your inventory</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product">Product *</Label>
            <Select
              value={formData.product}
              onValueChange={(value) => setFormData({ ...formData, product: value })}
              disabled={isLoadingProducts}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select a product"} />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product._id} value={product._id}>
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <Label htmlFor="warehouse">Warehouse</Label>
              <Input
                id="warehouse"
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                placeholder="Main"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
              <Input
                id="reorderQuantity"
                type="number"
                min="0"
                value={formData.reorderQuantity}
                onChange={(e) => setFormData({ ...formData, reorderQuantity: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lastRestockDate">Last Restock Date</Label>
            <Input
              id="lastRestockDate"
              type="date"
              value={formData.lastRestockDate}
              onChange={(e) => setFormData({ ...formData, lastRestockDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="lastRestockQuantity">Last Restock Quantity</Label>
            <Input
              id="lastRestockQuantity"
              type="number"
              min="0"
              value={formData.lastRestockQuantity}
              onChange={(e) => setFormData({ ...formData, lastRestockQuantity: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="batchNumber">Batch Number</Label>
            <Input
              id="batchNumber"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              placeholder="e.g., BATCH-001"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Inventory"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
