import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { verifyToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

// Register - Create user with pending approval
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" })
    }

    const user = new User({
      name,
      email,
      password,
      role: role || "staff",
      approvalStatus: "pending",
    })

    await user.save()

    res.status(201).json({
      message: "Registration successful. Please wait for admin approval to login.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Login - Check approval status
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    // Check user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    if (user.approvalStatus !== "approved") {
      return res.status(403).json({
        message: `Your account is ${user.approvalStatus}. Please wait for admin approval.`,
        approvalStatus: user.approvalStatus,
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get pending users for admin approval
router.get("/pending-users", verifyToken, authorizeRole(["admin"]), async (req, res) => {
  try {
    const pendingUsers = await User.find({ approvalStatus: "pending" }).select("-password").sort({ createdAt: -1 })

    res.json(pendingUsers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Approve user
router.post("/approve-user/:userId", verifyToken, authorizeRole(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.approvalStatus = "approved"
    user.approvedBy = req.user.id
    user.approvalDate = new Date()
    await user.save()

    res.json({ message: "User approved successfully", user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Reject user
router.post("/reject-user/:userId", verifyToken, authorizeRole(["admin"]), async (req, res) => {
  try {
    const { reason } = req.body
    const user = await User.findById(req.params.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.approvalStatus = "rejected"
    user.approvedBy = req.user.id
    user.rejectionReason = reason
    user.approvalDate = new Date()
    await user.save()

    res.json({ message: "User rejected", user })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
