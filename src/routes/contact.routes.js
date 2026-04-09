const express = require("express");
const { create } = require("../controllers/contact.controller");
const { validate } = require("../middleware/validate");
const { contactSchema } = require("../validators/contact.schema");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireTenantContext } = require("../middleware/tenant");

const router = express.Router();

router.use(requireTenantContext);

router.post("/", validate(contactSchema), asyncHandler(create));

module.exports = router;
