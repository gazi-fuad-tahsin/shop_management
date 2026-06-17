import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPackage",
    },
    stripeCustomerId: {
      type: String,
      index: true,
    },
    stripeSessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      index: true,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "expired", "refunded"],
      default: "pending",
      index: true,
    },
    checkoutUrl: String,
    customerEmail: String,
    metadata: mongoose.Schema.Types.Mixed,
    paidAt: Date,
    cancelledAt: Date,
    expiresAt: Date,
  },
  { timestamps: true },
)

export default mongoose.model("Payment", paymentSchema)
