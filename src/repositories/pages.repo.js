const { withTransaction } = require("../config/db");
const { asNumber, getCollection, nextId, sessionOptions, stripMongoId, stripMongoIds } = require("./_mongo");

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

const mapSectionRow = (row) => ({
  id: row.id,
  type: row.component_type,
  data: parseJson(row.component_data),
  order: row.order_no
});

const listPages = async (tenantId) => {
  const rows = await getCollection("pages")
    .find({ tenant_id: asNumber(tenantId) })
    .sort({ updated_at: -1, id: -1 })
    .toArray();
  return stripMongoIds(rows);
};

const getPageById = async (tenantId, id) => {
  const row = await getCollection("pages").findOne({
    tenant_id: asNumber(tenantId),
    id: asNumber(id)
  });
  return stripMongoId(row);
};

const getPageBySlug = async (tenantId, slug, activeOnly = false) => {
  const query = {
    tenant_id: asNumber(tenantId),
    slug
  };
  if (activeOnly) {
    query.status = 1;
  }
  const row = await getCollection("pages").findOne(query);
  return stripMongoId(row);
};

const listPageSections = async (pageId) => {
  const rows = await getCollection("page_sections")
    .find({ page_id: asNumber(pageId) })
    .sort({ order_no: 1, id: 1 })
    .toArray();

  return stripMongoIds(rows).map(mapSectionRow);
};

const createPage = async ({ tenantId, title, slug, metaTitle, metaDescription, template, status }) => {
  const id = await nextId("pages");
  const now = new Date();

  await getCollection("pages").insertOne({
    id,
    tenant_id: asNumber(tenantId),
    title,
    slug,
    meta_title: metaTitle || null,
    meta_description: metaDescription || null,
    template: template || "default",
    status: status ? 1 : 0,
    created_at: now,
    updated_at: now
  });

  return id;
};

const updatePage = async (tenantId, id, data) => {
  const patch = {};

  if (data.title !== undefined) patch.title = data.title;
  if (data.slug !== undefined) patch.slug = data.slug;
  if (data.metaTitle !== undefined) patch.meta_title = data.metaTitle || null;
  if (data.metaDescription !== undefined) patch.meta_description = data.metaDescription || null;
  if (data.template !== undefined) patch.template = data.template || "default";
  if (data.status !== undefined) patch.status = data.status ? 1 : 0;

  if (!Object.keys(patch).length) return false;

  patch.updated_at = new Date();

  await getCollection("pages").updateOne(
    { tenant_id: asNumber(tenantId), id: asNumber(id) },
    { $set: patch }
  );

  return true;
};

const deletePage = async (tenantId, id) => {
  const tenant = asNumber(tenantId);
  const pageId = asNumber(id);

  await getCollection("pages").deleteOne({ tenant_id: tenant, id: pageId });
  await getCollection("page_sections").deleteMany({ page_id: pageId });
  await getCollection("menu_items").updateMany(
    { tenant_id: tenant, page_id: pageId },
    { $set: { page_id: null } }
  );
};

const replacePageSections = async (pageId, sections = []) =>
  withTransaction(async (session) => {
    const page = asNumber(pageId);

    await getCollection("page_sections").deleteMany({ page_id: page }, sessionOptions(session));

    for (let index = 0; index < sections.length; index += 1) {
      const section = sections[index] || {};
      const data = section.data === undefined ? {} : section.data;
      const payload = typeof data === "string" ? data : JSON.stringify(data);
      const id = await nextId("page_sections", session);

      await getCollection("page_sections").insertOne(
        {
          id,
          page_id: page,
          component_type: section.type,
          component_data: payload,
          order_no: index
        },
        sessionOptions(session)
      );
    }
  });

module.exports = {
  listPages,
  getPageById,
  getPageBySlug,
  listPageSections,
  createPage,
  updatePage,
  deletePage,
  replacePageSections
};
