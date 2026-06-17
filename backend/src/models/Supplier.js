import mongoose from "mongoose"

const supplierSchema = new mongoose.Schema(
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
    email: String,
    phone: String,
    address: String,
    city: String,
    country: String,
    paymentTerms: String,
    taxId: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

supplierSchema.index({ shop: 1, name: 1 })

export default mongoose.model("Supplier", supplierSchema)
