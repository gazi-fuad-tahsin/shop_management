import Supplier from "../models/Supplier.js"
import Shop from "../models/Shop.js"
import { assertTenantAccess, buildTenantQuery, resolveTenantShopId } from "../utils/tenant.js"

const getShopMeta = async (shopId) => {
  const shop = await Shop.findById(shopId).select("shopType mainShop owner adminOwner")
  if (!shop) return null
  return {
    mainShop: shop.shopType === "branch" ? shop.mainShop : shop._id,
    adminOwner: shop.adminOwner || shop.owner,
  }
}

export const getSuppliers = async (req, res) => {
  try {
    const { shopId, search } = req.query
    const base = { isActive: true }
    if (search) base.$or = [{ name: new RegExp(search, "i") }, { phone: new RegExp(search, "i") }, { email: new RegExp(search, "i") }]
    const { query } = await buildTenantQuery(req, shopId, base)
    const suppliers = await Supplier.find(query).populate("shop", "name").sort({ name: 1 })
    res.json(suppliers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createSupplier = async (req, res) => {
  try {
    const { name, email, phone, address, city, country, paymentTerms, taxId, shopId } = req.body
    if (!name) return res.status(400).json({ message: "Supplier name is required" })
    const resolved = await resolveTenantShopId(req, shopId || req.body.shop)
    if (!resolved.shopId) return res.status(403).json({ message: "Shop not found or access denied" })
    const meta = await getShopMeta(resolved.shopId)
    if (!meta) return res.status(404).json({ message: "Shop not found" })

    const supplier = await Supplier.create({
      shop: resolved.shopId,
      mainShop: meta.mainShop,
      adminOwner: meta.adminOwner,
      name,
      email,
      phone,
      address,
      city,
      country,
      paymentTerms,
      taxId,
    })
    await supplier.populate("shop", "name")
    res.status(201).json(supplier)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
    if (!supplier) return res.status(404).json({ message: "Supplier not found" })
    const { tenant } = await resolveTenantShopId(req, supplier.shop, { required: false })
    if (!assertTenantAccess(supplier.shop, tenant)) return res.status(403).json({ message: "Access denied" })

    const updates = { ...req.body }
    delete updates.shop
    delete updates.mainShop
    delete updates.adminOwner
    Object.assign(supplier, updates)
    await supplier.save()
    await supplier.populate("shop", "name")
    res.json(supplier)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
    if (!supplier) return res.status(404).json({ message: "Supplier not found" })
    const { tenant } = await resolveTenantShopId(req, supplier.shop, { required: false })
    if (!assertTenantAccess(supplier.shop, tenant)) return res.status(403).json({ message: "Access denied" })
    supplier.isActive = false
    await supplier.save()
    res.json({ message: "Supplier deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
