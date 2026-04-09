const { normalizeDomain } = require("../utils/domain");
const { badRequest } = require("../utils/errors");
const { asNumber, getCollection, nextId, stripMongoId, stripMongoIds } = require("./_mongo");

const getTenantByDomain = async (domain) => {
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;

  const domainCollection = getCollection("tenant_domains");
  const tenantCollection = getCollection("tenants");

  const exact = await domainCollection
    .find({ domain: normalized })
    .sort({ is_primary: -1, id: -1 })
    .limit(1)
    .next();
  if (exact) {
    const tenant = await tenantCollection.findOne({ id: exact.tenant_id });
    return stripMongoId(tenant);
  }

  const allRows = await domainCollection.find({}).sort({ is_primary: -1, id: -1 }).toArray();
  const match = allRows.find((row) => normalizeDomain(row.domain) === normalized);
  if (!match) return null;
  const tenant = await tenantCollection.findOne({ id: match.tenant_id });
  return stripMongoId(tenant);
};

const listTenants = async () => {
  const tenants = stripMongoIds(await getCollection("tenants").find({}).sort({ id: -1 }).toArray());
  if (!tenants.length) return [];

  const tenantIds = tenants.map((tenant) => tenant.id);
  const adminCounts = await getCollection("users")
    .aggregate([
      {
        $match: {
          tenant_id: { $in: tenantIds },
          role: { $in: ["admin", "super_admin"] }
        }
      },
      {
        $group: {
          _id: "$tenant_id",
          count: { $sum: 1 }
        }
      }
    ])
    .toArray();

  const countMap = new Map(adminCounts.map((row) => [Number(row._id), Number(row.count)]));

  return tenants.map((tenant) => ({
    ...tenant,
    admin_count: countMap.get(Number(tenant.id)) || 0
  }));
};

const createTenant = async ({ name, status }) => {
  const id = await nextId("tenants");
  await getCollection("tenants").insertOne({
    id,
    name,
    status: status || "active",
    created_at: new Date()
  });
  return id;
};

const addTenantDomain = async ({ tenantId, domain, isPrimary }) => {
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    throw badRequest("Invalid domain");
  }

  const existing = await getCollection("tenant_domains").findOne({ domain: normalized });
  if (existing) {
    throw badRequest("Domain already exists");
  }

  const id = await nextId("tenant_domains");

  await getCollection("tenant_domains").insertOne({
    id,
    tenant_id: asNumber(tenantId),
    domain: normalized,
    is_primary: isPrimary ? 1 : 0
  });

  return id;
};

const listTenantDomains = async (tenantId) => {
  const rows = await getCollection("tenant_domains")
    .find({ tenant_id: asNumber(tenantId) })
    .sort({ is_primary: -1, id: -1 })
    .toArray();
  return stripMongoIds(rows);
};

const getSingleActiveTenantId = async () => {
  const rows = await getCollection("tenants")
    .find({ status: "active" })
    .sort({ id: 1 })
    .limit(2)
    .toArray();
  if (rows.length !== 1) return null;
  return Number(rows[0].id);
};

module.exports = {
  getTenantByDomain,
  listTenants,
  createTenant,
  addTenantDomain,
  listTenantDomains,
  getSingleActiveTenantId
};
