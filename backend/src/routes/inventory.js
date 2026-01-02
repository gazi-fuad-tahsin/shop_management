import express from "express"
import Inventory from "../models/Inventory.js"
import { verifyToken, authorizeRole } from "../middleware/auth.js"

const router = express.Router()

// Get all inventory
router.get("/", async (req, res) => {
  try {
    const inventory = await Inventory.find().populate("product")
    res.json(inventory)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get inventory by product
router.get("/product/:productId", async (req, res) => {
  try {
    const inventory = await Inventory.findOne({ product: req.params.productId }).populate("product")
    res.json(inventory)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update inventory
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("product")
    res.json(inventory)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create inventory entry
router.post("/", verifyToken, authorizeRole(["admin", "manager"]), async (req, res) => {
  try {
    const inventory = new Inventory(req.body)
    await inventory.save()
    await inventory.populate("product")
    res.status(201).json(inventory)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
