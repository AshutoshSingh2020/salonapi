const bcrypt = require("bcryptjs");
const { createUser, findByEmail, findByPhone, findById, findAnyByEmail } = require("../repositories/user.repo");
const { signToken } = require("../config/jwt");
const { badRequest, unauthorized } = require("../utils/errors");
const { ROLES } = require("../utils/constants");

const registerCustomer = async ({ tenantId, name, email, phone, password }) => {
  if (!tenantId) throw badRequest("Tenant required");
  const existingEmail = await findByEmail(email, tenantId);
  if (existingEmail) throw badRequest("Email already registered");
  const existingPhone = await findByPhone(phone, tenantId);
  if (existingPhone) throw badRequest("Phone already registered");
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = await createUser({ tenantId, name, email, phone, passwordHash, role: ROLES.CUSTOMER });
  const token = signToken({ id: userId, role: ROLES.CUSTOMER, name, tenantId });
  return { token, userId };
};

const login = async ({ tenantId, email, password }) => {
  let user = null;
  if (tenantId) {
    user = await findByEmail(email, tenantId);
  }
  if (!user) {
    user = await findByEmail(email, null);
  }
  if (!user) {
    const matchingUsers = await findAnyByEmail(email);
    if (!matchingUsers.length) {
      throw unauthorized("Invalid credentials");
    }
    if (matchingUsers.length === 1) {
      [user] = matchingUsers;
    } else {
      const adminCandidates = matchingUsers.filter(
        (row) => row.role === ROLES.ADMIN || row.role === ROLES.SUPER_ADMIN
      );
      if (adminCandidates.length === 1) {
        [user] = adminCandidates;
      } else {
        throw badRequest("Multiple accounts found for this email. Contact support.");
      }
    }
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw unauthorized("Invalid credentials");
  const token = signToken({ id: user.id, role: user.role, name: user.name, tenantId: user.tenant_id || null });
  return { token, user };
};

const loginWithPhone = async ({ tenantId, phone }) => {
  let user = await findByPhone(phone, tenantId);
  if (!user) {
    if (!tenantId) throw badRequest("Tenant required");
    const name = `Customer ${phone.slice(-4)}`;
    const email = `${phone}@local.salon`;
    const passwordHash = await bcrypt.hash(`${phone}-${Date.now()}`, 10);
    const userId = await createUser({ tenantId, name, email, phone, passwordHash, role: ROLES.CUSTOMER });
    user = await findById(userId);
  }
  const token = signToken({ id: user.id, role: user.role, name: user.name, tenantId: user.tenant_id || null });
  return { token, user };
};

const getProfile = async (userId) => {
  const user = await findById(userId);
  if (!user) throw unauthorized("User not found");
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    tenantId: user.tenant_id || null
  };
};

module.exports = { registerCustomer, login, loginWithPhone, getProfile };
