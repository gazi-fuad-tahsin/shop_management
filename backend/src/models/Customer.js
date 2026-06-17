import mongoose from "mongoose"

const customerSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: String,
    email: String,
    address: String,
    city: String,
    customerType: {
      type: String,
      enum: ["retail", "wholesale", "corporate"],
      default: "retail",
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    notes: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

customerSchema.index({ shop: 1, phone: 1 })
customerSchema.index({ shop: 1, email: 1 })

export default mongoose.model("Customer", customerSchema)
