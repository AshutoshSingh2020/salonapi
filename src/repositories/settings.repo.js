const { asNumber, getCollection, nextId, stripMongoId } = require("./_mongo");

const getSettings = async (tenantId) => {
  const settings = await getCollection("salon_settings")
    .find({ tenant_id: asNumber(tenantId) })
    .sort({ id: 1 })
    .limit(1)
    .next();
  return stripMongoId(settings);
};

const upsertSettings = async ({ tenantId, openTime, closeTime, slotDurationMinutes, timezone }) => {
  const tenant = asNumber(tenantId);
  const collection = getCollection("salon_settings");
  const existing = await collection.find({ tenant_id: tenant }).sort({ id: 1 }).limit(1).next();

  const payload = {
    open_time: openTime,
    close_time: closeTime,
    slot_duration_minutes: Number(slotDurationMinutes),
    timezone: timezone || existing?.timezone || "UTC"
  };

  if (existing) {
    await collection.updateOne({ id: existing.id, tenant_id: tenant }, { $set: payload });
    return existing.id;
  }

  const id = await nextId("salon_settings");
  await collection.insertOne({
    id,
    tenant_id: tenant,
    ...payload
  });
  return id;
};

module.exports = { getSettings, upsertSettings };
