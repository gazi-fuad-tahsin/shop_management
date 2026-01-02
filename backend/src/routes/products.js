import express from "express"
import Product from "../models/Product.js"
import { verifyToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

// Get all products with pagination
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category } = req.query
    const skip = (page - 1) * limit

    const query = { isActive: true }
    if (search) {
      query.$or = [{ name: new RegExp(search, "i") }, { sku: new RegExp(search, "i") }, { barcode: search }]
    }
    if (category) {
      query.category = category
    }

    const products = await Product.find(query)
      // .populate("supplier", "name phone email")
      .populate("category")
      .populate("createdBy", "name email")
      .skip(skip)
      .limit(limit)

    const total = await Product.countDocuments(query)

    res.json({ products, total, page, pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get product by barcode (for POS)
router.get("/barcode/:barcode", async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode, isActive: true })
      // .populate("supplier", "name")
      .populate("category", "name")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("supplier")
      .populate("category")
      .populate("createdBy")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create product (admin/manager only)
router.post("/", verifyToken, authorizeRole(["admin", "manager"]), async (req, res) => {
  try {
    const {
      name,
      sku,
      barcode,
      description,
      category,
      supplier,
      costPrice,
      retailPrice,
      wholesalePrice,
      color,
      specifications,
      warranty,
      weight,
      dimensions,
      images,
      manufacturer,
      unit,
      batchTrackingEnabled,
      expiryTrackingEnabled,
      minStock,
      maxStock,
    } = req.body

    // Validate required fields
    if (!name || !sku || !category || !costPrice || !retailPrice) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    // Check if SKU or barcode already exists
    if (await Product.findOne({ sku })) {
      return res.status(409).json({ message: "SKU already exists" })
    }
    if (barcode && (await Product.findOne({ barcode }))) {
      return res.status(409).json({ message: "Barcode already exists" })
    }

    const product = new Product({
      name,
      sku,
      barcode,
      description,
      category,
      supplier,
      costPrice,
      retailPrice,
      wholesalePrice,
      color,
      specifications,
      // warranty,
      weight,
      dimensions,
      images,
      manufacturer,
      unit,
      batchTrackingEnabled,
      expiryTrackingEnabled,
      minStock,
      maxStock,
      createdBy: req.user.id,
    })

    await product.save()
    await product.populate("category createdBy")

    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update product
router.put("/:id", verifyToken, authorizeRole(["admin", "manager"]), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
      "supplier category createdBy",
    )

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delete product (soft delete)
router.delete("/:id", verifyToken, authorizeRole(["admin", "manager"]), async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false })
    res.json({ message: "Product deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
