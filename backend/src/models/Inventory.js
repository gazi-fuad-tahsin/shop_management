import mongoose from "mongoose"

const inventorySchema = new mongoose.Schema(
  {
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

export default mongoose.model("Inventory", inventorySchema)
