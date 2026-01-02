import express from "express"
import Sale from "../models/Sale.js"
import Product from "../models/Product.js"
import Inventory from "../models/Inventory.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Get all sales with pagination
router.get("/", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const sales = await Sale.find(query)
      .populate("items.product", "name barcode")
      .populate("customer", "name phone")
      .populate("soldBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Sale.countDocuments(query)

    res.json({ sales, total, page, pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get sales by date range
router.get("/range", async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const sales = await Sale.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .populate("items.product")
      .populate("soldBy")
    res.json(sales)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create sale with barcode lookup
router.post("/", verifyToken, async (req, res) => {
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
      paymentStatus = "completed",
      saleType = "retail",
      notes,
      isOfflineSync,
    } = req.body

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Sale must have at least one item" })
    }

    if (!totalAmount || !paymentMethod) {
      return res.status(400).json({ message: "Total amount and payment method are required" })
    }

    // Generate sale number
    const saleNumber = `SALE-${Date.now()}`

    // Validate and populate product details
    const populatedItems = []
    for (const item of items) {
      let product
      if (item.productId) {
        product = await Product.findById(item.productId)
      } else if (item.barcode) {
        product = await Product.findOne({ barcode: item.barcode })
      }

      if (!product) {
        return res.status(404).json({ message: `Product not found for item: ${item.barcode || item.productId}` })
      }

      // Check inventory
      const inventory = await Inventory.findOne({ product: product._id })
      if (!inventory || inventory.quantity < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${product.name}. Available: ${inventory?.quantity || 0}` })
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
      saleNumber,
      items: populatedItems,
      customer: customerId,
      customerName: customerName || "Walk-in",
      customerPhone,
      totalAmount,
      taxAmount,
      discountAmount,
      paymentMethod,
      paymentStatus,
      saleType,
      notes,
      soldBy: req.user.id,
      isOfflineSync,
    })

    await sale.save()

    // Update inventory
    for (const item of populatedItems) {
      await Inventory.findOneAndUpdate({ product: item.product }, { $inc: { quantity: -item.quantity } })
    }

    // Update customer loyalty points and purchases if customer exists
    if (customerId) {
      const Customer = (await import("../models/Customer.js")).default
      await Customer.findByIdAndUpdate(
        customerId,
        {
          $inc: { totalPurchases: 1, totalSpent: totalAmount, loyaltyPoints: Math.floor(totalAmount / 10) },
        },
        { new: true },
      )
    }

    await sale.populate("items.product customer soldBy")

    res.status(201).json(sale)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update sale
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
      "items.product customer soldBy",
    )

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" })
    }

    res.json(sale)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
