const { asNumber, getCollection, nextId, sessionOptions, stripMongoId, stripMongoIds } = require("./_mongo");

const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "checked_in"];

const enrichBookings = async (tenantId, bookings) => {
  const rows = stripMongoIds(bookings);
  if (!rows.length) return [];

  const serviceIds = [...new Set(rows.map((row) => row.service_id).filter((id) => id !== null && id !== undefined))];
  const staffIds = [...new Set(rows.map((row) => row.staff_id).filter((id) => id !== null && id !== undefined))];

  const [services, staffMembers] = await Promise.all([
    serviceIds.length
      ? getCollection("services")
          .find({ tenant_id: asNumber(tenantId), id: { $in: serviceIds } })
          .project({ _id: 0, id: 1, name: 1, price: 1 })
          .toArray()
      : [],
    staffIds.length
      ? getCollection("staff")
          .find({ tenant_id: asNumber(tenantId), id: { $in: staffIds } })
          .project({ _id: 0, id: 1, name: 1 })
          .toArray()
      : []
  ]);

  const serviceMap = new Map(services.map((service) => [Number(service.id), service]));
  const staffMap = new Map(staffMembers.map((staff) => [Number(staff.id), staff]));

  return rows.map((row) => ({
    ...row,
    service_name: serviceMap.get(Number(row.service_id))?.name || null,
    staff_name: row.staff_id ? staffMap.get(Number(row.staff_id))?.name || null : null
  }));
};

const listBookings = async (tenantId) => {
  const rows = await getCollection("bookings")
    .find({ tenant_id: asNumber(tenantId) })
    .sort({ booking_date: -1, start_time: -1, id: -1 })
    .toArray();
  return enrichBookings(tenantId, rows);
};

const listBookingsByUser = async (tenantId, userId) => {
  const rows = await getCollection("bookings")
    .find({ tenant_id: asNumber(tenantId), user_id: asNumber(userId) })
    .sort({ booking_date: -1, start_time: -1, id: -1 })
    .toArray();
  return enrichBookings(tenantId, rows);
};

const getBookingById = async (tenantId, id) => {
  const row = await getCollection("bookings").findOne({
    tenant_id: asNumber(tenantId),
    id: asNumber(id)
  });
  return stripMongoId(row);
};

const getBookingWithService = async (tenantId, id) => {
  const booking = await getBookingById(tenantId, id);
  if (!booking) return null;

  const service = await getCollection("services").findOne(
    { id: booking.service_id, tenant_id: asNumber(tenantId) },
    { projection: { _id: 0, id: 1, name: 1, price: 1 } }
  );

  return {
    ...booking,
    price: service?.price || 0,
    service_name: service?.name || null
  };
};

const createBooking = async (db, data) => {
  const session = db || null;
  const id = await nextId("bookings", session);

  await getCollection("bookings").insertOne(
    {
      id,
      tenant_id: asNumber(data.tenantId),
      user_id: data.userId ? asNumber(data.userId) : null,
      service_id: asNumber(data.serviceId),
      staff_id: data.staffId ? asNumber(data.staffId) : null,
      booking_date: data.bookingDate,
      start_time: data.startTime,
      end_time: data.endTime,
      status: data.status,
      payment_mode: data.paymentMode || "offline",
      payment_status: data.paymentStatus,
      payment_id: data.paymentId || null,
      check_in_code: data.checkInCode || null,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: data.customerEmail || null,
      notes: data.notes || null,
      created_at: new Date()
    },
    sessionOptions(session)
  );

  return id;
};

const findOverlappingBookings = async (db, tenantId, staffId, bookingDate, startTime, endTime) => {
  const session = db || null;
  const rows = await getCollection("bookings")
    .find(
      {
        tenant_id: asNumber(tenantId),
        staff_id: asNumber(staffId),
        booking_date: bookingDate,
        status: { $in: ACTIVE_BOOKING_STATUSES },
        end_time: { $gt: startTime },
        start_time: { $lt: endTime }
      },
      sessionOptions(session)
    )
    .toArray();

  return stripMongoIds(rows);
};

const listBookingsForStaffDate = async (tenantId, staffId, bookingDate) => {
  const rows = await getCollection("bookings")
    .find({
      tenant_id: asNumber(tenantId),
      staff_id: asNumber(staffId),
      booking_date: bookingDate,
      status: { $in: ACTIVE_BOOKING_STATUSES }
    })
    .toArray();

  return stripMongoIds(rows);
};

const updateBookingStatus = async (tenantId, id, status) => {
  await getCollection("bookings").updateOne(
    { id: asNumber(id), tenant_id: asNumber(tenantId) },
    { $set: { status } }
  );
};

const updatePaymentStatus = async (tenantId, id, paymentStatus, paymentId) => {
  await getCollection("bookings").updateOne(
    { id: asNumber(id), tenant_id: asNumber(tenantId) },
    { $set: { payment_status: paymentStatus, payment_id: paymentId || null } }
  );
};

const deleteBooking = async (tenantId, id) => {
  await getCollection("bookings").deleteOne({
    id: asNumber(id),
    tenant_id: asNumber(tenantId)
  });
};

module.exports = {
  listBookings,
  listBookingsByUser,
  getBookingById,
  getBookingWithService,
  createBooking,
  findOverlappingBookings,
  listBookingsForStaffDate,
  updateBookingStatus,
  updatePaymentStatus,
  deleteBooking
};
