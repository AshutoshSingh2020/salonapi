const express = require("express");
const { register, loginUser, loginPhone, me } = require("../controllers/auth.controller");
const { registerSchema, loginSchema, phoneLoginSchema } = require("../validators/auth.schema");
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.post("/register", validate(registerSchema), asyncHandler(register));
router.post("/login", validate(loginSchema), asyncHandler(loginUser));
router.post("/phone", validate(phoneLoginSchema), asyncHandler(loginPhone));
router.get("/me", requireAuth, asyncHandler(me));

module.exports = router;
