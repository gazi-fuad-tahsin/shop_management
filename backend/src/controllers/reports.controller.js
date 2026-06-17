import Sale from "../models/Sale.js"
import Product from "../models/Product.js"
import DailyCost from "../models/DailyCost.js"
import User from "../models/User.js"

const getMonthRange = (monthInput) => {
  const now = new Date()
  const [year, month] = (monthInput || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).split("-").map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  return { start, end }
}

const getShopIdForUser = async (userId, role, shopParam) => {
  if (role === "super_admin" && shopParam) return shopParam
  const user = await User.findById(userId).select("shop")
  return user?.shop
}

const getDateKey = (value) =>
  new Date(value).toLocaleDateString("en-CA", {
    timeZone: "Asia/Dhaka",
  })

const getSaleDistribution = (sale) => {
  const explicitCash = Number(sale.paymentDistribution?.cash || 0)
  const explicitBank = Number(sale.paymentDistribution?.bank || 0)
  if (explicitCash > 0 || explicitBank > 0) return { cash: explicitCash, bank: explicitBank }
  const method = String(sale.paymentMethod || "").toLowerCase()
  if (["cash", "check"].includes(method)) return { cash: Number(sale.totalAmount || 0), bank: 0 }
  return { cash: 0, bank: Number(sale.totalAmount || 0) }
}

export const getMonthlyReport = async (req, res) => {
  try {
    const { month, paymentType, shopId } = req.query
    const { start, end } = getMonthRange(month)
    const shop = await getShopIdForUser(req.user.id, req.user.role, shopId)
    if (!shop && req.user.role !== "super_admin") {
      return res.status(400).json({ message: "Shop not found for this user" })
    }

    const saleQuery = { paymentStatus: "completed", createdAt: { $gte: start, $lte: end } }
    if (shop) saleQuery.shop = shop
    const sales = await Sale.find(saleQuery).lean()

    const productIds = [...new Set(sales.flatMap((sale) => sale.items.map((item) => item.product?.toString()).filter(Boolean)))]
    const products = await Product.find({ _id: { $in: productIds } }).select("_id costPrice").lean()
    const productCostMap = new Map(products.map((p) => [p._id.toString(), p.costPrice || 0]))

    let totalRevenue = 0
    let totalCostPrice = 0
    let cashRevenue = 0
    let bankRevenue = 0
    const dailyMap = {}

    for (const sale of sales) {
      const { cash, bank } = getSaleDistribution(sale)
      if (paymentType === "cash" && cash <= 0) continue
      if (paymentType === "bank" && bank <= 0) continue

      const saleDay = getDateKey(sale.createdAt)
      totalRevenue += sale.totalAmount || 0
      cashRevenue += cash
      bankRevenue += bank

      if (!dailyMap[saleDay]) {
        dailyMap[saleDay] = { date: saleDay, revenue: 0, costPrice: 0, profit: 0, expenses: 0, netBalance: 0, cashAmount: 0, bankAmount: 0 }
      }
      dailyMap[saleDay].revenue += sale.totalAmount || 0
      dailyMap[saleDay].cashAmount += cash
      dailyMap[saleDay].bankAmount += bank

      for (const item of sale.items) {
        const itemCost = (productCostMap.get(item.product.toString()) || 0) * item.quantity
        totalCostPrice += itemCost
        dailyMap[saleDay].costPrice += itemCost
      }
    }

    const costQuery = { date: { $gte: start, $lte: end } }
    if (shop) costQuery.shop = shop
    const monthlyCosts = await DailyCost.find(costQuery).lean()
    const totalExpenses = monthlyCosts.reduce((sum, c) => sum + (c.amount || 0), 0)

    for (const c of monthlyCosts) {
      const day = getDateKey(c.date)
      if (!dailyMap[day]) {
        dailyMap[day] = { date: day, revenue: 0, costPrice: 0, profit: 0, expenses: 0, netBalance: 0, cashAmount: 0, bankAmount: 0 }
      }
      dailyMap[day].expenses += c.amount || 0
    }

    const totalProfit = totalRevenue - totalCostPrice
    const netBalance = totalProfit - totalExpenses

    const dailySummary = Object.values(dailyMap)
      .map((day) => {
        day.profit = Number((day.revenue - day.costPrice).toFixed(2))
        day.netBalance = Number((day.profit - day.expenses).toFixed(2))
        day.revenue = Number(day.revenue.toFixed(2))
        day.costPrice = Number(day.costPrice.toFixed(2))
        day.expenses = Number(day.expenses.toFixed(2))
        day.cashAmount = Number(day.cashAmount.toFixed(2))
        day.bankAmount = Number(day.bankAmount.toFixed(2))
        return day
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    res.json({
      month: start.toISOString().slice(0, 7),
      paymentType: paymentType || "all",
      totals: {
        revenue: Number(totalRevenue.toFixed(2)),
        costPrice: Number(totalCostPrice.toFixed(2)),
        profit: Number(totalProfit.toFixed(2)),
        expenses: Number(totalExpenses.toFixed(2)),
        netBalance: Number(netBalance.toFixed(2)),
        cashRevenue: Number(cashRevenue.toFixed(2)),
        bankRevenue: Number(bankRevenue.toFixed(2)),
      },
      dailySummary,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
