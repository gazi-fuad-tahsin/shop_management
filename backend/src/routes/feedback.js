import express from "express"
import { verifyToken } from "../middleware/auth.js"
import { getFeedback, submitFeedback, updateFeedbackAsSuperAdmin } from "../controllers/feedback.controller.js"

const router = express.Router()

router.get("/", verifyToken, getFeedback)
router.post("/", verifyToken, submitFeedback)
router.patch("/:id", verifyToken, updateFeedbackAsSuperAdmin)

export default router
