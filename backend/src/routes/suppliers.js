import express from "express"
import { verifyToken, authorizeRole } from "../middleware/auth.js"
import { createSupplier, deleteSupplier, getSuppliers, updateSupplier } from "../controllers/suppliers.controller.js"

const router = express.Router()

router.get("/", verifyToken, getSuppliers)
router.post("/", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), createSupplier)
router.put("/:id", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), updateSupplier)
router.delete("/:id", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), deleteSupplier)

export default router
