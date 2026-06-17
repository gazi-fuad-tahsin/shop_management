import Product from "../models/Product.js"
import User from "../models/User.js"
import Category from "../models/Category.js"
import { assertTenantAccess, buildTenantQuery, getUserTenant } from "../utils/tenant.js"

export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category, shopId } = req.query
    const skip = (page - 1) * limit

    const tenant = await buildTenantQuery(req, shopId, { isActive: true })
    if (!tenant.isGlobal && !tenant.shopId) {
      return res.status(403).json({ message: "You don't have a shop assigned" })
    }

    const query = tenant.query

    if (search) {
      query.$or = [{ name: new RegExp(search, "i") }, { sku: new RegExp(search, "i") }, { barcode: search }]
    }
    if (category) {
      query.category = category
    }

    const products = await Product.find(query)
      .populate("category")
      .populate("shop", "name")
      .populate("createdBy", "name email")
      .skip(skip)
      .limit(limit)

    const total = await Product.countDocuments(query)

    res.json({ products, total, page, pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getProductByBarcode = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)

    const query = { barcode: req.params.barcode, isActive: true }
    if (!tenant.isGlobal) {
      query.shop = tenant.shopId
    }

    const product = await Product.findOne(query).populate("category", "name").populate("shop", "name")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getProductById = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)

    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("shop", "name")
      .populate("createdBy", "name email")

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (!assertTenantAccess(product.shop, tenant)) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createProduct = async (req, res) => {
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

    if (!name || !sku || !category || !costPrice || !retailPrice) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    const tenant = await getUserTenant(req)
    if (!tenant.isGlobal && !tenant.shopId) {
      return res.status(400).json({ message: "You must be assigned to a shop first" })
    }

    const requestedShop = req.body.shop
    const shopId = tenant.isGlobal
      ? requestedShop
      : requestedShop && tenant.accessibleShopIds?.some((id) => id?.toString() === requestedShop.toString())
        ? requestedShop
        : tenant.shopId
    if (!shopId) {
      return res.status(400).json({ message: "Shop is required" })
    }

    const categoryDoc = await Category.findById(category)
    if (!categoryDoc || categoryDoc.shop.toString() !== shopId.toString()) {
      return res.status(400).json({ message: "Category does not belong to this shop" })
    }

    if (await Product.findOne({ shop: shopId, sku })) {
      return res.status(409).json({ message: "SKU already exists for this shop" })
    }
    if (barcode && (await Product.findOne({ shop: shopId, barcode }))) {
      return res.status(409).json({ message: "Barcode already exists for this shop" })
    }

    const product = new Product({
      shop: shopId,
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
    await product.populate(["category", "createdBy", "shop"])

    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const tenant = await getUserTenant(req)
    if (!assertTenantAccess(product.shop, tenant)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const updates = { ...req.body }
    delete updates.shop
    if (updates.category) {
      const categoryDoc = await Category.findById(updates.category)
      if (!categoryDoc || categoryDoc.shop.toString() !== product.shop.toString()) {
        return res.status(400).json({ message: "Category does not belong to this shop" })
      }
    }

    Object.assign(product, updates)
    await product.save()
    await product.populate("category createdBy shop")

    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: "Product not found" })
    const tenant = await getUserTenant(req)
    if (!assertTenantAccess(product.shop, tenant)) {
      return res.status(403).json({ message: "Access denied" })
    }
    product.isActive = false
    await product.save()
    res.json({ message: "Product deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
