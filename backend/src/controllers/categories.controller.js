import Category from "../models/Category.js"
import User from "../models/User.js"
import { assertTenantAccess, buildTenantQuery, getUserTenant } from "../utils/tenant.js"

export const getCategories = async (req, res) => {
  try {
    const { shopId } = req.query
    const { query } = await buildTenantQuery(req, shopId, { isActive: true })
    const categories = await Category.find(query).populate("parent").populate("shop", "name")
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createCategory = async (req, res) => {
  try {
    const { name, description, parent } = req.body
    const tenant = await getUserTenant(req)

    if (!tenant.isGlobal && !tenant.shopId) {
      return res.status(400).json({ message: "You must be assigned to a shop" })
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

    if (!name) {
      return res.status(400).json({ message: "Category name is required" })
    }

    if (await Category.findOne({ shop: shopId, name })) {
      return res.status(409).json({ message: "Category already exists for this shop" })
    }

    const category = new Category({ shop: shopId, name, description, parent })
    await category.save()
    await category.populate(["parent", "shop"])
    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateCategory = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    if (!assertTenantAccess(category.shop, tenant)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const updates = { ...req.body }
    delete updates.shop
    const updated = await Category.findByIdAndUpdate(req.params.id, updates, { new: true }).populate([
      "parent",
      "shop",
    ])

    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
