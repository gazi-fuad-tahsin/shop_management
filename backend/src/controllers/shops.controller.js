import Shop from "../models/Shop.js"
import User from "../models/User.js"
import ManagerRequest from "../models/ManagerRequest.js"
import { assertTenantAccess, getUserTenant } from "../utils/tenant.js"
import { generateBranchCode } from "../utils/branch-code.js"

export const createShop = async (req, res) => {
  try {
    const { name, address, city, state, postalCode, phone, email, taxId, currency, taxRate, logo, businessType } = req.body

    if (!name) {
      return res.status(400).json({ message: "Shop name is required" })
    }

    const shop = new Shop({
      name,
      address,
      city,
      state,
      postalCode,
      phone,
      email,
      logo,
      businessType,
      owner: req.user.id,
      adminOwner: req.user.id,
      shopType: "main",
      taxId,
      currency: currency || "USD",
      taxRate: taxRate || 0,
      status: "active",
      subscriptionStatus: "trial",
      paymentStatus: "pending",
    })

    await shop.save()
    await User.findByIdAndUpdate(req.user.id, { shop: shop._id })

    res.status(201).json({ message: "Shop created successfully", shop })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate("owner", "name email")
      .populate("manager", "name email phone")
      .populate("mainShop", "name branchCode")
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" })
    }

    const tenant = await getUserTenant(req)
    if (!assertTenantAccess(shop._id, tenant)) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(shop)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getShops = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const query = tenant.isGlobal ? {} : { _id: { $in: tenant.accessibleShopIds } }
    const shops = await Shop.find(query)
      .populate("owner", "name email approvalStatus")
      .populate("manager", "name email phone")
      .populate("mainShop", "name branchCode")
    res.json(shops)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getBranches = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const query = tenant.isGlobal
      ? { shopType: "branch" }
      : { shopType: "branch", mainShop: tenant.mainShopId }

    const branches = await Shop.find(query)
      .populate("manager", "name email phone approvalStatus")
      .populate("mainShop", "name branchCode")
      .sort({ createdAt: -1 })
    res.json(branches)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const setupManagerBranch = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("mainShop branchShop")
    if (!user || user.role !== "manager") {
      return res.status(403).json({ message: "Only approved managers can setup a branch" })
    }
    if (user.approvalStatus !== "approved" || user.managerStatus !== "approved") {
      return res.status(403).json({ message: "Manager request is not approved yet" })
    }
    if (user.branchSetupStatus === "completed" && user.branchShop) {
      return res.status(409).json({ message: "Branch is already setup", branch: user.branchShop })
    }

    const { name, address, city, state, postalCode, phone, email, logo, businessType, currency, taxRate } = req.body
    if (!name) return res.status(400).json({ message: "Branch name is required" })

    const mainShop = await Shop.findById(user.mainShop)
    if (!mainShop || mainShop.shopType !== "main") {
      return res.status(400).json({ message: "Main shop not found for this manager" })
    }

    const branch = await Shop.create({
      name,
      address,
      city,
      state,
      postalCode,
      phone,
      email,
      logo,
      businessType,
      currency: currency || mainShop.currency || "USD",
      taxRate: taxRate ?? mainShop.taxRate ?? 0,
      owner: mainShop.owner,
      adminOwner: mainShop.owner || mainShop.adminOwner,
      manager: user._id,
      mainShop: mainShop._id,
      shopType: "branch",
      branchCode: await generateBranchCode(name),
      subscriptionPackage: mainShop.subscriptionPackage,
      subscriptionStatus: mainShop.subscriptionStatus,
      paymentStatus: mainShop.paymentStatus,
      status: "active",
      setupStatus: "completed",
    })

    user.shop = branch._id
    user.branchShop = branch._id
    user.branchSetupStatus = "completed"
    await user.save()

    await ManagerRequest.findOneAndUpdate(
      { requestedBy: user._id, mainShop: mainShop._id },
      { branchShop: branch._id },
    )

    await user.populate("shop mainShop branchShop")
    res.status(201).json({ message: "Branch setup completed", branch, user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" })
    }

    const tenant = await getUserTenant(req)
    if (!assertTenantAccess(shop._id, tenant)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const { name, address, city, state, postalCode, phone, email, taxId, currency, taxRate, logo, businessType, isActive, status } = req.body

    if (name) shop.name = name
    if (address) shop.address = address
    if (city) shop.city = city
    if (state) shop.state = state
    if (postalCode) shop.postalCode = postalCode
    if (phone) shop.phone = phone
    if (email) shop.email = email
    if (logo !== undefined) shop.logo = logo
    if (businessType !== undefined) shop.businessType = businessType
    if (taxId) shop.taxId = taxId
    if (currency) shop.currency = currency
    if (taxRate !== undefined) shop.taxRate = taxRate
    if (tenant.isGlobal && status) {
      shop.status = status
      shop.isActive = status === "active"
    }
    if (tenant.isGlobal && isActive !== undefined) shop.isActive = isActive

    await shop.save()
    res.json({ message: "Shop updated successfully", shop })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getMyShop = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("shop")
    if (user.role === "super_admin") {
      return res.status(400).json({ message: "Super admin does not have a single shop" })
    }
    if (!user.shop) {
      return res.status(404).json({ message: "No shop found for this manager" })
    }
    res.json(user.shop)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
