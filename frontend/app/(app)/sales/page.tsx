"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Printer, Search } from "lucide-react"
import { apiCall } from "@/lib/api"
import { SalesDialog } from "@/components/sales-dialog"
import { InvoiceDialog } from "@/components/invoice-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageLoading } from "@/components/page-loading"

interface Sale {
  _id: string
  saleNumber: string
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  customerName?: string
  customerPhone?: string
  taxAmount?: number
  discountAmount?: number
  paymentDistribution?: { cash?: number; bank?: number }
  shop?: { _id: string; name: string }
  items?: Array<{ productName?: string; quantity?: number; subtotal?: number }>
}

interface Shop {
  _id: string
  name: string
}

export default function SalesPage() {
  const { user } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedShop, setSelectedShop] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [invoiceSaleId, setInvoiceSaleId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (user?.role === "admin") fetchShops()
  }, [user?.role])

  useEffect(() => {
    fetchSales()
  }, [selectedShop, user?.role, paymentFilter, statusFilter, startDate, endDate, searchTerm])

  const fetchShops = async () => {
    const response = await apiCall("/api/shops")
    const data = await response.json()
    setShops(data || [])
  }

  const fetchSales = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (user?.role === "admin" && selectedShop !== "all") params.set("shopId", selectedShop)
      if (paymentFilter !== "all") params.set("paymentMethod", paymentFilter)
      if (statusFilter !== "all") params.set("paymentStatus", statusFilter)
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)
      if (searchTerm.trim()) params.set("search", searchTerm.trim())
      const query = params.toString() ? `?${params.toString()}` : ""
      const response = await apiCall(`/api/sales${query}`)
      const data = await response.json()
      const baseSales = data.sales || []
      setSales(
        user?.role === "admin" && selectedShop !== "all"
          ? baseSales.filter((sale: Sale) => sale.shop?._id === selectedShop)
          : baseSales,
      )
    } catch (error) {
      console.error("Failed to fetch sales:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSales = sales

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground mt-1">Record and manage sales transactions</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Sale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[220px]"
            />
            <Input className="w-[150px]" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <Input className="w-[150px]" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearchTerm(""); setStartDate(""); setEndDate(""); setPaymentFilter("all"); setStatusFilter("all"); setSelectedShop("all") }}>
              Reset
            </Button>
            {user?.role === "admin" && (
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by shop" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shops</SelectItem>
                  {shops.map((shop) => (
                    <SelectItem key={shop._id} value={shop._id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoading compact />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  {user?.role === "admin" && <TableHead>Shop</TableHead>}
                  <TableHead>Amount</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale._id} className="cursor-pointer" onClick={() => setSelectedSale(sale)}>
                    <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                    {user?.role === "admin" && <TableCell>{sale.shop?.name || "-"}</TableCell>}
                    <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                    <TableCell className="max-w-[280px] truncate">
                      {sale.items?.map((item) => `${item.productName || "Item"} x${item.quantity || 0}`).join(", ") || "-"}
                    </TableCell>
                    <TableCell className="capitalize">{sale.paymentMethod}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          sale.paymentStatus === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                        }`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          setInvoiceSaleId(sale._id)
                        }}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Invoice
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Sale Number</span><span>{selectedSale.saleNumber}</span></div>
              <div className="flex justify-between"><span>Shop</span><span>{selectedSale.shop?.name || "-"}</span></div>
              <div className="flex justify-between"><span>Total</span><span>${selectedSale.totalAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${(selectedSale.taxAmount || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>${(selectedSale.discountAmount || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Cash</span><span>${(selectedSale.paymentDistribution?.cash || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Bank</span><span>${(selectedSale.paymentDistribution?.bank || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Customer</span><span>{selectedSale.customerName || "Walk-in"}</span></div>
              <div className="flex justify-between"><span>Phone</span><span>{selectedSale.customerPhone || "-"}</span></div>
              <div className="flex justify-between"><span>Date</span><span>{new Date(selectedSale.createdAt).toLocaleString()}</span></div>
              <div className="pt-2 border-t">
                <div className="font-medium mb-1">Sold Products</div>
                <div className="space-y-1">
                  {selectedSale.items?.map((item, idx) => (
                    <div key={`${selectedSale._id}-item-${idx}`} className="flex justify-between">
                      <span>{item.productName || "Item"} x{item.quantity || 0}</span>
                      <span>${(item.subtotal || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="mt-3 w-full" onClick={() => setInvoiceSaleId(selectedSale._id)}>
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <InvoiceDialog
        open={!!invoiceSaleId}
        saleId={invoiceSaleId}
        onOpenChange={(open) => {
          if (!open) setInvoiceSaleId(null)
        }}
      />

      <SalesDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          setIsDialogOpen(false)
          fetchSales()
        }}
      />
    </div>
  )
}
