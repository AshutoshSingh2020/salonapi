const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const inferMongoDbName = (uri) => {
  if (!uri) return null;
  try {
    const parsed = new URL(uri);
    const dbName = parsed.pathname ? parsed.pathname.replace(/^\//, "") : "";
    return dbName || null;
  } catch (_error) {
    return null;
  }
};

const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/salon_booking";
const inferredDbName = inferMongoDbName(mongoUri);

const env = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  db: {
    uri: mongoUri,
    database: process.env.MONGODB_DB || process.env.DB_NAME || inferredDbName || "salon_booking"
  },
  jwt: {
    secret: process.env.JWT_SECRET || "dev_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  },
  mail: {
    host: process.env.MAIL_HOST || "",
    port: Number(process.env.MAIL_PORT || 587),
    user: process.env.MAIL_USER || "",
    pass: process.env.MAIL_PASS || "",
    from: process.env.MAIL_FROM || "no-reply@salon.com"
  },
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  baseUrl: process.env.BASE_URL || "http://localhost:4000",
  payment: {
    provider: process.env.PAYMENT_PROVIDER || "none",
    key: process.env.PAYMENT_KEY || "",
    secret: process.env.PAYMENT_SECRET || "",
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || "",
    currency: process.env.PAYMENT_CURRENCY || "INR"
  }
};

module.exports = { env };
