import express from "express"
import { verifyToken, requireSuperAdmin } from "../middleware/auth.js"
import {
  createShopForTenant,
  deleteShopForTenant,
  getAllShops,
  getAllUsers,
  getGlobalDashboard,
  getPackages,
  updateShopForTenant,
  updateUserAsSuperAdmin,
  upsertPackage,
} from "../controllers/super-admin.controller.js"

const router = express.Router()

router.use(verifyToken, requireSuperAdmin)

router.get("/dashboard", getGlobalDashboard)
router.get("/shops", getAllShops)
router.post("/shops", createShopForTenant)
router.patch("/shops/:id", updateShopForTenant)
router.delete("/shops/:id", deleteShopForTenant)
router.get("/users", getAllUsers)
router.patch("/users/:id", updateUserAsSuperAdmin)
router.get("/packages", getPackages)
router.post("/packages", upsertPackage)
router.patch("/packages/:id", upsertPackage)

export default router
