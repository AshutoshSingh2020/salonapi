const { asNumber, getCollection, nextId, stripMongoId, stripMongoIds } = require("./_mongo");

const listStaff = async (tenantId) => {
  const rows = await getCollection("staff")
    .find({ tenant_id: asNumber(tenantId), is_active: 1 })
    .sort({ name: 1 })
    .toArray();
  return stripMongoIds(rows);
};

const listAllStaff = async (tenantId) => {
  const rows = await getCollection("staff")
    .find({ tenant_id: asNumber(tenantId) })
    .sort({ name: 1 })
    .toArray();
  return stripMongoIds(rows);
};

const getStaffById = async (tenantId, id) => {
  const row = await getCollection("staff").findOne({
    tenant_id: asNumber(tenantId),
    id: asNumber(id)
  });
  return stripMongoId(row);
};

const createStaff = async ({ tenantId, name, phone, specialization, imageUrl, isActive }) => {
  const id = await nextId("staff");
  await getCollection("staff").insertOne({
    id,
    tenant_id: asNumber(tenantId),
    name,
    phone,
    specialization,
    image_url: imageUrl || null,
    is_active: isActive ? 1 : 0,
    created_at: new Date()
  });
  return id;
};

const updateStaff = async (tenantId, id, data) => {
  const patch = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.phone !== undefined) patch.phone = data.phone;
  if (data.specialization !== undefined) patch.specialization = data.specialization;
  if (data.imageUrl !== undefined) patch.image_url = data.imageUrl;
  if (data.isActive !== undefined) patch.is_active = data.isActive ? 1 : 0;

  if (!Object.keys(patch).length) return false;

  await getCollection("staff").updateOne(
    { id: asNumber(id), tenant_id: asNumber(tenantId) },
    { $set: patch }
  );

  return true;
};

const deleteStaff = async (tenantId, id) => {
  const tenant = asNumber(tenantId);
  const staffId = asNumber(id);

  await getCollection("staff").deleteOne({ id: staffId, tenant_id: tenant });
  await getCollection("staff_services").deleteMany({ tenant_id: tenant, staff_id: staffId });
  await getCollection("staff_working_hours").deleteMany({ tenant_id: tenant, staff_id: staffId });
};

const setStaffServices = async (tenantId, staffId, serviceIds) => {
  const tenant = asNumber(tenantId);
  const staff = asNumber(staffId);

  await getCollection("staff_services").deleteMany({ tenant_id: tenant, staff_id: staff });
  if (!serviceIds || !serviceIds.length) return;

  const numericServiceIds = [...new Set(serviceIds.map((id) => asNumber(id)).filter((id) => id !== null))];
  if (!numericServiceIds.length) return;

  const services = await getCollection("services")
    .find({ tenant_id: tenant, id: { $in: numericServiceIds } })
    .project({ _id: 0, id: 1 })
    .toArray();

  if (!services.length) return;

  await getCollection("staff_services").insertMany(
    services.map((service) => ({
      tenant_id: tenant,
      staff_id: staff,
      service_id: Number(service.id)
    }))
  );
};

const listStaffByService = async (tenantId, serviceId) => {
  const tenant = asNumber(tenantId);
  const service = asNumber(serviceId);

  const mappings = await getCollection("staff_services")
    .find({ tenant_id: tenant, service_id: service })
    .project({ _id: 0, staff_id: 1 })
    .toArray();

  if (mappings.length) {
    const staffIds = [...new Set(mappings.map((row) => Number(row.staff_id)))];
    const rows = await getCollection("staff")
      .find({ tenant_id: tenant, is_active: 1, id: { $in: staffIds } })
      .sort({ name: 1 })
      .toArray();
    return stripMongoIds(rows);
  }

  const hasAnyMapping = (await getCollection("staff_services").countDocuments({ tenant_id: tenant })) > 0;
  if (!hasAnyMapping) {
    return listStaff(tenant);
  }

  return [];
};

module.exports = {
  listStaff,
  listAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  setStaffServices,
  listStaffByService
};
