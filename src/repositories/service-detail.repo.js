const { withTransaction } = require("../config/db");
const { asNumber, getCollection, nextId, sessionOptions, stripMongoIds } = require("./_mongo");

const parseJson = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (_err) {
      return value;
    }
  }
  return value;
};

const listDetailSections = async (tenantId, serviceId) => {
  const service = await getCollection("services").findOne({
    id: asNumber(serviceId),
    tenant_id: asNumber(tenantId)
  });
  if (!service) return [];

  const rows = await getCollection("service_detail_sections")
    .find({ service_id: asNumber(serviceId) })
    .sort({ order_no: 1, id: 1 })
    .toArray();

  return stripMongoIds(rows).map((row) => ({
    id: row.id,
    type: row.component_type,
    data: parseJson(row.component_data),
    order: row.order_no
  }));
};

const replaceDetailSections = async (tenantId, serviceId, sections = []) => {
  const tenant = asNumber(tenantId);
  const service = asNumber(serviceId);

  return withTransaction(async (session) => {
    const serviceDoc = await getCollection("services").findOne(
      { id: service, tenant_id: tenant },
      sessionOptions(session)
    );
    if (!serviceDoc) return;

    await getCollection("service_detail_sections").deleteMany({ service_id: service }, sessionOptions(session));

    for (let index = 0; index < sections.length; index += 1) {
      const section = sections[index] || {};
      const data = section.data === undefined ? {} : section.data;
      const payload = typeof data === "string" ? data : JSON.stringify(data);

      const id = await nextId("service_detail_sections", session);
      await getCollection("service_detail_sections").insertOne(
        {
          id,
          service_id: service,
          component_type: section.type,
          component_data: payload,
          order_no: index
        },
        sessionOptions(session)
      );
    }
  });
};

const getDetailLayout = async (tenantId, serviceId) => {
  const service = await getCollection("services").findOne(
    { id: asNumber(serviceId), tenant_id: asNumber(tenantId) },
    { projection: { _id: 0, detail_layout: 1 } }
  );
  return service?.detail_layout || "default";
};

const updateDetailLayout = async (tenantId, serviceId, layout) => {
  await getCollection("services").updateOne(
    { id: asNumber(serviceId), tenant_id: asNumber(tenantId) },
    { $set: { detail_layout: layout || "default" } }
  );
};

module.exports = {
  listDetailSections,
  replaceDetailSections,
  getDetailLayout,
  updateDetailLayout
};
