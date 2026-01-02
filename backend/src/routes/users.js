import express from "express"
import User from "../models/User.js"
import { verifyToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

// Get all users (admin only)
router.get("/", verifyToken, authorizeRole(["admin"]), async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select("-password").populate("shop")
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get user by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").populate("shop")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update user
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).select("-password")
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
