import mongoose from "mongoose"

const productSchema = new mongoose.Schema(
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
    sku: {
      type: String,
      required: true,
    },
    barcode: {
      type: String,
      sparse: true,
    },
    description: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    // supplier: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Supplier",
    // },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    retailPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    wholesalePrice: Number,
    color: String,
    specifications: String,
    warranty: {
      type: String,
    },
    weight: Number, // in grams
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: "cm" },
    },
    images: [String],
    manufacturer: String,
    unit: {
      type: String,
      enum: ["piece", "kg", "liter", "meter", "box", "pack"],
      default: "piece",
    },
    batchTrackingEnabled: {
      type: Boolean,
      default: false,
    },
    expiryTrackingEnabled: {
      type: Boolean,
      default: false,
    },
    minStock: {
      type: Number,
      default: 5,
    },
    maxStock: {
      type: Number,
      default: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
)

// Compound unique index for sku within each shop
productSchema.index({ shop: 1, sku: 1 }, { unique: true })
productSchema.index({ shop: 1, category: 1 })

export default mongoose.model("Product", productSchema)
