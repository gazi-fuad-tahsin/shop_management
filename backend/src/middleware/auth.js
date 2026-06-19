import jwt from "jsonwebtoken"
import User from "../models/User.js"
import Shop from "../models/Shop.js"

const hasPaidShopAccess = (shop) => {
  if (!shop) return false
  return shop.status === "active" && shop.paymentStatus === "paid" && shop.subscriptionStatus === "active"
}

const hasTenantAccess = (user) => {
  const accessShop = user.shop || user.mainShop
  if (!hasPaidShopAccess(accessShop)) return false
  if (user.mainShop && accessShop?._id?.toString() !== user.mainShop?._id?.toString()) {
    return hasPaidShopAccess(user.mainShop)
  }
  return true
}

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "No token provided" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    const user = await User.findById(decoded.id).select("-password").populate("shop mainShop branchShop")
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User is inactive or no longer exists" })
    }
    if (user.role !== "super_admin") {
      if (!hasTenantAccess(user)) {
        return res.status(403).json({ message: "Shop subscription is not active or paid" })
      }
    }
    req.currentUser = user
    next()
  } catch (error) {
    res.status(401).json({ message: "Invalid token" })
  }
}

export const authorizeRole = (roles) => {
  return (req, res, next) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" })
    }
    next()
  }
}

export const requireSuperAdmin = authorizeRole(["super_admin"])

export const attachCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("shop mainShop branchShop")
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User is inactive or no longer exists" })
    }

    if (user.role !== "super_admin") {
      const accessShop = user.shop || user.mainShop
      const shop = await Shop.findById(accessShop?._id || accessShop)
      const mainShop = user.mainShop ? await Shop.findById(user.mainShop?._id || user.mainShop) : null
      if (!hasPaidShopAccess(shop) || (mainShop && shop?._id?.toString() !== mainShop?._id?.toString() && !hasPaidShopAccess(mainShop))) {
        return res.status(403).json({ message: "Shop subscription is not active or paid" })
      }
    }

    req.currentUser = user
    next()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getScopedShopId = async (req, requestedShopId) => {
  if (req.user.role === "super_admin") {
    return requestedShopId || null
  }

  const user = req.currentUser || (await User.findById(req.user.id).select("shop mainShop role"))
  return user?.shop?._id || user?.shop || user?.mainShop?._id || user?.mainShop || null
}
