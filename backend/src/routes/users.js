import express from "express"
import { verifyToken, authorizeRole } from "../middleware/auth.js"
import { createUser, getUserById, getUsers, updateUser } from "../controllers/users.controller.js"

const router = express.Router()

router.get("/", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), getUsers)
router.post("/", verifyToken, authorizeRole(["super_admin", "admin", "manager"]), createUser)
router.get("/:id", verifyToken, getUserById)
router.put("/:id", verifyToken, updateUser)

export default router
