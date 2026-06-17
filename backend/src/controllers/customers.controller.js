import Customer from "../models/Customer.js"
import User from "../models/User.js"
import { assertTenantAccess, buildTenantQuery, getUserTenant } from "../utils/tenant.js"

export const getCustomers = async (req, res) => {
  try {
    const { search, type } = req.query
    const { shopId } = req.query
    const { query } = await buildTenantQuery(req, shopId, { isActive: true })
    if (search) {
      query.$or = [{ name: new RegExp(search, "i") }, { phone: new RegExp(search, "i") }, { email: new RegExp(search, "i") }]
    }
    if (type) {
      query.customerType = type
    }

    const customers = await Customer.find(query).populate("shop", "name").sort({ createdAt: -1 })
    res.json(customers)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getCustomerById = async (req, res) => {
  try {
    const tenant = await getUserTenant(req)
    const customer = await Customer.findById(req.params.id).populate("shop", "name")
    if (!customer) return res.status(404).json({ message: "Customer not found" })
    if (!assertTenantAccess(customer.shop, tenant)) {
      return res.status(403).json({ message: "Access denied" })
    }
    res.json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const quickCreateCustomer = async (req, res) => {
  try {
    const { name, phone, email } = req.body
    const tenant = await getUserTenant(req)
    if (tenant.isGlobal || !tenant.shopId) return res.status(400).json({ message: "You must be assigned to a shop" })
    if (phone) {
      const existing = await Customer.findOne({ shop: tenant.shopId, phone })
      if (existing) return res.json(existing)
    }
    const customer = new Customer({ shop: tenant.shopId, name: name || "Walk-in Customer", phone, email, customerType: "retail" })
    await customer.save()
    res.status(201).json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, city, customerType, notes } = req.body
    const tenant = await getUserTenant(req)
    if (tenant.isGlobal || !tenant.shopId) return res.status(400).json({ message: "You must be assigned to a shop" })
    if (!name) return res.status(400).json({ message: "Customer name is required" })
    const customer = new Customer({ shop: tenant.shopId, name, phone, email, address, city, customerType, notes })
    await customer.save()
    await customer.populate("shop", "name")
    res.status(201).json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
    if (!customer) return res.status(404).json({ message: "Customer not found" })
    const tenant = await getUserTenant(req)
    if (!assertTenantAccess(customer.shop, tenant)) {
      return res.status(403).json({ message: "Access denied" })
    }
    const updates = { ...req.body }
    delete updates.shop
    Object.assign(customer, updates)
    await customer.save()
    res.json(customer)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
