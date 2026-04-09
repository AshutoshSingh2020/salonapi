const express = require("express");
const authRoutes = require("./auth.routes");
const servicesRoutes = require("./services.routes");
const staffRoutes = require("./staff.routes");
const bookingsRoutes = require("./bookings.routes");
const reviewsRoutes = require("./reviews.routes");
const galleryRoutes = require("./gallery.routes");
const contentRoutes = require("./content.routes");
const contactRoutes = require("./contact.routes");
const adminRoutes = require("./admin.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/services", servicesRoutes);
router.use("/staff", staffRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/gallery", galleryRoutes);
router.use("/content", contentRoutes);
router.use("/contact", contactRoutes);
router.use("/admin", adminRoutes);

router.get("/health", (_req, res) => res.json({ status: "ok" }));

module.exports = router;
