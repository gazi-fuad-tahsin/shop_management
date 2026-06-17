import jwt from "jsonwebtoken"
import Shop from "../models/Shop.js"
import User from "../models/User.js"
import SubscriptionPackage from "../models/SubscriptionPackage.js"
import Payment from "../models/Payment.js"
import { generateBranchCode, normalizeBranchCode } from "../utils/branch-code.js"

const signUserToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      shopId: user.shop?._id || user.shop,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" },
  )

export const setupTenant = async (req, res) => {
  try {
    const {
      shopName,
      ownerName,
      email,
      phone,
      address,
      logo,
      businessType,
      password,
      packageId,
      sessionId,
      currency,
    } = req.body

    if (!shopName || !ownerName || !email || !password || !sessionId) {
      return res.status(400).json({ message: "Shop name, owner name, email, password, and paid session are required" })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(409).json({ message: "An account already exists with this email" })
    }

    const payment = await Payment.findOne({ stripeSessionId: sessionId }).populate("package")
    if (!payment) return res.status(404).json({ message: "Payment session not found" })
    if (payment.status !== "paid") {
      return res.status(403).json({ message: "Payment is not verified yet" })
    }
    if (payment.shop) {
      return res.status(409).json({ message: "This payment session has already been used" })
    }

    let subscriptionPackage = payment.package
    if (packageId && packageId !== payment.package?._id?.toString()) {
      return res.status(400).json({ message: "Package does not match paid session" })
    }
    if (!subscriptionPackage) {
      subscriptionPackage = await SubscriptionPackage.findById(packageId)
    }

    const owner = new User({
      name: ownerName,
      email,
      password,
      phone,
      address,
      role: "admin",
      approvalStatus: "approved",
      isActive: true,
    })
    await owner.save()

    const branchCode = await generateBranchCode(shopName)

    const shop = new Shop({
      name: shopName,
      owner: owner._id,
      adminOwner: owner._id,
      shopType: "main",
      branchCode,
      email,
      phone,
      address,
      logo,
      businessType,
      currency: currency || "USD",
      subscriptionPackage: subscriptionPackage?._id,
      subscriptionStatus: "active",
      paymentStatus: "paid",
      stripeCustomerId: payment.stripeCustomerId,
      stripeSessionId: payment.stripeSessionId,
      stripeSubscriptionId: payment.stripeSubscriptionId,
      status: "active",
    })
    await shop.save()

    payment.shop = shop._id
    await payment.save()

    owner.shop = shop._id
    owner.mainShop = shop._id
    owner.adminOwner = owner._id
    await owner.save()
    await owner.populate("shop")

    const token = signUserToken(owner)

    res.status(201).json({
      message: "Shop setup completed",
      token,
      shop,
      user: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        approvalStatus: owner.approvalStatus,
        shop: owner.shop,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const validateBranchCode = async (req, res) => {
  try {
    const { branchCode } = req.params
    const shop = await Shop.findOne({ branchCode: normalizeBranchCode(branchCode) }).select(
      "name branchCode status paymentStatus subscriptionStatus",
    )
    if (!shop) return res.status(404).json({ valid: false, message: "Branch code not found" })

    res.json({
      valid: true,
      shop: {
        id: shop._id,
        name: shop.name,
        branchCode: shop.branchCode,
        status: shop.status,
        paymentStatus: shop.paymentStatus,
        subscriptionStatus: shop.subscriptionStatus,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getPublicPackages = async (_req, res) => {
  try {
    const packages = await SubscriptionPackage.find({ isActive: true }).sort({ price: 1 })
    res.json(packages)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
