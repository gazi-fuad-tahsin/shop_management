import mongoose from "mongoose"

const subscriptionPackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: String,
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
      trim: true,
    },
    stripePriceId: String,
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly", "one_time"],
      default: "monthly",
    },
    limits: {
      products: { type: Number, default: 1000 },
      users: { type: Number, default: 5 },
      shops: { type: Number, default: 1 },
    },
    features: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

export default mongoose.model("SubscriptionPackage", subscriptionPackageSchema)
