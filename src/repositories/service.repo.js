const { asNumber, getCollection, nextId, stripMongoId, stripMongoIds } = require("./_mongo");

const listServices = async (tenantId) => {
  const rows = await getCollection("services")
    .find({ tenant_id: asNumber(tenantId), is_active: 1 })
    .sort({ name: 1 })
    .toArray();
  return stripMongoIds(rows);
};

const listAllServices = async (tenantId) => {
  const rows = await getCollection("services")
    .find({ tenant_id: asNumber(tenantId) })
    .sort({ name: 1 })
    .toArray();
  return stripMongoIds(rows);
};

const getServiceById = async (tenantId, id) => {
  const row = await getCollection("services").findOne({
    tenant_id: asNumber(tenantId),
    id: asNumber(id)
  });
  return stripMongoId(row);
};

const createService = async ({
  tenantId,
  name,
  description,
  category,
  details,
  benefits,
  aftercare,
  price,
  durationMinutes,
  imageUrl,
  isActive
}) => {
  const id = await nextId("services");
  await getCollection("services").insertOne({
    id,
    tenant_id: asNumber(tenantId),
    name,
    description,
    category: category || null,
    details: details || null,
    benefits: benefits || null,
    aftercare: aftercare || null,
    detail_layout: "default",
    price: Number(price),
    duration_minutes: Number(durationMinutes),
    image_url: imageUrl || null,
    is_active: isActive ? 1 : 0,
    created_at: new Date()
  });
  return id;
};

const updateService = async (tenantId, id, data) => {
  const patch = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined) patch.description = data.description;
  if (data.category !== undefined) patch.category = data.category;
  if (data.details !== undefined) patch.details = data.details;
  if (data.benefits !== undefined) patch.benefits = data.benefits;
  if (data.aftercare !== undefined) patch.aftercare = data.aftercare;
  if (data.price !== undefined) patch.price = Number(data.price);
  if (data.durationMinutes !== undefined) patch.duration_minutes = Number(data.durationMinutes);
  if (data.imageUrl !== undefined) patch.image_url = data.imageUrl;
  if (data.isActive !== undefined) patch.is_active = data.isActive ? 1 : 0;

  if (!Object.keys(patch).length) return false;

  await getCollection("services").updateOne(
    { tenant_id: asNumber(tenantId), id: asNumber(id) },
    { $set: patch }
  );

  return true;
};

const deleteService = async (tenantId, id) => {
  const tenant = asNumber(tenantId);
  const serviceId = asNumber(id);

  await getCollection("services").deleteOne({ tenant_id: tenant, id: serviceId });
  await getCollection("service_detail_sections").deleteMany({ service_id: serviceId });
  await getCollection("staff_services").deleteMany({ tenant_id: tenant, service_id: serviceId });
};

module.exports = {
  listServices,
  listAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
