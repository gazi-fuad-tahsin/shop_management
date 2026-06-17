import express from "express"
import { createCheckoutSession, verifyCheckoutSession } from "../controllers/payments.controller.js"

const router = express.Router()

router.post("/checkout-session", createCheckoutSession)
router.get("/session/:sessionId", verifyCheckoutSession)

export default router
