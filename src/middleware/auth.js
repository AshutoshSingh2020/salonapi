const { verifyToken } = require("../config/jwt");
const { unauthorized, forbidden } = require("../utils/errors");

const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return next(unauthorized("Missing auth token"));
  }
  try {
    req.user = verifyToken(token);
    return next();
  } catch (error) {
    return next(unauthorized("Invalid or expired token"));
  }
};

const attachUserIfPresent = (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return next();
  }
  try {
    req.user = verifyToken(token);
  } catch (_error) {
    // ignore invalid token for optional auth
  }
  return next();
};

const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(unauthorized("Auth required"));
  }
  if (req.user.role === "super_admin") {
    return next();
  }
  if (!roles.includes(req.user.role)) {
    return next(forbidden("Insufficient permissions"));
  }
  return next();
};

module.exports = { requireAuth, requireRole, attachUserIfPresent };
