import DailyCost from "../models/DailyCost.js"
import Sale from "../models/Sale.js"
import Product from "../models/Product.js"
import Shop from "../models/Shop.js"
import Category from "../models/Category.js"
import { assertTenantAccess, buildTenantQuery, resolveTenantShopId } from "../utils/tenant.js"

const getDayRange = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date()
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return { start, end }
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

const getShopMeta = async (shopId) => {
  const shop = await Shop.findById(shopId).select("name shopType mainShop owner adminOwner")
  if (!shop) return null
  return {
    shop,
    mainShop: shop.shopType === "branch" ? shop.mainShop : shop._id,
    adminOwner: shop.adminOwner || shop.owner,
  }
}

const validateCategoryForShop = async (categoryId, shopId) => {
  if (!categoryId) return false
  const category = await Category.findById(categoryId).select("shop branchShops visibleToAllBranches isActive")
  if (!category || !category.isActive) return false
  return (
    category.shop?.toString() === shopId?.toString() ||
    category.visibleToAllBranches ||
    category.branchShops?.some((branchId) => branchId?.toString() === shopId?.toString())
  )
}

const calculateSummary = async ({ query, start, end }) => {
  const salesQuery = { paymentStatus: "completed", createdAt: { $gte: start, $lte: end } }
  if (query.shop !== undefined) salesQuery.shop = query.shop

  const [costs, sales] = await Promise.all([
    DailyCost.find(query).populate("shop", "name shopType mainShop").populate("category", "name type").sort({ date: -1, createdAt: -1 }).lean(),
    Sale.find(salesQuery).populate("shop", "name shopType mainShop").lean(),
  ])

  const productIds = [...new Set(sales.flatMap((sale) => sale.items.map((item) => item.product?.toString()).filter(Boolean)))]
  const products = await Product.find({ _id: { $in: productIds } }).select("_id costPrice").lean()
  const productCostMap = new Map(products.map((p) => [p._id.toString(), p.costPrice || 0]))

  const branchMap = new Map()
  const ensureBranch = (shop) => {
    const id = (shop?._id || shop)?.toString()
    if (!id) return null
    if (!branchMap.has(id)) {
      branchMap.set(id, {
        shop: shop?._id || shop,
        shopName: shop?.name || "Shop",
        totalSalesRevenue: 0,
        totalCostPrice: 0,
        totalDailyCost: 0,
        grossProfit: 0,
        netProfitLoss: 0,
        entriesCount: 0,
        salesCount: 0,
      })
    }
    return branchMap.get(id)
  }

  let totalSalesRevenue = 0
  let totalCostPrice = 0
  for (const sale of sales) {
    const branch = ensureBranch(sale.shop)
    const saleTotal = Number(sale.totalAmount || 0)
    totalSalesRevenue += saleTotal
    if (branch) {
      branch.totalSalesRevenue += saleTotal
      branch.salesCount += 1
    }

    for (const item of sale.items) {
      const unitCost = productCostMap.get(item.product?.toString()) || 0
      const itemCost = unitCost * Number(item.quantity || 0)
      totalCostPrice += itemCost
      if (branch) branch.totalCostPrice += itemCost
    }
  }

  const totalDailyCost = costs.reduce((sum, cost) => {
    const branch = ensureBranch(cost.shop)
    const amount = Number(cost.amount || 0)
    if (branch) {
      branch.totalDailyCost += amount
      branch.entriesCount += 1
    }
    return sum + amount
  }, 0)

  for (const branch of branchMap.values()) {
    branch.grossProfit = Number((branch.totalSalesRevenue - branch.totalCostPrice).toFixed(2))
    branch.netProfitLoss = Number((branch.grossProfit - branch.totalDailyCost).toFixed(2))
    branch.totalSalesRevenue = Number(branch.totalSalesRevenue.toFixed(2))
    branch.totalCostPrice = Number(branch.totalCostPrice.toFixed(2))
    branch.totalDailyCost = Number(branch.totalDailyCost.toFixed(2))
  }

  const grossProfit = totalSalesRevenue - totalCostPrice
  const netProfitLoss = grossProfit - totalDailyCost

  return {
    entries: costs,
    totalDailyCost: Number(totalDailyCost.toFixed(2)),
    totalSalesRevenue: Number(totalSalesRevenue.toFixed(2)),
    totalCostPrice: Number(totalCostPrice.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    netProfitLoss: Number(netProfitLoss.toFixed(2)),
    branchBreakdown: [...branchMap.values()].sort((a, b) => a.shopName.localeCompare(b.shopName)),
  }
}

export const createCostToday = async (req, res) => {
  try {
    const { title, amount, date, shopId, category, type = "general" } = req.body
    if (!title || amount === undefined || Number(amount) < 0) {
      return res.status(400).json({ message: "Title and valid amount are required" })
    }
    if (!category) {
      return res.status(400).json({ message: "Cost category is required" })
    }

    const resolved = await resolveTenantShopId(req, shopId)
    if (!resolved.shopId) return res.status(403).json({ message: "Shop not found or access denied" })

    const meta = await getShopMeta(resolved.shopId)
    if (!meta) return res.status(404).json({ message: "Shop not found" })
    if (!(await validateCategoryForShop(category, resolved.shopId))) {
      return res.status(400).json({ message: "Category is not available for this shop" })
    }

    const { start } = getDayRange(date)
    const cost = await DailyCost.create({
      shop: resolved.shopId,
      mainShop: meta.mainShop,
      adminOwner: meta.adminOwner,
      title,
      amount: Number(amount),
      date: start,
      category,
      type,
      createdBy: req.user.id,
    })
    await cost.populate(["shop", "category"])
    res.status(201).json(cost)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getCostToday = async (req, res) => {
  try {
    const { date, shopId, category, type } = req.query
    const { start, end } = getDayRange(date)
    const base = { date: { $gte: start, $lte: end } }
    if (category) base.category = category
    if (type && type !== "all") base.type = type

    const tenant = await buildTenantQuery(req, shopId, base)
    const summary = await calculateSummary({ query: tenant.query, start, end })

    res.json({ date: start, ...summary })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getCosts = async (req, res) => {
  try {
    const { date, startDate, endDate, shopId, category, type } = req.query
    const { start, end } = getDateRange({ date, startDate, endDate })
    const base = { date: { $gte: start, $lte: end } }
    if (category) base.category = category
    if (type && type !== "all") base.type = type

    const tenant = await buildTenantQuery(req, shopId, base)
    const summary = await calculateSummary({ query: tenant.query, start, end })

    res.json({
      ...summary,
      totalAmount: summary.totalDailyCost,
      count: summary.entries.length,
      range: { start, end },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateCost = async (req, res) => {
  try {
    const { title, amount, date, category, type } = req.body
    const cost = await DailyCost.findById(req.params.id)
    if (!cost) return res.status(404).json({ message: "Cost entry not found" })

    const { tenant } = await resolveTenantShopId(req, cost.shop, { required: false })
    if (!assertTenantAccess(cost.shop, tenant)) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (category !== undefined && !category) {
      return res.status(400).json({ message: "Cost category is required" })
    }

    if (category !== undefined && !(await validateCategoryForShop(category, cost.shop))) {
      return res.status(400).json({ message: "Category is not available for this shop" })
    }

    if (title !== undefined) cost.title = title
    if (amount !== undefined) {
      if (Number(amount) < 0) return res.status(400).json({ message: "Amount must be non-negative" })
      cost.amount = Number(amount)
    }
    if (date) cost.date = getDayRange(date).start
    if (category !== undefined) cost.category = category
    if (type !== undefined) cost.type = type || "general"

    await cost.save()
    await cost.populate(["shop", "category"])
    res.json(cost)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
