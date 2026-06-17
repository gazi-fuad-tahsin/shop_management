import Payment from "../models/Payment.js"
import Shop from "../models/Shop.js"
import SubscriptionPackage from "../models/SubscriptionPackage.js"
import mongoose from "mongoose"
import {
  createStripeCheckoutSession,
  retrieveStripeCheckoutSession,
  verifyStripeWebhookSignature,
} from "../utils/stripe.js"

const markSessionPaid = async (session) => {
  const payment = await Payment.findOneAndUpdate(
    { stripeSessionId: session.id },
    {
      stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
      stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
      status: "paid",
      paidAt: new Date(),
      amount: Number(session.amount_total || 0) / 100,
      currency: session.currency || "usd",
      customerEmail: session.customer_details?.email || session.customer_email,
      metadata: session.metadata,
    },
    { new: true },
  )

  if (payment?.shop) {
    await Shop.findByIdAndUpdate(payment.shop, {
      paymentStatus: "paid",
      subscriptionStatus: "active",
      status: "active",
      stripeCustomerId: payment.stripeCustomerId,
      stripeSessionId: payment.stripeSessionId,
      stripeSubscriptionId: payment.stripeSubscriptionId,
      subscriptionPackage: payment.package,
    })
  }

  return payment
}

export const createCheckoutSession = async (req, res) => {
  try {
    const { packageId, email } = req.body
    if (!packageId) return res.status(400).json({ message: "Package is required" })

    const packageKey = String(packageId).trim()
    const subscriptionPackage = mongoose.Types.ObjectId.isValid(packageKey)
      ? await SubscriptionPackage.findById(packageKey)
      : await SubscriptionPackage.findOne({ slug: packageKey.toLowerCase() })

    if (!subscriptionPackage || !subscriptionPackage.isActive) {
      return res.status(404).json({ message: "Package not found" })
    }

    const session = await createStripeCheckoutSession({ subscriptionPackage, customerEmail: email })

    await Payment.create({
      package: subscriptionPackage._id,
      stripeSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
      amount: Number(session.amount_total || subscriptionPackage.price * 100 || 0) / 100,
      currency: session.currency || subscriptionPackage.currency || "usd",
      status: "pending",
      checkoutUrl: session.url,
      customerEmail: email,
      metadata: session.metadata,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    })

    res.status(201).json({ sessionId: session.id, url: session.url })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params
    let payment = await Payment.findOne({ stripeSessionId: sessionId }).populate("package")
    if (!payment) return res.status(404).json({ message: "Payment session not found" })

    if (payment.status !== "paid") {
      const session = await retrieveStripeCheckoutSession(sessionId)
      if (session.payment_status === "paid" || session.status === "complete") {
        payment = await markSessionPaid(session)
        payment = await Payment.findById(payment._id).populate("package")
      } else if (session.status === "expired") {
        payment.status = "expired"
        await payment.save()
      }
    }

    res.json({
      sessionId: payment.stripeSessionId,
      status: payment.status,
      paid: payment.status === "paid",
      package: payment.package,
      shop: payment.shop,
      customerEmail: payment.customerEmail,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const handleStripeWebhook = async (req, res) => {
  try {
    const event = verifyStripeWebhookSignature(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET)
    const object = event.data?.object

    if (event.type === "checkout.session.completed" && object) {
      await markSessionPaid(object)
    }

    if (event.type === "checkout.session.expired" && object?.id) {
      await Payment.findOneAndUpdate({ stripeSessionId: object.id }, { status: "expired" })
    }

    if (event.type === "payment_intent.payment_failed" && object?.id) {
      const sessionId = object.metadata?.checkout_session_id
      if (sessionId) await Payment.findOneAndUpdate({ stripeSessionId: sessionId }, { status: "failed" })
    }

    res.json({ received: true })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
