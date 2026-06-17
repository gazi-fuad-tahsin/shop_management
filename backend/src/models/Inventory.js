import mongoose from "mongoose"

const inventorySchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
    },
    reorderQuantity: {
      type: Number,
      default: 50,
    },
    warehouse: {
      type: String,
      default: "Main",
    },
    lastRestockDate: Date,
    lastRestockQuantity: Number,
    expiryDate: Date,
    batchNumber: String,
  },
  { timestamps: true },
)

inventorySchema.index({ shop: 1, product: 1 })
inventorySchema.index({ shop: 1, updatedAt: -1 })

export default mongoose.model("Inventory", inventorySchema)
