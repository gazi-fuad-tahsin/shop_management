import express from "express"
import Customer from "../models/Customer.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Get all customers
router.get("/", async (req, res) => {
  try {
    const { search, type } = req.query
    const query = { isActive: true }

    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { phone: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ]
    }

    if (type) {
      query.customerType = type
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 })
    res.json(customers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get customer by ID
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" })
    }
    res.json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create or get customer (for POS)
router.post("/quick", async (req, res) => {
  try {
    const { name, phone, email } = req.body

    // Try to find existing customer by phone or email
    if (phone) {
      const existing = await Customer.findOne({ phone })
      if (existing) {
        return res.json(existing)
      }
    }

    // Create new customer
    const customer = new Customer({
      name: name || "Walk-in Customer",
      phone,
      email,
      customerType: "retail",
    })

    await customer.save()
    res.status(201).json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create customer
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, phone, email, address, city, customerType, notes } = req.body

    if (!name) {
      return res.status(400).json({ message: "Customer name is required" })
    }

    const customer = new Customer({
      name,
      phone,
      email,
      address,
      city,
      customerType,
      notes,
    })

    await customer.save()
    res.status(201).json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update customer
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true })

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" })
    }

    res.json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
