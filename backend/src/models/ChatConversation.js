import mongoose from "mongoose"

const chatConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
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
    type: {
      type: String,
      enum: ["direct"],
      default: "direct",
    },
    lastMessage: String,
    lastMessageAt: Date,
  },
  { timestamps: true },
)

chatConversationSchema.index({ participants: 1 })
chatConversationSchema.index({ mainShop: 1, updatedAt: -1 })

export default mongoose.model("ChatConversation", chatConversationSchema)
