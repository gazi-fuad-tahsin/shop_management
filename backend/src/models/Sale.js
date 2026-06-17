import mongoose from "mongoose"

const saleSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    saleNumber: {
      type: String,
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: String,
        barcode: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        discount: {
          type: Number,
          default: 0,
        },
        subtotal: {
          type: Number,
          required: true,
        },
        batchNumber: String,
        expiryDate: Date,
      },
    ],
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: String,
    customerPhone: String,
    totalAmount: {
      type: Number,
      required: true,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "mixed", "card", "check", "online", "upi"],
      required: true,
    },
    paymentDistribution: {
      cash: {
        type: Number,
        default: 0,
        min: 0,
      },
      bank: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    saleType: {
      type: String,
      enum: ["retail", "wholesale", "online"],
      default: "retail",
    },
    notes: String,
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isSynced: {
      type: Boolean,
      default: false,
    },
    isOfflineSync: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

// Compound unique index for saleNumber within each shop
saleSchema.index({ shop: 1, saleNumber: 1 }, { unique: true })
saleSchema.index({ shop: 1, createdAt: -1 })

export default mongoose.model("Sale", saleSchema)
