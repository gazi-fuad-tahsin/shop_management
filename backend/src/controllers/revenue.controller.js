import Sale from "../models/Sale.js"
import Product from "../models/Product.js"
import PreviousCash from "../models/PreviousCash.js"
import DailyCost from "../models/DailyCost.js"
import { buildTenantQuery, resolveTenantShopId } from "../utils/tenant.js"

const getDayRange = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date()
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

const getSaleDistribution = (sale) => {
  const explicitCash = Number(sale.paymentDistribution?.cash || 0)
  const explicitBank = Number(sale.paymentDistribution?.bank || 0)
  if (explicitCash > 0 || explicitBank > 0) return { cash: explicitCash, bank: explicitBank }
  const method = String(sale.paymentMethod || "").toLowerCase()
  if (["cash", "check"].includes(method)) return { cash: Number(sale.totalAmount || 0), bank: 0 }
  return { cash: 0, bank: Number(sale.totalAmount || 0) }
}

const withShopFilter = (query, shopFilter) => {
  if (shopFilter !== undefined) query.shop = shopFilter
  return query
}

const ensureBranch = (branchMap, shop) => {
  const id = (shop?._id || shop)?.toString()
  if (!id) return null
  if (!branchMap.has(id)) {
    branchMap.set(id, {
      shop: shop?._id || shop,
      shopName: shop?.name || "Shop",
      totalRevenue: 0,
      totalCostPrice: 0,
      totalProfit: 0,
      totalExpenses: 0,
      previousCash: 0,
      totalCashRevenue: 0,
      totalBankRevenue: 0,
      totalCashAmount: 0,
      totalBankAmount: 0,
      grandTotal: 0,
      netRevenue: 0,
      salesCount: 0,
    })
  }
  return branchMap.get(id)
}

export const getTodayRevenue = async (req, res) => {
  try {
    const { date, shopId, paymentType, category, type } = req.query
    const { start, end } = getDayRange(date)
    const tenant = await buildTenantQuery(req, shopId, {})
    const shopFilter = tenant.query.shop

    const [sales, dailyCosts, previousCashEntries] = await Promise.all([
      Sale.find(withShopFilter({ paymentStatus: "completed", createdAt: { $gte: start, $lte: end } }, shopFilter)).populate("shop", "name").lean(),
      DailyCost.find(
        withShopFilter(
          {
            date: { $gte: start, $lte: end },
            ...(category ? { category } : {}),
            ...(type && type !== "all" ? { type } : {}),
          },
          shopFilter,
        ),
      )
        .populate("shop", "name")
        .lean(),
      PreviousCash.find(withShopFilter({ date: { $gte: start, $lte: end } }, shopFilter)).populate("shop", "name").lean(),
    ])

    const productIds = [...new Set(sales.flatMap((sale) => sale.items.map((item) => item.product?.toString()).filter(Boolean)))]
    const products = await Product.find({ _id: { $in: productIds } }).select("_id costPrice").lean()
    const productCostMap = new Map(products.map((p) => [p._id.toString(), p.costPrice || 0]))

    let totalSellingPrice = 0
    let totalCostPrice = 0
    let totalProfit = 0
    let totalCashRevenue = 0
    let totalBankRevenue = 0
    const branchMap = new Map()

    const itemsBreakdown = sales.flatMap((sale) => {
      const branch = ensureBranch(branchMap, sale.shop)
      const { cash, bank } = getSaleDistribution(sale)
      if (paymentType === "cash" && cash <= 0) return []
      if (paymentType === "bank" && bank <= 0) return []

      totalCashRevenue += cash
      totalBankRevenue += bank
      if (branch) {
        branch.totalCashRevenue += cash
        branch.totalBankRevenue += bank
        branch.salesCount += 1
      }

      return sale.items.map((item) => {
        const unitCost = productCostMap.get(item.product?.toString()) || 0
        const itemCost = unitCost * Number(item.quantity || 0)
        const itemSell = Number(item.subtotal || item.unitPrice * item.quantity || 0)
        const itemProfit = itemSell - itemCost

        totalSellingPrice += itemSell
        totalCostPrice += itemCost
        totalProfit += itemProfit
        if (branch) {
          branch.totalRevenue += itemSell
          branch.totalCostPrice += itemCost
          branch.totalProfit += itemProfit
        }

        return {
          productId: item.product,
          productName: item.productName,
          quantity: item.quantity,
          costPrice: Number(itemCost.toFixed(2)),
          sellingPrice: Number(itemSell.toFixed(2)),
          profit: Number(itemProfit.toFixed(2)),
          shop: sale.shop?._id || sale.shop,
        }
      })
    })

    const totalExpenses = dailyCosts.reduce((sum, cost) => {
      const branch = ensureBranch(branchMap, cost.shop)
      const amount = Number(cost.amount || 0)
      if (branch) branch.totalExpenses += amount
      return sum + amount
    }, 0)

    const previousCash = previousCashEntries.reduce((sum, entry) => {
      const branch = ensureBranch(branchMap, entry.shop)
      const amount = Number(entry.amount || 0)
      if (branch) branch.previousCash += amount
      return sum + amount
    }, 0)

    for (const branch of branchMap.values()) {
      branch.totalCashAmount = branch.previousCash + branch.totalCashRevenue
      branch.totalBankAmount = branch.totalBankRevenue
      branch.grandTotal = branch.totalCashAmount + branch.totalBankAmount
      branch.netRevenue = branch.totalProfit - branch.totalExpenses
      for (const key of [
        "totalRevenue",
        "totalCostPrice",
        "totalProfit",
        "totalExpenses",
        "previousCash",
        "totalCashRevenue",
        "totalBankRevenue",
        "totalCashAmount",
        "totalBankAmount",
        "grandTotal",
        "netRevenue",
      ]) {
        branch[key] = Number(branch[key].toFixed(2))
      }
    }

    const totalCashAmount = previousCash + totalCashRevenue
    const grandTotal = totalCashAmount + totalBankRevenue
    const netRevenue = totalProfit - totalExpenses

    res.json({
      date: start,
      totalRevenue: Number(totalSellingPrice.toFixed(2)),
      totalCostPrice: Number(totalCostPrice.toFixed(2)),
      totalSellingPrice: Number(totalSellingPrice.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      netRevenue: Number(netRevenue.toFixed(2)),
      previousCash: Number(previousCash.toFixed(2)),
      totalCashRevenue: Number(totalCashRevenue.toFixed(2)),
      totalBankRevenue: Number(totalBankRevenue.toFixed(2)),
      totalCashAmount: Number(totalCashAmount.toFixed(2)),
      totalBankAmount: Number(totalBankRevenue.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      salesCount: sales.length,
      itemsBreakdown,
      branchBreakdown: [...branchMap.values()].sort((a, b) => a.shopName.localeCompare(b.shopName)),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const addPreviousCash = async (req, res) => {
  try {
    const { amount, date, note, shopId } = req.body
    if (amount === undefined || Number(amount) < 0) {
      return res.status(400).json({ message: "Valid amount is required" })
    }

    const { shopId: resolvedShopId } = await resolveTenantShopId(req, shopId)
    if (!resolvedShopId) return res.status(403).json({ message: "Shop not found or access denied" })

    const { start } = getDayRange(date)
    const entry = await PreviousCash.create({ shop: resolvedShopId, amount: Number(amount), date: start, note, createdBy: req.user.id })
    await entry.populate("shop", "name")
    res.status(201).json(entry)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
