import User from "../models/User.js"
import Shop from "../models/Shop.js"
import mongoose from "mongoose"

export const isSuperAdmin = (userOrRole) => (typeof userOrRole === "string" ? userOrRole : userOrRole?.role) === "super_admin"

export const getUserTenant = async (req) => {
  const user = req.currentUser || (await User.findById(req.user.id).select("shop role mainShop branchShop adminOwner").populate("shop mainShop branchShop"))
  let accessibleShopIds = []
  const shopId = user?.shop?._id || user?.shop || null

  if (user?.role === "admin" && shopId) {
    const branches = await Shop.find({ mainShop: shopId, shopType: "branch" }).select("_id")
    accessibleShopIds = [shopId, ...branches.map((branch) => branch._id)]
  } else if (shopId) {
    accessibleShopIds = [shopId]
  }

  return {
    user,
    isGlobal: user?.role === "super_admin",
    shopId,
    mainShopId: user?.mainShop?._id || user?.mainShop || (user?.role === "admin" ? shopId : null),
    branchShopId: user?.branchShop?._id || user?.branchShop || (user?.role === "manager" ? shopId : null),
    accessibleShopIds,
  }
}

const idsMatch = (left, right) => left?.toString() === right?.toString()

const castShopId = (id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id)

export const canAccessShop = (tenant, requestedShopId) => {
  if (!requestedShopId) return false
  if (tenant.isGlobal) return true
  return tenant.accessibleShopIds?.some((id) => idsMatch(id, requestedShopId))
}

export const getDefaultShopId = (tenant) => {
  if (tenant.isGlobal) return null
  return tenant.branchShopId || tenant.shopId || tenant.mainShopId || null
}

export const resolveTenantShopId = async (req, requestedShopId, { required = true } = {}) => {
  const tenant = await getUserTenant(req)

  if (tenant.isGlobal) {
    if (requestedShopId) return { tenant, shopId: requestedShopId }
    return { tenant, shopId: required ? null : null }
  }

  if (requestedShopId) {
    return { tenant, shopId: canAccessShop(tenant, requestedShopId) ? requestedShopId : null }
  }

  return { tenant, shopId: getDefaultShopId(tenant) }
}

export const buildTenantQuery = async (req, requestedShopId, base = {}) => {
  const { user, isGlobal, shopId, accessibleShopIds, mainShopId, branchShopId } = await getUserTenant(req)
  if (!user) return { query: base, user, isGlobal, shopId, accessibleShopIds, mainShopId, branchShopId }
  if (isGlobal) {
    return { query: requestedShopId ? { ...base, shop: castShopId(requestedShopId) } : { ...base }, user, isGlobal, shopId: requestedShopId || null, accessibleShopIds, mainShopId, branchShopId }
  }
  if (requestedShopId) {
    const allowed = accessibleShopIds.some((id) => id?.toString() === requestedShopId.toString())
    return {
      query: { ...base, shop: allowed ? castShopId(requestedShopId) : "__denied__" },
      user,
      isGlobal,
      shopId,
      accessibleShopIds,
      mainShopId,
      branchShopId,
    }
  }
  return { query: { ...base, shop: { $in: accessibleShopIds } }, user, isGlobal, shopId, accessibleShopIds, mainShopId, branchShopId }
}

export const assertTenantAccess = (docShopId, tenant) => {
  if (tenant.isGlobal) return true
  return tenant.accessibleShopIds?.some((id) => id?.toString() === docShopId?.toString())
}
