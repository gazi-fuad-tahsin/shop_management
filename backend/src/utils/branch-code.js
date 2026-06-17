import crypto from "crypto"
import Shop from "../models/Shop.js"

const normalize = (value) => String(value || "").trim().toUpperCase()

export const normalizeBranchCode = normalize

export const generateBranchCode = async (name = "SHOP") => {
  const prefix = normalize(name)
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4)
    .padEnd(4, "X")

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase()
    const branchCode = `${prefix}-${suffix}`
    const exists = await Shop.exists({ branchCode })
    if (!exists) return branchCode
  }

  throw new Error("Unable to generate a unique branch code")
}
