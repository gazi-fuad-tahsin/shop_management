import Sale from "../models/Sale.js"
import Product from "../models/Product.js"
import User from "../models/User.js"
import PreviousCash from "../models/PreviousCash.js"
import { getUserTenant } from "../utils/tenant.js"

const getDayRange = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date()
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

const getShopIdForUser = async (userId, role, shopParam) => {
  if (role === "super_admin" && shopParam) return shopParam
  const user = await User.findById(userId).select("shop")
  return user?.shop
}

const getSaleDistribution = (sale) => {
  const explicitCash = Number(sale.paymentDistribution?.cash || 0)
  const explicitBank = Number(sale.paymentDistribution?.bank || 0)
  if (explicitCash > 0 || explicitBank > 0) return { cash: explicitCash, bank: explicitBank }
  const method = String(sale.paymentMethod || "").toLowerCase()
  if (["cash", "check"].includes(method)) return { cash: Number(sale.totalAmount || 0), bank: 0 }
  return { cash: 0, bank: Number(sale.totalAmount || 0) }
}

export const getTodayRevenue = async (req, res) => {
  try {
    const { date, shopId, paymentType } = req.query
    const { start, end } = getDayRange(date)
    const shop = await getShopIdForUser(req.user.id, req.user.role, shopId)
    if (!shop) return res.status(400).json({ message: "Shop not found for this user" })

    const sales = await Sale.find({ shop, paymentStatus: "completed", createdAt: { $gte: start, $lte: end } }).lean()
    const productIds = [...new Set(sales.flatMap((sale) => sale.items.map((item) => item.product?.toString()).filter(Boolean)))]
    const products = await Product.find({ _id: { $in: productIds } }).select("_id costPrice").lean()
    const productCostMap = new Map(products.map((p) => [p._id.toString(), p.costPrice || 0]))

    let totalSellingPrice = 0
    let totalCostPrice = 0
    let totalProfit = 0
    let totalCashRevenue = 0
    let totalBankRevenue = 0

    const itemsBreakdown = sales.flatMap((sale) =>
      sale.items.map((item) => {
        const unitCost = productCostMap.get(item.product.toString()) || 0
        const itemCost = unitCost * item.quantity
        const itemSell = item.subtotal || item.unitPrice * item.quantity
        const itemProfit = itemSell - itemCost
        totalSellingPrice += itemSell
        totalCostPrice += itemCost
        totalProfit += itemProfit
        return { productId: item.product, productName: item.productName, quantity: item.quantity, costPrice: Number(itemCost.toFixed(2)), sellingPrice: Number(itemSell.toFixed(2)), profit: Number(itemProfit.toFixed(2)) }
      }),
    )

    for (const sale of sales) {
      const { cash, bank } = getSaleDistribution(sale)
      if (paymentType === "cash" && cash <= 0) continue
      if (paymentType === "bank" && bank <= 0) continue
      totalCashRevenue += cash
      totalBankRevenue += bank
    }

    const previousCashAgg = await PreviousCash.aggregate([{ $match: { shop, date: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
    const previousCash = previousCashAgg[0]?.total || 0
    const totalCashAmount = previousCash + totalCashRevenue
    const grandTotal = totalCashAmount + totalBankRevenue

    res.json({
      date: start,
      totalRevenue: Number(totalSellingPrice.toFixed(2)),
      totalCostPrice: Number(totalCostPrice.toFixed(2)),
      totalSellingPrice: Number(totalSellingPrice.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      previousCash: Number(previousCash.toFixed(2)),
      totalCashRevenue: Number(totalCashRevenue.toFixed(2)),
      totalBankRevenue: Number(totalBankRevenue.toFixed(2)),
      totalCashAmount: Number(totalCashAmount.toFixed(2)),
      totalBankAmount: Number(totalBankRevenue.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      salesCount: sales.length,
      itemsBreakdown,
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

    const shop = await getShopIdForUser(req.user.id, req.user.role, shopId)
    if (!shop) return res.status(400).json({ message: "Shop not found for this user" })

    const { start } = getDayRange(date)
    const entry = await PreviousCash.create({ shop, amount: Number(amount), date: start, note, createdBy: req.user.id })
    res.status(201).json(entry)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
