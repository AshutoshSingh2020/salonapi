const { asNumber, getCollection, nextId, stripMongoId, stripMongoIds } = require("./_mongo");

const getHeaderSettings = async (tenantId) => {
  const row = await getCollection("header_settings")
    .find({ tenant_id: asNumber(tenantId) })
    .sort({ id: 1 })
    .limit(1)
    .next();
  return stripMongoId(row);
};

const upsertHeaderSettings = async (tenantId, data) => {
  const tenant = asNumber(tenantId);
  const collection = getCollection("header_settings");
  const existing = await collection.find({ tenant_id: tenant }).sort({ id: 1 }).limit(1).next();
  const showTopBar = data.showTopBar !== undefined ? data.showTopBar : true;

  const payload = {
    cta_text: data.ctaText || "Book Now",
    cta_link: data.ctaLink || "/booking",
    show_top_bar: showTopBar ? 1 : 0,
    instagram_url: data.instagramUrl || null,
    facebook_url: data.facebookUrl || null,
    whatsapp_url: data.whatsappUrl || null,
    home_label: data.homeLabel || "Home",
    services_label: data.servicesLabel || "Services",
    about_label: data.aboutLabel || "About Us",
    contact_label: data.contactLabel || "Contact Us",
    updated_at: new Date()
  };

  if (existing) {
    await collection.updateOne({ id: existing.id }, { $set: payload });
    return existing.id;
  }

  const id = await nextId("header_settings");
  await collection.insertOne({
    id,
    tenant_id: tenant,
    ...payload
  });
  return id;
};

const listHeaderLinks = async (tenantId, activeOnly = false) => {
  const query = { tenant_id: asNumber(tenantId) };
  if (activeOnly) query.is_active = 1;

  const rows = await getCollection("header_links")
    .find(query)
    .sort({ position: 1, id: 1 })
    .toArray();

  return stripMongoIds(rows);
};

const createHeaderLink = async (tenantId, { label, url, position, isActive }) => {
  const id = await nextId("header_links");
  await getCollection("header_links").insertOne({
    id,
    tenant_id: asNumber(tenantId),
    label,
    url,
    position: Number(position || 0),
    is_active: isActive ? 1 : 0
  });
  return id;
};

const updateHeaderLink = async (tenantId, id, { label, url, position, isActive }) => {
  await getCollection("header_links").updateOne(
    { id: asNumber(id), tenant_id: asNumber(tenantId) },
    {
      $set: {
        label,
        url,
        position: Number(position || 0),
        is_active: isActive ? 1 : 0
      }
    }
  );
};

const deleteHeaderLink = async (tenantId, id) => {
  await getCollection("header_links").deleteOne({
    id: asNumber(id),
    tenant_id: asNumber(tenantId)
  });
};

const getFooterSettings = async (tenantId) => {
  const row = await getCollection("footer_settings")
    .find({ tenant_id: asNumber(tenantId) })
    .sort({ id: 1 })
    .limit(1)
    .next();
  return stripMongoId(row);
};

const upsertFooterSettings = async (tenantId, data) => {
  const tenant = asNumber(tenantId);
  const collection = getCollection("footer_settings");
  const existing = await collection.find({ tenant_id: tenant }).sort({ id: 1 }).limit(1).next();

  const payload = {
    brand_name: data.brandName || "Salonify",
    tagline: data.tagline || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    map_link: data.mapLink || null,
    copyright_text: data.copyrightText || null,
    instagram_url: data.instagramUrl || null,
    facebook_url: data.facebookUrl || null,
    whatsapp_url: data.whatsappUrl || null,
    home_label: data.homeLabel || "Home",
    services_label: data.servicesLabel || "Services",
    about_label: data.aboutLabel || "About Us",
    contact_label: data.contactLabel || "Contact Us",
    updated_at: new Date()
  };

  if (existing) {
    await collection.updateOne({ id: existing.id }, { $set: payload });
    return existing.id;
  }

  const id = await nextId("footer_settings");
  await collection.insertOne({
    id,
    tenant_id: tenant,
    ...payload
  });
  return id;
};

const listFooterLinks = async (tenantId, activeOnly = false) => {
  const query = { tenant_id: asNumber(tenantId) };
  if (activeOnly) query.is_active = 1;

  const rows = await getCollection("footer_links")
    .find(query)
    .sort({ position: 1, id: 1 })
    .toArray();

  return stripMongoIds(rows);
};

const createFooterLink = async (tenantId, { label, url, position, isActive }) => {
  const id = await nextId("footer_links");
  await getCollection("footer_links").insertOne({
    id,
    tenant_id: asNumber(tenantId),
    label,
    url,
    position: Number(position || 0),
    is_active: isActive ? 1 : 0
  });
  return id;
};

const updateFooterLink = async (tenantId, id, { label, url, position, isActive }) => {
  await getCollection("footer_links").updateOne(
    { id: asNumber(id), tenant_id: asNumber(tenantId) },
    {
      $set: {
        label,
        url,
        position: Number(position || 0),
        is_active: isActive ? 1 : 0
      }
    }
  );
};

const deleteFooterLink = async (tenantId, id) => {
  await getCollection("footer_links").deleteOne({
    id: asNumber(id),
    tenant_id: asNumber(tenantId)
  });
};

module.exports = {
  getHeaderSettings,
  upsertHeaderSettings,
  listHeaderLinks,
  createHeaderLink,
  updateHeaderLink,
  deleteHeaderLink,
  getFooterSettings,
  upsertFooterSettings,
  listFooterLinks,
  createFooterLink,
  updateFooterLink,
  deleteFooterLink
};
