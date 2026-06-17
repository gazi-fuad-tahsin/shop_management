import DailyCost from "../models/DailyCost.js"
import Sale from "../models/Sale.js"
import Product from "../models/Product.js"
import User from "../models/User.js"

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

const getDateRange = ({ date, startDate, endDate }) => {
  if (date) return getDayRange(date)
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : new Date(0)
    const end = endDate ? new Date(endDate) : new Date()
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  return getDayRange()
}

export const createCostToday = async (req, res) => {
  try {
    const { title, amount, date, shopId } = req.body
    if (!title || amount === undefined || Number(amount) < 0) {
      return res.status(400).json({ message: "Title and valid amount are required" })
    }
    const shop = await getShopIdForUser(req.user.id, req.user.role, shopId)
    if (!shop) return res.status(400).json({ message: "Shop not found for this user" })
    const { start } = getDayRange(date)
    const cost = await DailyCost.create({ shop, title, amount: Number(amount), date: start, createdBy: req.user.id })
    res.status(201).json(cost)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getCostToday = async (req, res) => {
  try {
    const { date, shopId } = req.query
    const { start, end } = getDayRange(date)
    const shop = await getShopIdForUser(req.user.id, req.user.role, shopId)
    if (!shop) return res.status(400).json({ message: "Shop not found for this user" })

    const costs = await DailyCost.find({ shop, date: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).lean()
    const totalDailyCost = costs.reduce((sum, c) => sum + (c.amount || 0), 0)

    const sales = await Sale.find({ shop, paymentStatus: "completed", createdAt: { $gte: start, $lte: end } }).lean()
    const productIds = [...new Set(sales.flatMap((sale) => sale.items.map((item) => item.product?.toString()).filter(Boolean)))]
    const products = await Product.find({ _id: { $in: productIds } }).select("_id costPrice").lean()
    const productCostMap = new Map(products.map((p) => [p._id.toString(), p.costPrice || 0]))

    let totalSalesRevenue = 0
    let totalCostPrice = 0
    for (const sale of sales) {
      totalSalesRevenue += sale.totalAmount || 0
      for (const item of sale.items) {
        const unitCost = productCostMap.get(item.product.toString()) || 0
        totalCostPrice += unitCost * item.quantity
      }
    }

    const grossProfit = totalSalesRevenue - totalCostPrice
    const netProfitLoss = grossProfit - totalDailyCost

    res.json({
      date: start,
      entries: costs,
      totalDailyCost: Number(totalDailyCost.toFixed(2)),
      totalSalesRevenue: Number(totalSalesRevenue.toFixed(2)),
      totalCostPrice: Number(totalCostPrice.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      netProfitLoss: Number(netProfitLoss.toFixed(2)),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getCosts = async (req, res) => {
  try {
    const { date, startDate, endDate, shopId } = req.query
    const { start, end } = getDateRange({ date, startDate, endDate })
    const user = await User.findById(req.user.id).select("shop role")
    const query = { date: { $gte: start, $lte: end } }

    if (user.role === "super_admin") {
      if (shopId) query.shop = shopId
    } else {
      if (!user.shop) return res.status(400).json({ message: "Shop not found for this user" })
      query.shop = user.shop
    }

    const costs = await DailyCost.find(query).populate("shop", "name").sort({ date: -1, createdAt: -1 }).lean()
    const totalAmount = costs.reduce((sum, c) => sum + (c.amount || 0), 0)
    res.json({ entries: costs, totalAmount: Number(totalAmount.toFixed(2)), count: costs.length, range: { start, end } })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateCost = async (req, res) => {
  try {
    const { title, amount, date } = req.body
    const cost = await DailyCost.findById(req.params.id)
    if (!cost) return res.status(404).json({ message: "Cost entry not found" })

    const user = await User.findById(req.user.id).select("shop role")
    if (user.role !== "super_admin" && cost.shop.toString() !== user.shop?.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (title !== undefined) cost.title = title
    if (amount !== undefined) {
      if (Number(amount) < 0) return res.status(400).json({ message: "Amount must be non-negative" })
      cost.amount = Number(amount)
    }
    if (date) cost.date = getDayRange(date).start

    await cost.save()
    await cost.populate("shop", "name")
    res.json(cost)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
