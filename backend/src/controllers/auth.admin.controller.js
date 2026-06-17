import User from "../models/User.js"
import ManagerRequest from "../models/ManagerRequest.js"
import { getUserTenant } from "../utils/tenant.js"

export const getPendingUsers = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const query = { approvalStatus: "pending" }
    if (!tenant.isGlobal) query.mainShop = tenant.mainShopId
    const pendingUsers = await User.find(query).select("-password").sort({ createdAt: -1 })
    res.json(pendingUsers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).json({ message: "User not found" })
    const tenant = await getUserTenant(req)
    if (!tenant.isGlobal && user.mainShop?.toString() !== tenant.mainShopId?.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }
    user.approvalStatus = "approved"
    if (user.role === "manager") {
      user.managerStatus = "approved"
      user.branchSetupStatus = "pending"
    }
    user.approvedBy = req.user.id
    user.approvalDate = new Date()
    await user.save()
    await ManagerRequest.findOneAndUpdate(
      { requestedBy: user._id, status: "pending" },
      { status: "approved", reviewedBy: req.user.id, reviewedAt: new Date() },
    )
    res.json({ message: "User approved successfully", user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const rejectUser = async (req, res) => {
  try {
    const { reason } = req.body
    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).json({ message: "User not found" })
    const tenant = await getUserTenant(req)
    if (!tenant.isGlobal && user.mainShop?.toString() !== tenant.mainShopId?.toString()) {
      return res.status(403).json({ message: "Access denied" })
    }
    user.approvalStatus = "rejected"
    if (user.role === "manager") {
      user.managerStatus = "rejected"
    }
    user.approvedBy = req.user.id
    user.rejectionReason = reason
    user.approvalDate = new Date()
    await user.save()
    await ManagerRequest.findOneAndUpdate(
      { requestedBy: user._id, status: "pending" },
      { status: "rejected", reviewedBy: req.user.id, reviewedAt: new Date(), rejectionReason: reason },
    )
    res.json({ message: "User rejected", user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getManagerRequests = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const query = {}
    if (!tenant.isGlobal) query.mainShop = tenant.mainShopId
    const requests = await ManagerRequest.find(query)
      .populate("requestedBy", "name email phone approvalStatus managerStatus branchSetupStatus")
      .populate("mainShop", "name branchCode")
      .populate("branchShop", "name status")
      .sort({ createdAt: -1 })
    res.json(requests)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
