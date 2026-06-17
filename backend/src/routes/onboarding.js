import express from "express"
import { getPublicPackages, setupTenant, validateBranchCode } from "../controllers/onboarding.controller.js"

const router = express.Router()

router.get("/packages", getPublicPackages)
router.get("/branch/:branchCode", validateBranchCode)
router.post("/setup", setupTenant)

export default router
