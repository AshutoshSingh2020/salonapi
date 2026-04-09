const express = require("express");
const {
  listAdmin,
  listMine,
  availability,
  create,
  checkIn,
  updateStatus,
  cancel
} = require("../controllers/bookings.controller");
const { requireAuth, requireRole, attachUserIfPresent } = require("../middleware/auth");
const { createBookingSchema, availabilitySchema, checkInSchema } = require("../validators/booking.schema");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireTenantContext } = require("../middleware/tenant");

const router = express.Router();

router.use(requireTenantContext);

router.get("/availability", validate(availabilitySchema), asyncHandler(availability));
router.get("/", requireAuth, requireRole("admin"), asyncHandler(listAdmin));
router.get("/my", requireAuth, asyncHandler(listMine));
router.post(
  "/",
  attachUserIfPresent,
  validate(createBookingSchema),
  asyncHandler(create)
);
router.post(
  "/:id/check-in",
  requireAuth,
  requireRole("staff"),
  validate(checkInSchema),
  asyncHandler(checkIn)
);
router.patch("/:id/status", requireAuth, requireRole("admin"), asyncHandler(updateStatus));
router.delete("/:id", requireAuth, asyncHandler(cancel));

module.exports = router;
