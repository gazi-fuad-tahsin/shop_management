import mongoose from "mongoose"

const feedbackReplySchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
)

const feedbackSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "staff"],
      required: true,
    },
    adminOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    mainShop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      index: true,
    },
    branchShop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      index: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    image: String,
    status: {
      type: String,
      enum: ["pending", "reviewed", "answered", "resolved", "rejected"],
      default: "pending",
      index: true,
    },
    replies: [feedbackReplySchema],
  },
  { timestamps: true },
)

feedbackSchema.index({ status: 1, createdAt: -1 })
feedbackSchema.index({ mainShop: 1, createdAt: -1 })

export default mongoose.model("Feedback", feedbackSchema)
