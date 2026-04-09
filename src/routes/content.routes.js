const express = require("express");
const { getAboutPublic } = require("../controllers/about.controller");
const { getPublic: getPagePublic } = require("../controllers/pages.controller");
const { getHeaderPublic, getFooterPublic } = require("../controllers/theme.controller");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireTenantContext } = require("../middleware/tenant");

const router = express.Router();

router.use(requireTenantContext);

router.get("/about", asyncHandler(getAboutPublic));
router.get("/pages/:slug", asyncHandler(getPagePublic));
router.get("/header", asyncHandler(getHeaderPublic));
router.get("/footer", asyncHandler(getFooterPublic));

module.exports = router;
