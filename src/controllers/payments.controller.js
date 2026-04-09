const { createStripePaymentIntent, verifyStripeWebhook } = require("../services/payment.service");
const { getBookingWithService, updatePaymentStatus, updateBookingStatus } = require("../repositories/booking.repo");
const { badRequest, notFound, forbidden } = require("../utils/errors");
const { BOOKING_STATUS, PAYMENT_STATUS } = require("../utils/constants");
const { env } = require("../config/env");

const createStripeIntent = async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) throw badRequest("bookingId is required");

  const booking = await getBookingWithService(req.tenantId, bookingId);
  if (!booking) throw notFound("Booking not found");

  if (booking.user_id && booking.user_id !== req.user.id && req.user.role === "customer") {
    throw forbidden("Not allowed to pay for this booking");
  }

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw badRequest("Booking is cancelled");
  }

  if (booking.payment_status === PAYMENT_STATUS.PAID) {
    throw badRequest("Booking already paid");
  }

  const amount = Math.round(Number(booking.price) * 100);
  const currency = env.payment.currency || "INR";

  const intent = await createStripePaymentIntent({
    amount,
    currency,
    bookingId: booking.id,
    tenantId: booking.tenant_id,
    customerEmail: booking.customer_email
  });

  await updatePaymentStatus(req.tenantId, booking.id, booking.payment_status || PAYMENT_STATUS.UNPAID, intent.id);

  res.json({
    bookingId: booking.id,
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret,
    amount,
    currency
  });
};

const stripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) throw badRequest("Missing Stripe signature");

  const event = verifyStripeWebhook(req.body, signature);

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const bookingId = paymentIntent.metadata?.bookingId;
      const tenantId = paymentIntent.metadata?.tenantId;
      if (bookingId && tenantId) {
        await updatePaymentStatus(Number(tenantId), bookingId, PAYMENT_STATUS.PAID, paymentIntent.id);
        await updateBookingStatus(Number(tenantId), bookingId, BOOKING_STATUS.CONFIRMED);
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const bookingId = paymentIntent.metadata?.bookingId;
      const tenantId = paymentIntent.metadata?.tenantId;
      if (bookingId && tenantId) {
        await updatePaymentStatus(Number(tenantId), bookingId, PAYMENT_STATUS.FAILED, paymentIntent.id);
      }
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
};

module.exports = { createStripeIntent, stripeWebhook };
