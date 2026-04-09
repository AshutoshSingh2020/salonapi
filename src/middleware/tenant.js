const { getTenantByDomain, getSingleActiveTenantId } = require("../repositories/tenant.repo");
const { verifyToken } = require("../config/jwt");
const { notFound, badRequest } = require("../utils/errors");
const { normalizeDomain } = require("../utils/domain");

const sanitizeDomain = (value) => {
  return normalizeDomain(value);
};

const isGenericLocalHost = (value) => {
  return value === "localhost" || value === "127.0.0.1" || value === "::1";
};

const resolveTenantDomainFromRequest = (req) => {
  const headerValue = Array.isArray(req.headers["x-tenant-domain"])
    ? req.headers["x-tenant-domain"][0]
    : req.headers["x-tenant-domain"];
  const queryValue = typeof req.query?.tenantDomain === "string" ? req.query.tenantDomain : null;
  return sanitizeDomain(headerValue || queryValue);
};

const parseHostFromHeader = (value) => {
  if (!value || typeof value !== "string") return null;
  const first = value.split(",")[0]?.trim();
  if (!first) return null;
  return sanitizeDomain(first.split(":")[0]);
};

const parseHostFromUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    return sanitizeDomain(parsed.hostname);
  } catch (_error) {
    return null;
  }
};

const attachTenantFromHost = async (req, _res, next) => {
  if (req.tenantId) return next();
  const hostDomain = sanitizeDomain(req.hostname);
  const headerDomain = resolveTenantDomainFromRequest(req);
  const forwardedHost = parseHostFromHeader(req.headers["x-forwarded-host"]);
  const originHost = parseHostFromUrl(req.headers.origin);
  const refererHost = parseHostFromUrl(req.headers.referer);
  const candidates = [
    { value: headerDomain, explicit: true },
    { value: hostDomain, explicit: false },
    { value: forwardedHost, explicit: false },
    { value: originHost, explicit: false },
    { value: refererHost, explicit: false }
  ]
    .filter((item) => item.value)
    .filter((item) => item.explicit || !isGenericLocalHost(item.value));
  for (const item of candidates) {
    const domain = item.value;
    const tenant = await getTenantByDomain(domain);
    if (tenant) {
      req.tenant = tenant;
      req.tenantId = tenant.id;
      break;
    }
  }
  return next();
};

const resolveTenantFromRequest = (req) => {
  const headerValue = req.headers["x-tenant-id"];
  const queryValue = req.query.tenantId;
  const bodyValue = req.body?.tenantId;
  const raw = headerValue || queryValue || bodyValue;
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const attachUserFromAuthHeader = (req) => {
  if (req.user) return;
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return;
  try {
    req.user = verifyToken(token);
  } catch (_error) {
    // Leave user unset; auth middleware will return the proper 401.
  }
};

const requireTenantContext = async (req, _res, next) => {
  attachUserFromAuthHeader(req);
  if (req.user && req.user.role === "super_admin") {
    const selected = resolveTenantFromRequest(req);
    if (selected) {
      req.tenantId = selected;
      return next();
    }
    if (req.tenantId) return next();
    const singleTenantId = await getSingleActiveTenantId();
    if (singleTenantId) {
      req.tenantId = singleTenantId;
      return next();
    }
    return next(
      badRequest("Tenant context required (x-tenant-id).", [
        { field: "x-tenant-id", message: "Select/switch tenant first, then retry this request." }
      ])
    );
  }
  if (req.user && req.user.tenantId) {
    req.tenantId = req.user.tenantId;
    return next();
  }
  if (req.tenantId) return next();
  return next(notFound("Tenant not found for hostname."));
};

module.exports = { attachTenantFromHost, requireTenantContext };
