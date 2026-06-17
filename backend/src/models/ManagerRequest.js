import mongoose from "mongoose"

const managerRequestSchema = new mongoose.Schema(
  {
    adminOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mainShop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    branchShop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    requestNote: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true },
)

managerRequestSchema.index({ mainShop: 1, requestedBy: 1 }, { unique: true })

export default mongoose.model("ManagerRequest", managerRequestSchema)
