import User from "../models/User.js"
import SubscriptionPackage from "../models/SubscriptionPackage.js"

const defaultPackages = [
  {
    name: "Starter",
    slug: "starter",
    description: "Single shop, inventory, POS, and reports",
    price: 29,
    currency: "usd",
    billingCycle: "monthly",
    limits: { products: 1000, users: 5, shops: 1 },
    features: ["Stripe checkout", "Branch code", "Inventory and POS"],
    isActive: true,
  },
  {
    name: "Growth",
    slug: "growth",
    description: "More users, higher product limits, and daily finance controls",
    price: 79,
    currency: "usd",
    billingCycle: "monthly",
    limits: { products: 5000, users: 20, shops: 1 },
    features: ["Daily revenue", "Expense tracking", "Manager approvals"],
    isActive: true,
  },
  {
    name: "Scale",
    slug: "scale",
    description: "Advanced controls for larger teams and operations",
    price: 149,
    currency: "usd",
    billingCycle: "monthly",
    limits: { products: 20000, users: 100, shops: 1 },
    features: ["Priority controls", "Global supervision", "Advanced reporting"],
    isActive: true,
  },
]

const seedSuperAdmin = async () => {
  if (!process.env.SUPER_ADMIN_EMAIL || !process.env.SUPER_ADMIN_PASSWORD) return

  const email = process.env.SUPER_ADMIN_EMAIL.toLowerCase() || "superadmin@vendastra.app"
  const existingSuperAdmin = await User.findOne({ email })
  if (existingSuperAdmin) return

  await User.create({
    name: process.env.SUPER_ADMIN_NAME || "Super Admin",
    email,
    password: process.env.SUPER_ADMIN_PASSWORD || "Admin@123456",
    role: "super_admin",
    approvalStatus: "approved",
    isActive: true,
  })
  console.log("Super admin user created from environment")
}

const seedSubscriptionPackages = async () => {
  for (const pkg of defaultPackages) {
    await SubscriptionPackage.findOneAndUpdate(
      { slug: pkg.slug },
      { $setOnInsert: pkg },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
  }
  console.log("Default subscription packages are ready")
}

export const seedSystemData = async () => {
  await seedSuperAdmin()
  await seedSubscriptionPackages()
}
