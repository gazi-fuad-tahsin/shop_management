import Category from "../models/Category.js"
import Shop from "../models/Shop.js"
import { assertTenantAccess, canAccessShop, getDefaultShopId, getUserTenant } from "../utils/tenant.js"

const getShopMeta = async (shopId) => {
  const shop = await Shop.findById(shopId).select("shopType mainShop owner adminOwner")
  if (!shop) return null
  return {
    shop,
    mainShop: shop.shopType === "branch" ? shop.mainShop : shop._id,
    adminOwner: shop.adminOwner || shop.owner,
  }
}

const buildCategoryQuery = (tenant, { shopId, type } = {}) => {
  const base = { isActive: true }
  if (type && type !== "all") base.type = type

  if (tenant.isGlobal) {
    if (shopId) base.shop = shopId
    return base
  }

  if (shopId) {
    if (!canAccessShop(tenant, shopId)) return { ...base, shop: "__denied__" }
    return {
      ...base,
      $or: [{ shop: shopId }, { branchShops: shopId }, { visibleToAllBranches: true, mainShop: tenant.mainShopId }],
    }
  }

  return {
    ...base,
    $or: [
      { shop: { $in: tenant.accessibleShopIds } },
      { branchShops: { $in: tenant.accessibleShopIds } },
      { visibleToAllBranches: true, mainShop: tenant.mainShopId },
    ],
  }
}

export const getCategories = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const query = buildCategoryQuery(tenant, req.query)
    const categories = await Category.find(query)
      .populate("parent")
      .populate("shop", "name shopType")
      .populate("mainShop", "name")
      .populate("branchShops", "name")
      .sort({ name: 1 })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createCategory = async (req, res) => {
  try {
    const { name, description, parent, type = "product", visibleToAllBranches = false, branchShops = [] } = req.body
    const tenant = await getUserTenant(req)
    const requestedShop = req.body.shop || req.body.shopId || getDefaultShopId(tenant)

    if (!requestedShop || (!tenant.isGlobal && !canAccessShop(tenant, requestedShop))) {
      return res.status(403).json({ message: "Shop not found or access denied" })
    }
    if (!name) {
      return res.status(400).json({ message: "Category name is required" })
    }

    const meta = await getShopMeta(requestedShop)
    if (!meta) return res.status(404).json({ message: "Shop not found" })

    const allowedBranchShops = tenant.isGlobal
      ? branchShops
      : branchShops.filter((id) => canAccessShop(tenant, id))

    if (await Category.findOne({ shop: requestedShop, name, type, isActive: true })) {
      return res.status(409).json({ message: "Category already exists for this shop" })
    }

    const category = new Category({
      shop: requestedShop,
      mainShop: meta.mainShop,
      adminOwner: meta.adminOwner,
      name,
      description,
      parent,
      type,
      visibleToAllBranches: Boolean(visibleToAllBranches),
      branchShops: allowedBranchShops,
    })
    await category.save()
    await category.populate(["parent", "shop", "mainShop", "branchShops"])
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

    if (!assertTenantAccess(category.shop, tenant) && !tenant.isGlobal) {
      return res.status(403).json({ message: "Access denied" })
    }

    const updates = { ...req.body }
    delete updates.shop
    delete updates.mainShop
    delete updates.adminOwner

    if (updates.branchShops && !tenant.isGlobal) {
      updates.branchShops = updates.branchShops.filter((id) => canAccessShop(tenant, id))
    }

    Object.assign(category, updates)
    await category.save()
    await category.populate(["parent", "shop", "mainShop", "branchShops"])

    res.json(category)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteCategory = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ message: "Category not found" })
    if (!assertTenantAccess(category.shop, tenant) && !tenant.isGlobal) {
      return res.status(403).json({ message: "Access denied" })
    }
    category.isActive = false
    await category.save()
    res.json({ message: "Category deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
