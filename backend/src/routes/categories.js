import express from "express"
import { verifyToken, authorizeRole } from "../middleware/auth.js"
import { createCategory, getCategories, updateCategory } from "../controllers/categories.controller.js"

const router = express.Router()

router.get("/", verifyToken, getCategories)
router.post("/", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), createCategory)
router.put("/:id", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), updateCategory)

export default router
