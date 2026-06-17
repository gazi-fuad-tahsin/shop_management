import Inventory from "../models/Inventory.js"
import User from "../models/User.js"
import Product from "../models/Product.js"
import { assertTenantAccess, buildTenantQuery, getUserTenant } from "../utils/tenant.js"

export const getInventory = async (req, res) => {
  try {
    const { shopId } = req.query
    const { query } = await buildTenantQuery(req, shopId)

    const inventory = await Inventory.find(query).populate("product").populate("shop", "name")
    res.json(inventory)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getInventoryByProduct = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const product = await Product.findById(req.params.productId)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (!assertTenantAccess(product.shop, tenant)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const inventory = await Inventory.findOne({ product: req.params.productId, shop: product.shop }).populate("product").populate("shop", "name")
    res.json(inventory)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" })
    }

    const tenant = await getUserTenant(req)
    if (!assertTenantAccess(inventory.shop, tenant)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const updates = { ...req.body }
    delete updates.shop
    delete updates.product
    const updated = await Inventory.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("product")
      .populate("shop", "name")

    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createInventory = async (req, res) => {
  try {
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

    const product = await Product.findById(req.body.product)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
    if (product.shop.toString() !== shopId.toString()) {
      return res.status(403).json({ message: "Product does not belong to your shop" })
    }

    const existing = await Inventory.findOne({ shop: shopId, product: req.body.product })
    if (existing) {
      const count = existing.quantity + req.body.quantity
      existing.quantity = count
      await existing.save()
      await existing.populate(["product", "shop"])
      return res.status(200).json(existing)
    }

    const inventory = new Inventory({
      ...req.body,
      shop: shopId,
    })

    await inventory.save()
    await inventory.populate(["product", "shop"])

    res.status(201).json(inventory)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}
