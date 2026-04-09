const { asNumber, getCollection, nextId, stripMongoIds } = require("./_mongo");

const listGallery = async (tenantId) => {
  const rows = await getCollection("gallery")
    .find({ tenant_id: asNumber(tenantId) })
    .sort({ created_at: -1, id: -1 })
    .toArray();
  return stripMongoIds(rows);
};

const createGallery = async ({ tenantId, title, imageUrl, category }) => {
  const id = await nextId("gallery");
  await getCollection("gallery").insertOne({
    id,
    tenant_id: asNumber(tenantId),
    title: title || null,
    image_url: imageUrl || null,
    category: category || null,
    created_at: new Date()
  });
  return id;
};

const deleteGallery = async (tenantId, id) => {
  await getCollection("gallery").deleteOne({
    id: asNumber(id),
    tenant_id: asNumber(tenantId)
  });
};

module.exports = { listGallery, createGallery, deleteGallery };
