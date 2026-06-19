"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiCall } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { PageLoading } from "@/components/page-loading"

interface Shop {
  _id: string
  name: string
}

interface MonthlyReport {
  month: string
  totals: {
    revenue: number
    costPrice: number
    profit: number
    expenses: number
    netBalance: number
    cashRevenue: number
    bankRevenue: number
  }
  dailySummary: Array<{
    date: string
    revenue: number
    costPrice: number
    profit: number
    expenses: number
    netBalance: number
    cashAmount: number
    bankAmount: number
  }>
  branchBreakdown?: Array<{
    shop: string
    shopName: string
    revenue: number
    expenses: number
    profit: number
    netBalance: number
    cashRevenue: number
    bankRevenue: number
  }>
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [paymentType, setPaymentType] = useState("all")
  const [shopId, setShopId] = useState("all")
  const [findDate, setFindDate] = useState("")
  const [shops, setShops] = useState<Shop[]>([])
  const [data, setData] = useState<MonthlyReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ month })
      if (paymentType !== "all") params.set("paymentType", paymentType)
      if (user?.role === "admin" && shopId !== "all") params.set("shopId", shopId)

      const response = await apiCall(`/api/v1/reports/monthly?${params.toString()}`)
      const report = await response.json()
      setData(report)
    } catch (error) {
      console.error("Failed to fetch monthly reports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchShops = async () => {
    if (user?.role !== "admin") return
    const response = await apiCall("/api/shops")
    const shopsData = await response.json()
    setShops(shopsData)
  }

  useEffect(() => {
    fetchShops()
  }, [user?.role])

  useEffect(() => {
    fetchData()
  }, [month, paymentType, shopId, user?.role])

  const selectedDay = useMemo(() => {
    if (!findDate || !data?.dailySummary) return null
    return data.dailySummary.find((row) => row.date === findDate) || null
  }, [findDate, data])

  if (isLoading) {
    return <PageLoading compact />
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1">Monthly revenue, profit, expenses and net balance</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="month">Month</Label>
              <Input id="month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div>
              <Label>Payment Type</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {user?.role === "admin" && (
              <div>
                <Label>Shop</Label>
                <Select value={shopId} onValueChange={setShopId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shops</SelectItem>
                    {shops.map((shop) => <SelectItem key={shop._id} value={shop._id}>{shop.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="findDate">Find Any Day</Label>
              <Input id="findDate" type="date" value={findDate} onChange={(e) => setFindDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedDay && (
        <Card>
          <CardHeader><CardTitle>{selectedDay.date} Snapshot</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>Cash: <strong>${(selectedDay.cashAmount || 0).toFixed(2)}</strong></div>
            <div>Bank: <strong>${(selectedDay.bankAmount || 0).toFixed(2)}</strong></div>
            <div>Revenue: <strong>${(selectedDay.revenue || 0).toFixed(2)}</strong></div>
            <div>Net Balance: <strong>${(selectedDay.netBalance || 0).toFixed(2)}</strong></div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Revenue</CardTitle></CardHeader><CardContent className="text-xl font-semibold">${(data?.totals.revenue || 0).toFixed(2)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Profit</CardTitle></CardHeader><CardContent className="text-xl font-semibold">${(data?.totals.profit || 0).toFixed(2)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Expenses</CardTitle></CardHeader><CardContent className="text-xl font-semibold">${(data?.totals.expenses || 0).toFixed(2)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Net Balance</CardTitle></CardHeader><CardContent className="text-xl font-semibold">${(data?.totals.netBalance || 0).toFixed(2)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Cash Revenue</CardTitle></CardHeader><CardContent className="text-xl font-semibold">${(data?.totals.cashRevenue || 0).toFixed(2)}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Bank Revenue</CardTitle></CardHeader><CardContent className="text-xl font-semibold">${(data?.totals.bankRevenue || 0).toFixed(2)}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-right py-2">Cash</th>
                  <th className="text-right py-2">Bank</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">Cost Price</th>
                  <th className="text-right py-2">Profit</th>
                  <th className="text-right py-2">Expenses</th>
                  <th className="text-right py-2">Net Balance</th>
                </tr>
              </thead>
              <tbody>
                {data?.dailySummary?.map((row) => (
                  <tr key={row.date} className="border-b">
                    <td className="py-2">{row.date}</td>
                    <td className="py-2 text-right">${(row.cashAmount || 0).toFixed(2)}</td>
                    <td className="py-2 text-right">${(row.bankAmount || 0).toFixed(2)}</td>
                    <td className="py-2 text-right">${(row.revenue || 0).toFixed(2)}</td>
                    <td className="py-2 text-right">${(row.costPrice || 0).toFixed(2)}</td>
                    <td className="py-2 text-right">${(row.profit || 0).toFixed(2)}</td>
                    <td className="py-2 text-right">${(row.expenses || 0).toFixed(2)}</td>
                    <td className="py-2 text-right">${(row.netBalance || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {data?.branchBreakdown?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Branch Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Branch</th>
                    <th className="text-right py-2">Revenue</th>
                    <th className="text-right py-2">Profit</th>
                    <th className="text-right py-2">Expenses</th>
                    <th className="text-right py-2">Net Balance</th>
                    <th className="text-right py-2">Cash</th>
                    <th className="text-right py-2">Bank</th>
                  </tr>
                </thead>
                <tbody>
                  {data.branchBreakdown.map((row) => (
                    <tr key={row.shop} className="border-b">
                      <td className="py-2">{row.shopName}</td>
                      <td className="py-2 text-right">${(row.revenue || 0).toFixed(2)}</td>
                      <td className="py-2 text-right">${(row.profit || 0).toFixed(2)}</td>
                      <td className="py-2 text-right">${(row.expenses || 0).toFixed(2)}</td>
                      <td className="py-2 text-right">${(row.netBalance || 0).toFixed(2)}</td>
                      <td className="py-2 text-right">${(row.cashRevenue || 0).toFixed(2)}</td>
                      <td className="py-2 text-right">${(row.bankRevenue || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
