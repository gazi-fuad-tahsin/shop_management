import express from "express"
import { verifyToken, authorizeRole } from "../middleware/auth.js"
import { login, me, register } from "../controllers/auth.controller.js"
import { approveUser, getManagerRequests, getPendingUsers, rejectUser } from "../controllers/auth.admin.controller.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.get("/me", verifyToken, me)
router.get("/pending-users", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), getPendingUsers)
router.get("/manager-requests", verifyToken, authorizeRole(["super_admin", "admin"]), getManagerRequests)
router.post("/approve-user/:userId", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), approveUser)
router.post("/reject-user/:userId", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), rejectUser)

export default router
