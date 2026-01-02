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
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
  },
  { timestamps: true },
)

export default mongoose.model("Shop", shopSchema)
