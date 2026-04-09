const Stripe = require("stripe");
const { env } = require("../config/env");
const { badRequest } = require("../utils/errors");

const stripeClient =
  env.payment.provider === "stripe" && env.payment.secret
    ? new Stripe(env.payment.secret, { apiVersion: "2023-10-16" })
    : null;

const createStripePaymentIntent = async ({ amount, currency, bookingId, tenantId, customerEmail }) => {
  if (!stripeClient) {
    throw badRequest("Stripe is not configured");
  }
  const intent = await stripeClient.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    metadata: { bookingId: String(bookingId), tenantId: tenantId ? String(tenantId) : "" },
    receipt_email: customerEmail || undefined,
    automatic_payment_methods: { enabled: true }
  });
  return intent;
};

const verifyStripeWebhook = (payload, signature) => {
  if (!stripeClient || !env.payment.webhookSecret) {
    throw badRequest("Stripe webhook is not configured");
  }
  return stripeClient.webhooks.constructEvent(payload, signature, env.payment.webhookSecret);
};

module.exports = { createStripePaymentIntent, verifyStripeWebhook };
