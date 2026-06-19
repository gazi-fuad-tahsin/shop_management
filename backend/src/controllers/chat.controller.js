import User from "../models/User.js"
import Shop from "../models/Shop.js"
import ChatConversation from "../models/ChatConversation.js"
import ChatMessage from "../models/ChatMessage.js"
import { getUserTenant } from "../utils/tenant.js"
import mongoose from "mongoose"

const getUserShopIds = (user) =>
  [user?.shop?._id || user?.shop, user?.mainShop?._id || user?.mainShop, user?.branchShop?._id || user?.branchShop].filter(Boolean)

const canChatWith = (tenant, target) => {
  if (!target || target._id?.toString() === tenant.user?._id?.toString()) return false

  if (tenant.user.role === "super_admin") {
    return target.role === "admin"
  }

  if (tenant.user.role === "admin") {
    return target.role !== "super_admin" && getUserShopIds(target).some((id) => tenant.accessibleShopIds.some((shopId) => shopId?.toString() === id?.toString()))
  }

  const currentShop = tenant.shopId?.toString()
  const sameBranch = getUserShopIds(target).some((id) => id?.toString() === currentShop)
  const isOwnAdmin = target._id?.toString() === tenant.user.adminOwner?.toString()
  return target.role !== "super_admin" && (sameBranch || isOwnAdmin)
}

const getConversationMeta = async (participants) => {
  const users = await User.find({ _id: { $in: participants } }).select("shop mainShop branchShop adminOwner role")
  const branchUser = users.find((user) => user.branchShop || user.role === "manager" || user.role === "staff")
  const adminUser = users.find((user) => user.role === "admin")
  const shopId = branchUser?.shop || adminUser?.shop
  const shop = shopId ? await Shop.findById(shopId).select("shopType mainShop owner adminOwner") : null
  return {
    adminOwner: shop?.adminOwner || shop?.owner || adminUser?._id,
    mainShop: shop?.shopType === "branch" ? shop.mainShop : shop?._id || adminUser?.shop,
    branchShop: shop?.shopType === "branch" ? shop._id : branchUser?.branchShop,
  }
}

export const searchChatUsers = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const search = String(req.query.search || "").trim()
    const base = { isActive: true, _id: { $ne: req.user.id } }
    if (search) base.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }, { phone: new RegExp(search, "i") }]

    let query = base
    if (tenant.user.role === "super_admin") {
      query = { ...base, role: "admin" }
    } else if (tenant.user.role === "admin") {
      query = { ...base, role: { $in: ["admin", "manager", "staff"] }, $or: [{ shop: { $in: tenant.accessibleShopIds } }, { mainShop: tenant.mainShopId }, { adminOwner: tenant.user._id }] }
      if (search) {
        query.$and = [{ $or: query.$or }, { $or: base.$or }]
        delete query.$or
      }
    } else {
      query = {
        ...base,
        role: { $in: ["admin", "manager", "staff"] },
        $or: [{ shop: tenant.shopId }, { branchShop: tenant.shopId }, { _id: tenant.user.adminOwner }],
      }
      if (search) {
        query.$and = [{ $or: query.$or }, { $or: base.$or }]
        delete query.$or
      }
    }

    const users = await User.find(query).select("name email phone role shop mainShop branchShop").populate("shop", "name").limit(30)
    res.json(users.filter((user) => canChatWith(tenant, user)))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getConversations = async (req, res) => {
  try {
    const conversations = await ChatConversation.find({ participants: req.user.id })
      .populate("participants", "name email phone role shop")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean()
    const unreadCounts = await ChatMessage.aggregate([
      { $match: { conversation: { $in: conversations.map((conversation) => conversation._id) }, sender: { $ne: new mongoose.Types.ObjectId(req.user.id) }, readBy: { $ne: new mongoose.Types.ObjectId(req.user.id) } } },
      { $group: { _id: "$conversation", count: { $sum: 1 } } },
    ])
    const unreadMap = new Map(unreadCounts.map((item) => [item._id.toString(), item.count]))
    res.json(conversations.map((conversation) => ({ ...conversation, unreadCount: unreadMap.get(conversation._id.toString()) || 0 })))
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body
    if (!participantId) return res.status(400).json({ message: "Participant is required" })

    const tenant = await getUserTenant(req)
    const target = await User.findById(participantId).select("-password")
    if (!canChatWith(tenant, target)) return res.status(403).json({ message: "You cannot chat with this user" })

    const participants = [req.user.id, participantId]
    let conversation = await ChatConversation.findOne({ participants: { $all: participants, $size: 2 } })
    if (!conversation) {
      const meta = await getConversationMeta(participants)
      conversation = await ChatConversation.create({ participants, ...meta })
    }
    await conversation.populate("participants", "name email phone role shop")
    res.status(201).json(conversation)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getMessages = async (req, res) => {
  try {
    const conversation = await ChatConversation.findById(req.params.conversationId)
    if (!conversation || !conversation.participants.some((id) => id.toString() === req.user.id)) {
      return res.status(404).json({ message: "Conversation not found" })
    }
    const messages = await ChatMessage.find({ conversation: conversation._id }).populate("sender", "name role").sort({ createdAt: 1 })
    await ChatMessage.updateMany({ conversation: conversation._id, readBy: { $ne: req.user.id } }, { $addToSet: { readBy: req.user.id } })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { message, attachments = [], mentions = [] } = req.body
    if (!message && attachments.length === 0) return res.status(400).json({ message: "Message or attachment is required" })
    const conversation = await ChatConversation.findById(req.params.conversationId)
    if (!conversation || !conversation.participants.some((id) => id.toString() === req.user.id)) {
      return res.status(404).json({ message: "Conversation not found" })
    }
    const doc = await ChatMessage.create({
      conversation: conversation._id,
      sender: req.user.id,
      message,
      attachments,
      mentions,
      readBy: [req.user.id],
    })
    conversation.lastMessage = message || "Attachment"
    conversation.lastMessageAt = new Date()
    await conversation.save()
    await doc.populate("sender", "name role")
    res.status(201).json(doc)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
