"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Trash2, Plus, AlertCircle, CheckCircle } from "lucide-react"
import { apiCall } from "@/lib/api"

interface Product {
  _id: string
  name: string
  barcode: string
  retailPrice: number
  costPrice: number
  category: { name: string }
}

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
}

interface Customer {
  _id: string
  name: string
  phone: string
  customerType: string
}

export default function POSPage() {
  const [barcodeInput, setBarcodeInput] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState({ name: "", phone: "", email: "" })
  const barcodeRef = useRef<HTMLInputElement>(null)

  const paymentMethods = ["cash", "card", "check", "online", "upi"]

  useEffect(() => {
    fetchCustomers()
    // Focus barcode input on mount
    setTimeout(() => barcodeRef.current?.focus(), 100)
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await apiCall("/api/customers")
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    }
  }

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return

    setError("")
    try {
      const response = await apiCall(`/api/products/barcode/${barcodeInput}`)

      if (!response.ok) {
        setError(`Product not found for barcode: ${barcodeInput}`)
        setBarcodeInput("")
        barcodeRef.current?.focus()
        return
      }

      const product: Product = await response.json()

      // Check if product already in cart
      const existingItem = cartItems.find((item) => item.product._id === product._id)

      if (existingItem) {
        // Increase quantity
        const updatedItems = cartItems.map((item) =>
          item.product._id === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice - item.discount,
              }
            : item,
        )
        setCartItems(updatedItems)
      } else {
        // Add new item
        setCartItems([
          ...cartItems,
          {
            product,
            quantity: 1,
            unitPrice: product.retailPrice,
            discount: 0,
            subtotal: product.retailPrice,
          },
        ])
      }

      setSuccess(`Added: ${product.name}`)
      setBarcodeInput("")
      barcodeRef.current?.focus()

      setTimeout(() => setSuccess(""), 2000)
    } catch (err) {
      setError("Failed to lookup product")
      setBarcodeInput("")
      barcodeRef.current?.focus()
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    const updatedItems = cartItems.map((item) =>
      item.product._id === productId
        ? {
            ...item,
            quantity,
            subtotal: quantity * item.unitPrice - item.discount,
          }
        : item,
    )
    setCartItems(updatedItems)
  }

  const updateDiscount = (productId: string, discount: number) => {
    const updatedItems = cartItems.map((item) =>
      item.product._id === productId
        ? {
            ...item,
            discount,
            subtotal: item.quantity * item.unitPrice - discount,
          }
        : item,
    )
    setCartItems(updatedItems)
  }

  const removeItem = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.product._id !== productId))
  }

  const totals = {
    subtotal: cartItems.reduce((sum, item) => sum + item.subtotal, 0),
    discount: cartItems.reduce((sum, item) => sum + item.discount, 0),
    tax: cartItems.reduce((sum, item) => sum + item.subtotal, 0) * 0.1, // 10% tax
    total: 0,
  }
  totals.total = totals.subtotal + totals.tax - totals.discount

  const handleAddCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) {
      setError("Name and phone are required")
      return
    }

    try {
      const response = await apiCall("/api/customers/quick", {
        method: "POST",
        body: JSON.stringify(newCustomerData),
      })

      if (!response.ok) throw new Error("Failed to create customer")

      const customer = await response.json()
      setSelectedCustomer(customer)
      setNewCustomerData({ name: "", phone: "", email: "" })
      setShowCustomerDialog(false)
      fetchCustomers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer")
    }
  }

  const handleCompleteSale = async () => {
    if (cartItems.length === 0) {
      setError("Cart is empty")
      return
    }

    if (!paymentMethod) {
      setError("Select payment method")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const saleData = {
        items: cartItems.map((item) => ({
          productId: item.product._id,
          barcode: item.product.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          subtotal: item.subtotal,
        })),
        customerId: selectedCustomer?._id,
        customerName: selectedCustomer?.name || "Walk-in",
        customerPhone: selectedCustomer?.phone,
        totalAmount: totals.total,
        taxAmount: totals.tax,
        discountAmount: totals.discount,
        paymentMethod,
        saleType: selectedCustomer?.customerType || "retail",
      }

      const response = await apiCall("/api/sales", {
        method: "POST",
        body: JSON.stringify(saleData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to complete sale")
      }

      const sale = await response.json()
      setSuccess(`Sale completed! Invoice: ${sale.saleNumber}`)
      setCartItems([])
      setSelectedCustomer(null)
      setPaymentMethod("cash")
      barcodeRef.current?.focus()

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete sale")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Point of Sale (POS)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Barcode Input */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Barcode Scanner */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Product</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    ref={barcodeRef}
                    id="barcode"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan barcode or enter manually"
                    autoComplete="off"
                    className="text-lg font-mono"
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card>
            <CardHeader>
              <CardTitle>Shopping Cart ({cartItems.length} items)</CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Cart is empty. Scan products to add.</p>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartItems.map((item) => (
                          <TableRow key={item.product._id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.product.name}</p>
                                <p className="text-xs text-muted-foreground">{item.product.barcode}</p>
                              </div>
                            </TableCell>
                            <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product._id, Number.parseInt(e.target.value))}
                                className="w-16"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.discount}
                                onChange={(e) => updateDiscount(item.product._id, Number.parseFloat(e.target.value))}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell className="font-semibold">${item.subtotal.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => removeItem(item.product._id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Customer & Payment */}
        <div className="space-y-6">
          {/* Customer Section */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCustomer ? (
                <div className="space-y-3 p-3 bg-blue-50 rounded">
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Clear Customer
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={selectedCustomer?._id || ""}
                    onValueChange={(value) => {
                      const customer = customers.find((c) => c._id === value)
                      setSelectedCustomer(customer || null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer.name} ({customer.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setShowCustomerDialog(true)}
                  >
                    Add New Customer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="font-medium text-red-600">-${totals.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span className="font-medium">${totals.tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleCompleteSale}
                disabled={isLoading || cartItems.length === 0}
              >
                Complete Sale (${totals.total.toFixed(2)})
              </Button>

              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  setCartItems([])
                  setSelectedCustomer(null)
                  setPaymentMethod("cash")
                }}
              >
                Clear All
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newCustomerData.name}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newCustomerData.phone}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newCustomerData.email}
                onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                placeholder="Email (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomer}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
