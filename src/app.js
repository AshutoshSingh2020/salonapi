const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const routes = require("./routes");
const { router: paymentsRouter, webhookRouter } = require("./routes/payments.routes");
const { env } = require("./config/env");
const { errorHandler } = require("./middleware/error");
const { attachTenantFromHost } = require("./middleware/tenant");
const { responseEnvelope } = require("./middleware/response");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(attachTenantFromHost);

app.use("/uploads", express.static(path.join(__dirname, "../", env.uploadDir)));

// Stripe webhook requires raw body
app.use("/api/payments", webhookRouter);

app.use((req, res, next) => {
  if (req.originalUrl === "/api/payments/stripe/webhook") {
    return next();
  }
  return express.json()(req, res, next);
});

app.use(responseEnvelope);

app.use("/api/payments", paymentsRouter);
app.use("/api", routes);

app.use(errorHandler);

module.exports = { app };
