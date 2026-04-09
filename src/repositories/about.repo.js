const { asNumber, getCollection, nextId, sessionOptions, stripMongoId } = require("./_mongo");

const getAbout = async (tenantId) => {
  const tenant = asNumber(tenantId);
  const about = await getCollection("about_page")
    .find({ tenant_id: tenant })
    .sort({ id: 1 })
    .limit(1)
    .next();
  return stripMongoId(about);
};

const upsertAbout = async ({ tenantId, title, subtitle, content, highlights, imageUrl }, session = null) => {
  const tenant = asNumber(tenantId);
  const collection = getCollection("about_page");
  const existing = await collection
    .find({ tenant_id: tenant }, sessionOptions(session))
    .sort({ id: 1 })
    .limit(1)
    .next();

  const payload = {
    title,
    subtitle: subtitle || null,
    content: content || null,
    highlights: highlights || null,
    image_url: imageUrl || null,
    updated_at: new Date()
  };

  if (existing) {
    await collection.updateOne({ id: existing.id, tenant_id: tenant }, { $set: payload }, sessionOptions(session));
    return existing.id;
  }

  const id = await nextId("about_page", session);
  await collection.insertOne(
    {
      id,
      tenant_id: tenant,
      ...payload,
      created_at: new Date()
    },
    sessionOptions(session)
  );
  return id;
};

module.exports = { getAbout, upsertAbout };
