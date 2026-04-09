const { registerCustomer, login, loginWithPhone, getProfile } = require("../services/auth.service");
const { getTenantByDomain } = require("../repositories/tenant.repo");
const { badRequest } = require("../utils/errors");

const register = async (req, res) => {
  const { name, email, phone, password } = req.validated.body;
  const data = await registerCustomer({ tenantId: req.tenantId, name, email, phone, password });
  res.status(201).json(data);
};

const loginUser = async (req, res) => {
  const { email, password, tenantId, tenantDomain } = req.validated.body;
  let resolvedTenantId = null;
  if (tenantId) {
    resolvedTenantId = Number(tenantId);
  }
  if (!resolvedTenantId && tenantDomain) {
    const tenant = await getTenantByDomain(tenantDomain);
    if (!tenant) {
      throw badRequest("Tenant domain not found. Please verify tenant domain.");
    }
    resolvedTenantId = tenant?.id || null;
  }
  if (!resolvedTenantId && req.tenantId) {
    resolvedTenantId = req.tenantId;
  }
  const data = await login({ tenantId: resolvedTenantId, email, password });
  res.json(data);
};

const loginPhone = async (req, res) => {
  const { phone, tenantId, tenantDomain } = req.validated.body;
  let resolvedTenantId = null;
  if (tenantId) {
    resolvedTenantId = Number(tenantId);
  }
  if (!resolvedTenantId && tenantDomain) {
    const tenant = await getTenantByDomain(tenantDomain);
    if (!tenant) {
      throw badRequest("Tenant domain not found. Please verify tenant domain.");
    }
    resolvedTenantId = tenant?.id || null;
  }
  if (!resolvedTenantId && req.tenantId) {
    resolvedTenantId = req.tenantId;
  }
  const data = await loginWithPhone({ tenantId: resolvedTenantId, phone });
  res.json(data);
};

const me = async (req, res) => {
  const profile = await getProfile(req.user.id);
  res.json(profile);
};

module.exports = { register, loginUser, loginPhone, me };
