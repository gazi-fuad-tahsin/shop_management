import User from "../models/User.js"
import bcryptjs from "bcryptjs"
import { getUserTenant } from "../utils/tenant.js"

export const getUsers = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const query = { isActive: true }
    if (!tenant.isGlobal) {
      if (!tenant.shopId) return res.status(400).json({ message: "You must be assigned to a shop" })
      query.shop = tenant.shopId
    }
    const users = await User.find(query).select("-password").populate("shop")
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createUser = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    if (!tenant.isGlobal && !tenant.shopId) {
      return res.status(400).json({ message: "You must be assigned to a shop" })
    }

    const { name, email, password, role = "staff", phone, address, shop, requestNote } = req.body
    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({ message: "Name, email or phone, and password are required" })
    }

    if (!tenant.isGlobal && role === "super_admin") {
      return res.status(403).json({ message: "Cannot assign super admin role" })
    }

    const existing = await User.findOne({
      $or: [email ? { email: email.toLowerCase() } : null, phone ? { phone } : null].filter(Boolean),
    })
    if (existing) return res.status(409).json({ message: "User already exists" })

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      address,
      requestNote,
      shop: tenant.isGlobal ? shop : tenant.shopId,
      approvalStatus: "approved",
      isActive: true,
      approvedBy: req.user.id,
      approvalDate: new Date(),
    })

    const saved = await User.findById(user._id).select("-password").populate("shop")
    res.status(201).json(saved)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").populate("shop")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    const tenant = await getUserTenant(req)
    if (!tenant.isGlobal && req.user.id !== user._id.toString() && user.shop?._id?.toString() !== tenant.shopId?.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateUser = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const existing = await User.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: "User not found" })
    if (!tenant.isGlobal && existing.shop?.toString() !== tenant.shopId?.toString() && req.user.id !== existing._id.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }
    if (!tenant.isGlobal && req.body.role === "super_admin") {
      return res.status(403).json({ message: "Cannot assign super admin role" })
    }
    const updates = { ...req.body }
    if (!tenant.isGlobal) delete updates.shop
    if (updates.password) updates.password = await bcryptjs.hash(updates.password, 10)
    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).select("-password")
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
