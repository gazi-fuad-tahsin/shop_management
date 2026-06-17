import Sale from "../models/Sale.js"
import User from "../models/User.js"
import Product from "../models/Product.js"
import Inventory from "../models/Inventory.js"
import { buildTenantQuery, getUserTenant } from "../utils/tenant.js"

export const getDashboardStats = async (req, res) => {
  try {
    const { shopId } = req.query
    const { query: shopFilter } = await buildTenantQuery(req, shopId)

    const totalSalesData = await Sale.aggregate([
      { $match: shopFilter },
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ])

    const totalSales = totalSalesData[0]?.totalAmount || 0
    const transactionCount = totalSalesData[0]?.count || 0
    const productsCount = await Product.countDocuments(shopFilter)
    const inventoryData = await Inventory.aggregate([
      { $match: shopFilter },
      { $lookup: { from: "products", localField: "product", foreignField: "_id", as: "productInfo" } },
      { $unwind: "$productInfo" },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ["$quantity", "$productInfo.costPrice"] } } } },
    ])
    const inventoryValue = inventoryData[0]?.totalValue || 0
    const lowStockItems = await Inventory.countDocuments({ ...shopFilter, $expr: { $lte: ["$quantity", "$reorderLevel"] } })

    res.json({
      totalSales: Math.round(totalSales),
      transactions: transactionCount,
      productsCount,
      inventoryValue: Math.round(inventoryValue),
      lowStockItems,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getShopWiseStats = async (req, res) => {
  try {
    const shopStats = await Sale.aggregate([
      { $group: { _id: "$shop", totalSales: { $sum: "$totalAmount" }, count: { $sum: 1 }, avgTransaction: { $avg: "$totalAmount" } } },
      { $lookup: { from: "shops", localField: "_id", foreignField: "_id", as: "shopInfo" } },
      { $unwind: "$shopInfo" },
      { $project: { _id: 1, shopName: "$shopInfo.name", totalSales: 1, count: 1, avgTransaction: { $round: ["$avgTransaction", 2] } } },
      { $sort: { totalSales: -1 } },
    ])
    res.json(shopStats)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getCategorySales = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const shopFilter = tenant.isGlobal ? {} : { shop: tenant.shopId }

    const categorySales = await Sale.aggregate([
      { $match: shopFilter },
      { $unwind: "$items" },
      { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "productInfo" } },
      { $unwind: "$productInfo" },
      { $lookup: { from: "categories", localField: "productInfo.category", foreignField: "_id", as: "categoryInfo" } },
      { $unwind: "$categoryInfo" },
      { $group: { _id: "$categoryInfo._id", categoryName: { $first: "$categoryInfo.name" }, totalSales: { $sum: "$items.subtotal" }, quantity: { $sum: "$items.quantity" } } },
      { $project: { _id: 0, name: "$categoryName", value: { $round: ["$totalSales", 2] }, quantity: 1 } },
      { $sort: { value: -1 } },
    ])

    res.json(categorySales)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getRevenueByShop = async (req, res) => {
  try {
    const revenueByShop = await Sale.aggregate([
      { $group: { _id: "$shop", revenue: { $sum: "$totalAmount" } } },
      { $lookup: { from: "shops", localField: "_id", foreignField: "_id", as: "shopInfo" } },
      { $unwind: "$shopInfo" },
      { $project: { _id: 0, name: "$shopInfo.name", value: { $round: ["$revenue", 2] } } },
      { $sort: { value: -1 } },
    ])
    res.json(revenueByShop)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
