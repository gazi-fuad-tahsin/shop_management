import express from "express"
import mongoose from "mongoose"
import http from "http"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.js"
import productRoutes from "./routes/products.js"
import inventoryRoutes from "./routes/inventory.js"
import salesRoutes from "./routes/sales.js"
import userRoutes from "./routes/users.js"
import categoryRoutes from "./routes/categories.js"
import customerRoutes from "./routes/customers.js"
import shopRoutes from "./routes/shops.js"
import dashboardRoutes from "./routes/dashboard.js"
import revenueRoutes from "./routes/revenue.js"
import costRoutes from "./routes/cost.js"
import reportsRoutes from "./routes/reports.js"
import supplierRoutes from "./routes/suppliers.js"
import chatRoutes from "./routes/chat.js"
import feedbackRoutes from "./routes/feedback.js"
import onboardingRoutes from "./routes/onboarding.js"
import superAdminRoutes from "./routes/super-admin.js"
import paymentRoutes from "./routes/payments.js"
import { handleStripeWebhook } from "./controllers/payments.controller.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { rateLimiter } from "./middleware/rateLimiter.js"
import { seedSystemData } from "./utils/seed.js"
import { attachChatSocket } from "./utils/chat-socket.js"

dotenv.config()

const app = express()
const server = http.createServer(app)
attachChatSocket(server)

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://shop-management-zapo.onrender.com",
      "https://shop-management-kappa.vercel.app",
      "https://vendastra-frontend.vercel.app",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  }),
)
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleStripeWebhook)
app.use(express.json())
app.use(express.urlencoded({ limit: "50mb", extended: true }))

// Rate limiting middleware
// app.use(rateLimiter(100, 15 * 60 * 1000))

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected")
    await seedSystemData()
  })
  .catch((err) => console.log("MongoDB connection error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/onboarding", onboardingRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/super-admin", superAdminRoutes)
app.use("/api/shops", shopRoutes)
app.use("/api/products", productRoutes)
app.use("/api/inventory", inventoryRoutes)
app.use("/api/sales", salesRoutes)
app.use("/api/users", userRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/customers", customerRoutes)
app.use("/api/suppliers", supplierRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/feedback", feedbackRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/v1/revenue", revenueRoutes)
app.use("/api/v1/cost", costRoutes)
app.use("/api/v1/reports", reportsRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "API is running" })
})

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
