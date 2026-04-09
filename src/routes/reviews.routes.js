const express = require("express");
const {
  listPublic,
  listAdmin,
  create,
  updateStatus,
  remove
} = require("../controllers/reviews.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { reviewSchema } = require("../validators/review.schema");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireTenantContext } = require("../middleware/tenant");

const router = express.Router();

router.use(requireTenantContext);

router.get("/", asyncHandler(listPublic));
router.get("/admin", requireAuth, requireRole("admin"), asyncHandler(listAdmin));
router.post("/", requireAuth, requireRole("customer"), validate(reviewSchema), asyncHandler(create));
router.patch("/:id/status", requireAuth, requireRole("admin"), asyncHandler(updateStatus));
router.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(remove));

module.exports = router;
