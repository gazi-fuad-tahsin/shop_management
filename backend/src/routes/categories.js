import express from "express"
import Category from "../models/Category.js"
import { verifyToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).populate("parent")
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create category
router.post("/", verifyToken, authorizeRole(["admin", "manager"]), async (req, res) => {
  try {
    const { name, description, parent } = req.body

    if (!name) {
      return res.status(400).json({ message: "Category name is required" })
    }

    const category = new Category({
      name,
      description,
      parent,
    })

    await category.save()
    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update category
router.put("/:id", verifyToken, authorizeRole(["admin", "manager"]), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true })

    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    res.json(category)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
