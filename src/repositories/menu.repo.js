const { asNumber, getCollection, nextId, stripMongoIds } = require("./_mongo");

const resolveUrl = (row) => {
  if (row.url) return row.url;
  if (row.page_slug) return row.page_slug === "home" ? "/" : `/${row.page_slug}`;
  return "";
};

const buildPageMap = async (tenantId, pageIds) => {
  if (!pageIds.length) return new Map();
  const pages = await getCollection("pages")
    .find({ tenant_id: asNumber(tenantId), id: { $in: pageIds } })
    .project({ _id: 0, id: 1, slug: 1, title: 1 })
    .toArray();
  return new Map(pages.map((page) => [Number(page.id), page]));
};

const listMenuItems = async (tenantId, location, activeOnly = false) => {
  const query = {
    tenant_id: asNumber(tenantId),
    location
  };
  if (activeOnly) query.is_active = 1;

  const rows = stripMongoIds(
    await getCollection("menu_items")
      .find(query)
      .sort({ position: 1, id: 1 })
      .toArray()
  );

  const pageIds = [...new Set(rows.map((row) => row.page_id).filter((id) => id !== null && id !== undefined))];
  const pageMap = await buildPageMap(tenantId, pageIds);

  return rows.map((row) => {
    const page = row.page_id !== null && row.page_id !== undefined ? pageMap.get(Number(row.page_id)) : null;
    const enriched = {
      ...row,
      page_slug: page?.slug || null,
      page_title: page?.title || null
    };

    return {
      id: row.id,
      location: row.location,
      label: row.label,
      url: resolveUrl(enriched),
      pageId: row.page_id,
      parentId: row.parent_id,
      position: row.position,
      isActive: !!row.is_active
    };
  });
};

const getMenuItemByPage = async (tenantId, location, pageId) => {
  const row = await getCollection("menu_items").findOne({
    tenant_id: asNumber(tenantId),
    location,
    page_id: asNumber(pageId)
  });

  if (!row) return null;
  const { _id, ...rest } = row;
  return rest;
};

const getNextPosition = async (tenantId, location, parentId = null) => {
  const parent = parentId === null || parentId === undefined ? null : asNumber(parentId);
  const row = await getCollection("menu_items")
    .find({
      tenant_id: asNumber(tenantId),
      location,
      parent_id: parent
    })
    .sort({ position: -1, id: -1 })
    .limit(1)
    .next();

  return Number(row?.position || 0) + 10;
};

const ensureMenuItemForPage = async ({ tenantId, location, pageId, label }) => {
  const tenant = asNumber(tenantId);
  const page = asNumber(pageId);
  const existing = await getMenuItemByPage(tenant, location, page);

  if (existing) {
    await getCollection("menu_items").updateOne(
      { id: existing.id, tenant_id: tenant },
      { $set: { is_active: 1, label } }
    );
    return existing.id;
  }

  const id = await nextId("menu_items");
  const position = await getNextPosition(tenant, location, null);

  await getCollection("menu_items").insertOne({
    id,
    tenant_id: tenant,
    location,
    label,
    url: null,
    page_id: page,
    parent_id: null,
    position,
    is_active: 1
  });

  return id;
};

const setMenuItemActiveForPage = async ({ tenantId, location, pageId, isActive }) => {
  const tenant = asNumber(tenantId);
  const page = asNumber(pageId);
  const existing = await getMenuItemByPage(tenant, location, page);
  if (!existing) return false;

  await getCollection("menu_items").updateOne(
    { id: existing.id, tenant_id: tenant },
    { $set: { is_active: isActive ? 1 : 0 } }
  );

  return true;
};

const createMenuItem = async ({ tenantId, location, label, url, pageId, parentId, position, isActive }) => {
  const id = await nextId("menu_items");

  await getCollection("menu_items").insertOne({
    id,
    tenant_id: asNumber(tenantId),
    location,
    label,
    url: url || null,
    page_id: pageId !== undefined && pageId !== null ? asNumber(pageId) : null,
    parent_id: parentId !== undefined && parentId !== null ? asNumber(parentId) : null,
    position: Number(position || 0),
    is_active: isActive ? 1 : 0
  });

  return id;
};

const updateMenuItem = async (tenantId, id, { location, label, url, pageId, parentId, position, isActive }) => {
  const patch = {};
  if (location !== undefined) patch.location = location;
  if (label !== undefined) patch.label = label;
  if (url !== undefined) patch.url = url || null;
  if (pageId !== undefined) patch.page_id = pageId ? asNumber(pageId) : null;
  if (parentId !== undefined) patch.parent_id = parentId ? asNumber(parentId) : null;
  if (position !== undefined) patch.position = Number(position || 0);
  if (isActive !== undefined) patch.is_active = isActive ? 1 : 0;

  if (!Object.keys(patch).length) return false;

  await getCollection("menu_items").updateOne(
    { id: asNumber(id), tenant_id: asNumber(tenantId) },
    { $set: patch }
  );

  return true;
};

const deleteMenuItem = async (tenantId, id) => {
  const tenant = asNumber(tenantId);
  const rootId = asNumber(id);

  const idsToDelete = [rootId];
  for (let index = 0; index < idsToDelete.length; index += 1) {
    const current = idsToDelete[index];
    const children = await getCollection("menu_items")
      .find({ tenant_id: tenant, parent_id: current })
      .project({ _id: 0, id: 1 })
      .toArray();
    for (const child of children) {
      idsToDelete.push(Number(child.id));
    }
  }

  await getCollection("menu_items").deleteMany({ tenant_id: tenant, id: { $in: idsToDelete } });
};

module.exports = {
  listMenuItems,
  getMenuItemByPage,
  ensureMenuItemForPage,
  setMenuItemActiveForPage,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
