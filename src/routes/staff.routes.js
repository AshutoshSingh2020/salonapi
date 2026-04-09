const express = require("express");
const {
  listPublic,
  listAdmin,
  create,
  update,
  remove,
  assignServices
} = require("../controllers/staff.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { staffSchema } = require("../validators/staff.schema");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireTenantContext } = require("../middleware/tenant");

const router = express.Router();

router.use(requireTenantContext);

router.get("/", asyncHandler(listPublic));
router.get("/admin", requireAuth, requireRole("admin"), asyncHandler(listAdmin));
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  upload.single("image"),
  validate(staffSchema),
  asyncHandler(create)
);
router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  upload.single("image"),
  asyncHandler(update)
);
router.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(remove));
router.post("/:id/services", requireAuth, requireRole("admin"), asyncHandler(assignServices));

module.exports = router;
