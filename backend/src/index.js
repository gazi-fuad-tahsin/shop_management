import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.js"
import productRoutes from "./routes/products.js"
import inventoryRoutes from "./routes/inventory.js"
import salesRoutes from "./routes/sales.js"
import userRoutes from "./routes/users.js"
import categoryRoutes from "./routes/categories.js"
import customerRoutes from "./routes/customers.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { rateLimiter } from "./middleware/rateLimiter.js"

dotenv.config()

const app = express()

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ limit: "50mb", extended: true }))

// Rate limiting middleware
app.use(rateLimiter(100, 15 * 60 * 1000))

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/inventory", inventoryRoutes)
app.use("/api/sales", salesRoutes)
app.use("/api/users", userRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/customers", customerRoutes)

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
