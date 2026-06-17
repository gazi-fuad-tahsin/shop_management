import express from "express"
import { verifyToken, authorizeRole } from "../middleware/auth.js"
import { createShop, getBranches, getMyShop, getShopById, getShops, setupManagerBranch, updateShop } from "../controllers/shops.controller.js"

const router = express.Router()

router.post("/", verifyToken, authorizeRole(["admin", "manager"]), createShop)
router.get("/my-shop", verifyToken, authorizeRole(["admin", "manager", "staff"]), getMyShop)
router.get("/branches", verifyToken, authorizeRole(["super_admin", "admin"]), getBranches)
router.post("/branches/setup", verifyToken, authorizeRole(["manager"]), setupManagerBranch)
router.get("/:id", verifyToken, getShopById)
router.get("/", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), getShops)
router.patch("/:id", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), updateShop)

export default router
