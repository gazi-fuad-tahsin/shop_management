import jwt from "jsonwebtoken"
import { Server } from "socket.io"
import User from "../models/User.js"
import ChatConversation from "../models/ChatConversation.js"
import ChatMessage from "../models/ChatMessage.js"

const userSockets = new Map()
const activeUserSockets = new Map()

const addSocket = (map, userId, socketId) => {
  const key = userId.toString()
  if (!map.has(key)) map.set(key, new Set())
  map.get(key).add(socketId)
}

const removeSocket = (map, userId, socketId) => {
  const key = userId?.toString()
  if (!key) return
  const sockets = map.get(key)
  if (!sockets) return
  sockets.delete(socketId)
  if (!sockets.size) map.delete(key)
}

const getActiveUserIds = () => [...activeUserSockets.entries()].filter(([, sockets]) => sockets.size).map(([userId]) => userId)

const getAllowedOrigins = () =>
  [
    "http://localhost:3000",
    "https://shop-management-zapo.onrender.com",
    "https://shop-management-kappa.vercel.app",
    "https://vendastra-frontend.vercel.app",
    process.env.FRONTEND_URL,
  ].filter(Boolean)

const joinUserRoom = (io, userId, socketId) => {
  const key = userId.toString()
  addSocket(userSockets, key, socketId)
  addSocket(activeUserSockets, key, socketId)
  io.emit("presence:update", { userId: key, online: true })
}

const leaveUserRoom = (io, userId, socketId) => {
  const key = userId?.toString()
  if (!key) return
  removeSocket(userSockets, key, socketId)
  removeSocket(activeUserSockets, key, socketId)
  if (!activeUserSockets.has(key)) {
    io.emit("presence:update", { userId: key, online: false })
  }
}

const markUserActive = (io, userId, socketId) => {
  const key = userId?.toString()
  if (!key) return
  addSocket(activeUserSockets, key, socketId)
  io.emit("presence:update", { userId: key, online: true })
}

const markUserIdle = (io, userId, socketId) => {
  const key = userId?.toString()
  if (!key) return
  removeSocket(activeUserSockets, key, socketId)
  if (!activeUserSockets.has(key)) {
    io.emit("presence:update", { userId: key, online: false })
  }
}

const emitToConversation = async (io, conversationId, event, payload) => {
  const conversation = await ChatConversation.findById(conversationId).select("participants")
  if (!conversation) return
  for (const participant of conversation.participants) {
    io.to(`user:${participant.toString()}`).emit(event, payload)
  }
}

export const attachChatSocket = (server) => {
  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token
      if (!token) return next(new Error("Missing token"))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id).select("_id name role isActive")
      if (!user || !user.isActive) return next(new Error("Invalid user"))
      socket.user = user
      next()
    } catch (error) {
      next(error)
    }
  })

  io.on("connection", (socket) => {
    const user = socket.user
    const userRoom = `user:${user._id.toString()}`
    socket.join(userRoom)
    joinUserRoom(io, user._id, socket.id)
    socket.emit("connected", { userId: user._id, onlineUsers: getActiveUserIds() })

    socket.on("presence:active", () => {
      markUserActive(io, user._id, socket.id)
    })

    socket.on("presence:idle", () => {
      markUserIdle(io, user._id, socket.id)
    })

    socket.on("typing", async ({ conversationId }) => {
      if (!conversationId) return
      await emitToConversation(io, conversationId, "typing", { conversationId, userId: user._id })
    })

    socket.on("send_message", async ({ conversationId, message, attachments = [], mentions = [] }) => {
      if (!conversationId || (!message && !attachments.length)) return

      const conversation = await ChatConversation.findById(conversationId)
      if (!conversation || !conversation.participants.some((id) => id.toString() === user._id.toString())) return

      const doc = await ChatMessage.create({
        conversation: conversation._id,
        sender: user._id,
        message,
        attachments,
        mentions,
        readBy: [user._id],
      })

      conversation.lastMessage = message || "Attachment"
      conversation.lastMessageAt = new Date()
      await conversation.save()
      await doc.populate("sender", "name role")

      await emitToConversation(io, conversation._id, "message", {
        conversationId: conversation._id,
        message: doc,
      })
    })

    socket.on("disconnect", () => {
      leaveUserRoom(io, user._id, socket.id)
    })
  })

  return io
}
