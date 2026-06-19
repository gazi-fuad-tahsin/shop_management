import mongoose from "mongoose"

const dailyCostSchema = new mongoose.Schema(
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },
    type: {
      type: String,
      trim: true,
      default: "general",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
)

dailyCostSchema.index({ shop: 1, date: 1 })
dailyCostSchema.index({ mainShop: 1, date: 1 })
dailyCostSchema.index({ adminOwner: 1, date: 1 })
dailyCostSchema.index({ category: 1, date: 1 })

export default mongoose.model("DailyCost", dailyCostSchema)
