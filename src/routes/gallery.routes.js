const express = require("express");
const { list, create, remove } = require("../controllers/gallery.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireTenantContext } = require("../middleware/tenant");

const router = express.Router();

router.use(requireTenantContext);

router.get("/", asyncHandler(list));
router.post("/", requireAuth, requireRole("super_admin"), upload.single("image"), asyncHandler(create));
router.delete("/:id", requireAuth, requireRole("super_admin"), asyncHandler(remove));

module.exports = router;
