import Sale from "../models/Sale.js"
import Product from "../models/Product.js"
import Inventory from "../models/Inventory.js"
import User from "../models/User.js"
import { assertTenantAccess, buildTenantQuery, getUserTenant } from "../utils/tenant.js"

export const getSales = async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, shopId } = req.query
    const skip = (page - 1) * limit
    const { query } = await buildTenantQuery(req, shopId)

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const sales = await Sale.find(query)
      .populate("items.product", "name barcode")
      .populate("customer", "name phone")
      .populate("shop", "name")
      .populate("soldBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Sale.countDocuments(query)
    res.json({ sales, total, page, pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getSalesRange = async (req, res) => {
  try {
    const { startDate, endDate, shopId } = req.query
    const tenant = await buildTenantQuery(req, shopId, { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } })
    const query = tenant.query

    const sales = await Sale.find(query).populate("items.product").populate("soldBy").populate("shop", "name")
    res.json(sales)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createSale = async (req, res) => {
  try {
    const {
      items,
      customerId,
      customerName,
      customerPhone,
      totalAmount,
      taxAmount,
      discountAmount,
      paymentMethod,
      paymentDistribution,
      paymentStatus = "completed",
      saleType = "retail",
      notes,
      isOfflineSync,
    } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Sale must have at least one item" })
    }

    if (!totalAmount || !paymentMethod) {
      return res.status(400).json({ message: "Total amount and payment method are required" })
    }

    if (paymentDistribution && (paymentDistribution.cash !== undefined || paymentDistribution.bank !== undefined)) {
      const cash = Number(paymentDistribution.cash || 0)
      const bank = Number(paymentDistribution.bank || 0)
      const diff = Math.abs(cash + bank - Number(totalAmount))
      if (diff > 0.01) {
        return res.status(400).json({ message: "Cash and bank distribution must match total amount" })
      }
    }

    const tenant = await getUserTenant(req)
    if (tenant.isGlobal) {
      return res.status(400).json({ message: "Super admin must create sales through a shop account" })
    }
    if (!tenant.shopId) {
      return res.status(400).json({ message: "You must be assigned to a shop" })
    }

    const saleNumber = `SALE-${Date.now()}`
    const populatedItems = []

    for (const item of items) {
      let product
      if (item.productId) product = await Product.findById(item.productId)
      else if (item.barcode) product = await Product.findOne({ barcode: item.barcode, shop: tenant.shopId })

      if (!product) {
        return res.status(404).json({ message: `Product not found for item: ${item.barcode || item.productId}` })
      }
      if (product.shop.toString() !== tenant.shopId.toString()) {
        return res.status(403).json({ message: `Product ${product.name} does not belong to your shop` })
      }

      const inventory = await Inventory.findOne({ product: product._id, shop: tenant.shopId })
      if (!inventory || inventory.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${inventory?.quantity || 0}` })
      }

      populatedItems.push({
        product: product._id,
        productName: product.name,
        barcode: product.barcode,
        quantity: item.quantity,
        unitPrice: item.unitPrice || product.retailPrice,
        discount: item.discount || 0,
        subtotal: item.subtotal || (item.quantity || 1) * (item.unitPrice || product.retailPrice),
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
      })
    }

    const sale = new Sale({
      shop: tenant.shopId,
      saleNumber,
      items: populatedItems,
      customer: customerId,
      customerName: customerName || "Walk-in",
      customerPhone,
      totalAmount,
      taxAmount,
      discountAmount,
      paymentMethod,
      paymentDistribution:
        paymentDistribution && (paymentDistribution.cash !== undefined || paymentDistribution.bank !== undefined)
          ? { cash: Number(paymentDistribution.cash || 0), bank: Number(paymentDistribution.bank || 0) }
          : paymentMethod === "cash"
            ? { cash: Number(totalAmount), bank: 0 }
            : { cash: 0, bank: Number(totalAmount) },
      paymentStatus,
      saleType,
      notes,
      soldBy: req.user.id,
      isOfflineSync,
    })

    await sale.save()

    for (const item of populatedItems) {
      await Inventory.findOneAndUpdate({ product: item.product, shop: tenant.shopId }, { $inc: { quantity: -item.quantity } })
    }

    if (customerId) {
      const Customer = (await import("../models/Customer.js")).default
      await Customer.findByIdAndUpdate(
        customerId,
        { $inc: { totalPurchases: 1, totalSpent: totalAmount, loyaltyPoints: Math.floor(totalAmount / 10) } },
        { new: true },
      )
    }

    await sale.populate(["items.product", "customer", "soldBy", "shop"])
    res.status(201).json(sale)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
    if (!sale) return res.status(404).json({ message: "Sale not found" })
    const tenant = await getUserTenant(req)
    if (!assertTenantAccess(sale.shop, tenant)) {
      return res.status(403).json({ message: "Access denied" })
    }
    const updates = { ...req.body }
    delete updates.shop
    const updatedSale = await Sale.findByIdAndUpdate(req.params.id, updates, { new: true }).populate("items.product customer soldBy")
    res.json(updatedSale)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
