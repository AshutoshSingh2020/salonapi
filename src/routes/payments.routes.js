const express = require("express");
const { createStripeIntent, stripeWebhook } = require("../controllers/payments.controller");
const { requireAuth } = require("../middleware/auth");
const { requireTenantContext } = require("../middleware/tenant");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();
const webhookRouter = express.Router();

router.post("/stripe/create-intent", requireAuth, requireTenantContext, asyncHandler(createStripeIntent));

webhookRouter.post("/stripe/webhook", express.raw({ type: "application/json" }), asyncHandler(stripeWebhook));

module.exports = { router, webhookRouter };
