import mongoose from "mongoose"

const categorySchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
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
    branchShops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
      },
    ],
    visibleToAllBranches: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["product", "expense", "general"],
      default: "product",
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

// Compound unique index for name within each shop
categorySchema.index({ shop: 1, name: 1 }, { unique: true })
categorySchema.index({ mainShop: 1, name: 1 })
categorySchema.index({ adminOwner: 1, type: 1 })

export default mongoose.model("Category", categorySchema)
