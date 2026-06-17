import jwt from "jsonwebtoken"
import User from "../models/User.js"
import Shop from "../models/Shop.js"
import ManagerRequest from "../models/ManagerRequest.js"
import { normalizeBranchCode } from "../utils/branch-code.js"

const findUserByIdentifier = (identifier, extra = {}) => {
  const value = String(identifier || "").trim()
  const query = value.includes("@") ? { email: value.toLowerCase(), ...extra } : { phone: value, ...extra }
  return User.findOne(query).populate("shop")
}

const hasPaidShopAccess = (shop) =>
  shop && shop.status === "active" && shop.paymentStatus === "paid" && shop.subscriptionStatus === "active"

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, branchCode, requestNote } = req.body
    const requestedRole = ["admin", "manager", "staff"].includes(role) ? role : "staff"

    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({ message: "Name, email or phone, and password are required" })
    }

    if (requestedRole === "manager" && !branchCode) {
      return res.status(400).json({ message: "Branch code is required for manager registration" })
    }

    let shop = null
    if (branchCode) {
      shop = await Shop.findOne({ branchCode: normalizeBranchCode(branchCode), shopType: "main" })
      if (!shop) return res.status(404).json({ message: "Invalid branch code" })
      if (!hasPaidShopAccess(shop)) return res.status(403).json({ message: "This shop is not active or paid" })
    }

    const existingUser = await User.findOne({
      $or: [email ? { email: email.toLowerCase() } : null, phone ? { phone } : null].filter(Boolean),
    })
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" })
    }

    const user = new User({
      name,
      email,
      phone,
      password,
      role: requestedRole,
      shop: requestedRole === "manager" ? undefined : shop?._id,
      mainShop: shop?._id,
      adminOwner: shop?.owner || shop?.adminOwner,
      requestNote,
      managerStatus: requestedRole === "manager" ? "pending" : "none",
      branchSetupStatus: requestedRole === "manager" ? "pending" : "not_required",
      approvalStatus: "pending",
    })

    await user.save()

    if (requestedRole === "manager") {
      await ManagerRequest.create({
        adminOwner: shop.owner || shop.adminOwner,
        mainShop: shop._id,
        requestedBy: user._id,
        requestNote,
        status: "pending",
      })
    }

    res.status(201).json({
      message: "Registration successful. Please wait for admin approval to login.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        shop: user.shop,
        approvalStatus: user.approvalStatus,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, identifier, password, branchCode } = req.body
    const loginIdentifier = identifier || email

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: "Email/phone and password are required" })
    }

    let user = null
    if (!branchCode) {
      user = await findUserByIdentifier(loginIdentifier, { role: "super_admin" })
      if (!user) {
        return res.status(400).json({ message: "Branch code is required" })
      }
    } else {
      const shop = await Shop.findOne({ branchCode: normalizeBranchCode(branchCode), shopType: "main" })
      if (!shop) return res.status(404).json({ message: "Invalid branch code" })
      user = await findUserByIdentifier(loginIdentifier, {
        $or: [{ shop: shop._id }, { mainShop: shop._id }, { adminOwner: shop.owner || shop.adminOwner }],
      })
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account is inactive." })
    }

    if (user.approvalStatus !== "approved") {
      return res.status(403).json({
        message: `Your account is ${user.approvalStatus}. Please wait for admin approval.`,
        approvalStatus: user.approvalStatus,
      })
    }

    if (user.role !== "super_admin") {
      const accessShopId = user.shop?._id || user.shop || user.mainShop?._id || user.mainShop
      const shop = await Shop.findById(accessShopId)
      if (!hasPaidShopAccess(shop)) {
        return res.status(403).json({ message: "Your shop subscription is not active or paid." })
      }
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    user.lastLogin = new Date()
    await user.save()

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, shopId: user.shop?._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE },
    )

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        approvalStatus: user.approvalStatus,
        managerStatus: user.managerStatus,
        branchSetupStatus: user.branchSetupStatus,
        mainShop: user.mainShop,
        branchShop: user.branchShop,
        shop: user.shop,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("shop")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      approvalStatus: user.approvalStatus,
      managerStatus: user.managerStatus,
      branchSetupStatus: user.branchSetupStatus,
      mainShop: user.mainShop,
      branchShop: user.branchShop,
      isActive: user.isActive,
      shop: user.shop,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
