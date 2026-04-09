const { asNumber, getCollection, nextId, stripMongoId, stripMongoIds } = require("./_mongo");

const createUser = async ({ tenantId, name, email, phone, passwordHash, role }) => {
  const id = await nextId("users");
  await getCollection("users").insertOne({
    id,
    tenant_id: tenantId === null || tenantId === undefined ? null : asNumber(tenantId),
    name,
    email,
    phone,
    password_hash: passwordHash,
    role,
    created_at: new Date()
  });
  return id;
};

const findByEmail = async (email, tenantId) => {
  const user = await getCollection("users").findOne({
    email,
    tenant_id: tenantId === null || tenantId === undefined ? null : asNumber(tenantId)
  });
  return stripMongoId(user);
};

const findByPhone = async (phone, tenantId) => {
  const user = await getCollection("users").findOne({
    phone,
    tenant_id: tenantId === null || tenantId === undefined ? null : asNumber(tenantId)
  });
  return stripMongoId(user);
};

const findById = async (id) => {
  const user = await getCollection("users").findOne({ id: asNumber(id) });
  return stripMongoId(user);
};

const findAnyByEmail = async (email) => {
  const rows = await getCollection("users").find({ email }).toArray();
  const users = stripMongoIds(rows);
  users.sort((a, b) => {
    const aNull = a.tenant_id === null || a.tenant_id === undefined ? 1 : 0;
    const bNull = b.tenant_id === null || b.tenant_id === undefined ? 1 : 0;
    if (aNull !== bNull) return aNull - bNull;
    return Number(b.id) - Number(a.id);
  });
  return users;
};

const listAdminsByTenant = async (tenantId) => {
  const rows = await getCollection("users")
    .find({
      tenant_id: asNumber(tenantId),
      role: { $in: ["admin", "super_admin"] }
    })
    .sort({ created_at: -1, id: -1 })
    .project({ _id: 0, id: 1, tenant_id: 1, name: 1, email: 1, phone: 1, role: 1, created_at: 1 })
    .toArray();
  return rows;
};

module.exports = { createUser, findByEmail, findByPhone, findById, findAnyByEmail, listAdminsByTenant };
