import bcryptjs from "bcryptjs"
import Shop from "../models/Shop.js"
import User from "../models/User.js"
import Product from "../models/Product.js"
import Sale from "../models/Sale.js"
import Customer from "../models/Customer.js"
import Inventory from "../models/Inventory.js"
import SubscriptionPackage from "../models/SubscriptionPackage.js"
import { generateBranchCode, normalizeBranchCode } from "../utils/branch-code.js"

export const getGlobalDashboard = async (_req, res) => {
  try {
    const [shops, users, products, customers, inventoryItems, revenueAgg] = await Promise.all([
      Shop.countDocuments(),
      User.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Customer.countDocuments({ isActive: true }),
      Inventory.countDocuments(),
      Sale.aggregate([{ $match: { paymentStatus: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }]),
    ])

    const shopsByStatus = await Shop.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])

    res.json({
      shops,
      users,
      products,
      customers,
      inventoryItems,
      totalRevenue: revenueAgg[0]?.total || 0,
      transactions: revenueAgg[0]?.count || 0,
      shopsByStatus,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAllShops = async (req, res) => {
  try {
    const { status, search } = req.query
    const query = {}
    if (status && status !== "all") query.status = status
    if (search) query.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }, { phone: new RegExp(search, "i") }]

    const shops = await Shop.find(query)
      .populate("owner", "name email phone approvalStatus isActive")
      .populate("adminOwner", "name email phone")
      .populate("manager", "name email phone approvalStatus")
      .populate("mainShop", "name branchCode")
      .populate("subscriptionPackage", "name price billingCycle")
      .sort({ createdAt: -1 })

    res.json(shops)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createShopForTenant = async (req, res) => {
  try {
    const {
      name,
      ownerName,
      ownerEmail,
      ownerPassword,
      phone,
      email,
      address,
      businessType,
      logo,
      subscriptionPackage,
      paymentStatus = "paid",
      subscriptionStatus = "active",
      status = "active",
      branchCode,
    } = req.body

    if (!name || !ownerName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({ message: "Shop name, owner name, owner email, and owner password are required" })
    }

    const existingUser = await User.findOne({ email: ownerEmail.toLowerCase() })
    if (existingUser) return res.status(409).json({ message: "Owner email already exists" })

    const finalBranchCode = branchCode ? normalizeBranchCode(branchCode) : await generateBranchCode(name)
    if (await Shop.exists({ branchCode: finalBranchCode })) {
      return res.status(409).json({ message: "Branch code already exists" })
    }

    const owner = await User.create({
      name: ownerName,
      email: ownerEmail,
      password: ownerPassword,
      phone,
      role: "admin",
      approvalStatus: "approved",
      isActive: true,
    })

    const shop = await Shop.create({
      name,
      owner: owner._id,
      phone,
      email,
      address,
      businessType,
      logo,
      branchCode: finalBranchCode,
      subscriptionPackage,
      status,
      subscriptionStatus,
      paymentStatus,
    })

    owner.shop = shop._id
    await owner.save()
    await shop.populate(["owner", "adminOwner", "manager", "mainShop", "subscriptionPackage"])

    res.status(201).json(shop)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateShopForTenant = async (req, res) => {
  try {
    const allowed = [
      "name",
      "branchCode",
      "phone",
      "email",
      "address",
      "city",
      "state",
      "postalCode",
      "logo",
      "businessType",
      "subscriptionPackage",
      "subscriptionStatus",
      "paymentStatus",
      "status",
      "stripeCustomerId",
      "stripeSessionId",
      "stripeSubscriptionId",
      "currency",
      "taxRate",
      "taxId",
    ]
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }
    if (updates.branchCode) {
      updates.branchCode = normalizeBranchCode(updates.branchCode)
      const existing = await Shop.findOne({ branchCode: updates.branchCode, _id: { $ne: req.params.id } })
      if (existing) return res.status(409).json({ message: "Branch code already exists" })
    }
    if (updates.status === "suspended") updates.suspendedAt = new Date()
    if (updates.status === "cancelled") updates.cancelledAt = new Date()
    if (updates.status) updates.isActive = updates.status === "active"

    const shop = await Shop.findByIdAndUpdate(req.params.id, updates, { new: true }).populate([
      "owner",
      "adminOwner",
      "manager",
      "mainShop",
      "subscriptionPackage",
    ])
    if (!shop) return res.status(404).json({ message: "Shop not found" })
    res.json(shop)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteShopForTenant = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(req.params.id, { status: "cancelled", isActive: false, cancelledAt: new Date() }, { new: true })
    if (!shop) return res.status(404).json({ message: "Shop not found" })
    res.json({ message: "Shop cancelled", shop })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getAllUsers = async (req, res) => {
  try {
    const { role, shopId, search } = req.query
    const query = {}
    if (role && role !== "all") query.role = role
    if (shopId) query.shop = shopId
    if (search) query.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }]

    const users = await User.find(query).select("-password").populate("shop", "name status").sort({ createdAt: -1 })
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateUserAsSuperAdmin = async (req, res) => {
  try {
    const allowed = ["name", "email", "phone", "address", "role", "shop", "isActive", "approvalStatus"]
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }
    if (req.body.password) updates.password = await bcryptjs.hash(req.body.password, 10)

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-password").populate("shop")
    if (!user) return res.status(404).json({ message: "User not found" })
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getPackages = async (_req, res) => {
  try {
    const packages = await SubscriptionPackage.find().sort({ price: 1 })
    res.json(packages)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const upsertPackage = async (req, res) => {
  try {
    const payload = req.body
    if (!payload.name || !payload.slug || payload.price === undefined) {
      return res.status(400).json({ message: "Name, slug, and price are required" })
    }

    const doc = req.params.id
      ? await SubscriptionPackage.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
      : await SubscriptionPackage.create(payload)

    res.status(req.params.id ? 200 : 201).json(doc)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
