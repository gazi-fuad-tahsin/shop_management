
import express from "express"
import { verifyToken, authorizeRole } from "../middleware/auth.js"
import {
  createProduct,
  deleteProduct,
  getProductByBarcode,
  getProductById,
  getProducts,
  updateProduct,
} from "../controllers/products.controller.js"

const router = express.Router()

router.get("/", verifyToken, getProducts)
router.get("/barcode/:barcode", verifyToken, getProductByBarcode)
router.get("/:id", verifyToken, getProductById)
router.post("/", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), createProduct)
router.put("/:id", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), updateProduct)
router.delete("/:id", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), deleteProduct)

export default router
