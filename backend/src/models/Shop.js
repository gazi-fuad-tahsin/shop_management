import mongoose from "mongoose"

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: String,
    city: String,
    state: String,
    postalCode: String,
    phone: String,
    email: String,
    branchCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    shopType: {
      type: String,
      enum: ["main", "branch"],
      default: "main",
      index: true,
    },
    mainShop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      index: true,
    },
    adminOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    setupStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "completed",
    },
    logo: String,
    businessType: String,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    subscriptionPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPackage",
    },
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "past_due", "cancelled"],
      default: "trial",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "none", "unpaid", "expired"],
      default: "pending",
    },
    stripeCustomerId: {
      type: String,
      index: true,
    },
    stripeSessionId: {
      type: String,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "suspended", "cancelled"],
      default: "active",
      index: true,
    },
    taxId: String,
    currency: {
      type: String,
      default: "USD",
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    settings: {
      autoBackup: Boolean,
      offlineMode: Boolean,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    suspendedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true },
)

shopSchema.pre("save", function (next) {
  if (this.branchCode) this.branchCode = this.branchCode.toUpperCase().trim()
  this.isActive = this.status === "active"
  next()
})

export default mongoose.model("Shop", shopSchema)
