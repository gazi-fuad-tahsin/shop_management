import express from "express"
import { verifyToken, authorizeRole } from "../middleware/auth.js"
import {
  createInventory,
  getInventory,
  getInventoryByProduct,
  updateInventory,
} from "../controllers/inventory.controller.js"

const router = express.Router()

router.get("/", verifyToken, getInventory)
router.get("/product/:productId", verifyToken, getInventoryByProduct)
router.put("/:id", verifyToken, updateInventory)
router.post("/", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), createInventory)

export default router
