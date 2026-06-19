import express from "express"
import { verifyToken } from "../middleware/auth.js"
import { createConversation, getConversations, getMessages, searchChatUsers, sendMessage } from "../controllers/chat.controller.js"

const router = express.Router()

router.get("/users", verifyToken, searchChatUsers)
router.get("/conversations", verifyToken, getConversations)
router.post("/conversations", verifyToken, createConversation)
router.get("/conversations/:conversationId/messages", verifyToken, getMessages)
router.post("/conversations/:conversationId/messages", verifyToken, sendMessage)

export default router
