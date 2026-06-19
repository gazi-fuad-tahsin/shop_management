import Feedback from "../models/Feedback.js"
import { getUserTenant } from "../utils/tenant.js"

const getFeedbackScope = (tenant) => ({
  role: tenant.user.role,
  adminOwner: tenant.user.adminOwner || (tenant.user.role === "admin" ? tenant.user._id : undefined),
  mainShop: tenant.mainShopId,
  branchShop: tenant.branchShopId,
  shop: tenant.shopId,
})

export const submitFeedback = async (req, res) => {
  try {
    const { title, message, image } = req.body
    if (!title || !message) return res.status(400).json({ message: "Title and message are required" })
    const tenant = await getUserTenant(req)
    const feedback = await Feedback.create({
      createdBy: req.user.id,
      ...getFeedbackScope(tenant),
      title,
      message,
      image,
    })
    await feedback.populate(["createdBy", "shop", "mainShop", "branchShop"])
    res.status(201).json(feedback)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getFeedback = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const { status } = req.query
    const query = {}
    if (status && status !== "all") query.status = status
    if (!tenant.isGlobal) query.createdBy = req.user.id

    const feedback = await Feedback.find(query)
      .populate("createdBy", "name email role")
      .populate("shop", "name")
      .populate("mainShop", "name")
      .populate("branchShop", "name")
      .populate("replies.createdBy", "name role")
      .sort({ createdAt: -1 })
    res.json(feedback)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateFeedbackAsSuperAdmin = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") return res.status(403).json({ message: "Unauthorized" })
    const { status, reply } = req.body
    const feedback = await Feedback.findById(req.params.id)
    if (!feedback) return res.status(404).json({ message: "Feedback not found" })

    if (status) feedback.status = status
    if (reply) {
      feedback.replies.push({ message: reply, createdBy: req.user.id })
      if (!status) feedback.status = "answered"
    }
    await feedback.save()
    await feedback.populate(["createdBy", "shop", "mainShop", "branchShop", "replies.createdBy"])
    res.json(feedback)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
