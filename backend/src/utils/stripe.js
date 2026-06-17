import crypto from "crypto"

const stripeApi = "https://api.stripe.com/v1"

const ensureStripeKey = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
}

const stripeRequest = async (path, { method = "GET", body } = {}) => {
  ensureStripeKey()

  const response = await fetch(`${stripeApi}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error?.message || "Stripe request failed")
  }
  return data
}

export const createStripeCheckoutSession = async ({ subscriptionPackage, customerEmail }) => {
  const successUrl =
    process.env.STRIPE_SUCCESS_URL ||
    `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = process.env.STRIPE_CANCEL_URL || `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/cancel`

  const params = new URLSearchParams()
  params.set("mode", subscriptionPackage.billingCycle === "one_time" ? "payment" : "subscription")
  params.set("success_url", successUrl)
  params.set("cancel_url", cancelUrl)
  params.set("client_reference_id", subscriptionPackage._id.toString())
  params.set("metadata[packageId]", subscriptionPackage._id.toString())
  if (customerEmail) params.set("customer_email", customerEmail)

  if (subscriptionPackage.stripePriceId) {
    params.set("line_items[0][price]", subscriptionPackage.stripePriceId)
  } else {
    params.set("line_items[0][price_data][currency]", subscriptionPackage.currency || "usd")
    params.set("line_items[0][price_data][product_data][name]", subscriptionPackage.name)
    if (subscriptionPackage.description) {
      params.set("line_items[0][price_data][product_data][description]", subscriptionPackage.description)
    }
    params.set("line_items[0][price_data][unit_amount]", String(Math.round(Number(subscriptionPackage.price || 0) * 100)))
    if (subscriptionPackage.billingCycle !== "one_time") {
      params.set("line_items[0][price_data][recurring][interval]", subscriptionPackage.billingCycle === "yearly" ? "year" : "month")
    }
  }
  params.set("line_items[0][quantity]", "1")

  return stripeRequest("/checkout/sessions", { method: "POST", body: params })
}

export const retrieveStripeCheckoutSession = async (sessionId) =>
  stripeRequest(`/checkout/sessions/${encodeURIComponent(sessionId)}`)

export const verifyStripeWebhookSignature = (rawBody, signatureHeader, secret) => {
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured")
  if (!signatureHeader) throw new Error("Missing Stripe signature")

  const entries = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=")
      return [key, value]
    }),
  )
  const timestamp = entries.t
  const expected = entries.v1
  if (!timestamp || !expected) throw new Error("Invalid Stripe signature")

  const payload = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody)
  const signedPayload = `${timestamp}.${payload}`
  const computed = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex")

  const expectedBuffer = Buffer.from(expected, "hex")
  const computedBuffer = Buffer.from(computed, "hex")
  if (expectedBuffer.length !== computedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, computedBuffer)) {
    throw new Error("Invalid Stripe signature")
  }

  return JSON.parse(payload)
}
