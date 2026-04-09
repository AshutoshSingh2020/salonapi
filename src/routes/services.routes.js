const express = require("express");
const {
  listPublic,
  listAdmin,
  getById,
  getDetail,
  create,
  update,
  updateDetail,
  remove
} = require("../controllers/services.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { serviceSchema } = require("../validators/service.schema");
const { serviceDetailSchema } = require("../validators/service-detail.schema");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireTenantContext } = require("../middleware/tenant");

const router = express.Router();

router.use(requireTenantContext);

router.get("/", asyncHandler(listPublic));
router.get("/admin", requireAuth, requireRole("super_admin"), asyncHandler(listAdmin));
router.get("/:id", asyncHandler(getById));
router.get("/:id/detail", asyncHandler(getDetail));
router.post(
  "/",
  requireAuth,
  requireRole("super_admin"),
  upload.single("image"),
  validate(serviceSchema),
  asyncHandler(create)
);
router.put(
  "/:id",
  requireAuth,
  requireRole("super_admin"),
  upload.single("image"),
  asyncHandler(update)
);
router.put(
  "/:id/detail",
  requireAuth,
  requireRole("super_admin"),
  validate(serviceDetailSchema),
  asyncHandler(updateDetail)
);
router.delete("/:id", requireAuth, requireRole("super_admin"), asyncHandler(remove));

module.exports = router;
