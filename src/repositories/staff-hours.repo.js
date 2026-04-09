const { asNumber, getCollection, nextId, stripMongoId } = require("./_mongo");

const getWorkingHoursForStaffDay = async (tenantId, staffId, dayOfWeek) => {
  const row = await getCollection("staff_working_hours").findOne({
    tenant_id: asNumber(tenantId),
    staff_id: asNumber(staffId),
    day_of_week: Number(dayOfWeek)
  });
  return stripMongoId(row);
};

const upsertWorkingHours = async (tenantId, staffId, dayOfWeek, startTime, endTime, isOff) => {
  const tenant = asNumber(tenantId);
  const staff = asNumber(staffId);
  const day = Number(dayOfWeek);
  const collection = getCollection("staff_working_hours");

  const existing = await collection.findOne({ tenant_id: tenant, staff_id: staff, day_of_week: day });

  const payload = {
    start_time: startTime,
    end_time: endTime,
    is_off: isOff ? 1 : 0
  };

  if (existing) {
    await collection.updateOne({ id: existing.id }, { $set: payload });
    return existing.id;
  }

  const id = await nextId("staff_working_hours");
  await collection.insertOne({
    id,
    tenant_id: tenant,
    staff_id: staff,
    day_of_week: day,
    ...payload
  });
  return id;
};

module.exports = { getWorkingHoursForStaffDay, upsertWorkingHours };
