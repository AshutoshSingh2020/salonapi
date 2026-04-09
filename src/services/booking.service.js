const { withTransaction } = require("../config/db");
const { getServiceById } = require("../repositories/service.repo");
const { listStaffByService, getStaffById } = require("../repositories/staff.repo");
const { getSettings } = require("../repositories/settings.repo");
const { getWorkingHoursForStaffDay } = require("../repositories/staff-hours.repo");
const {
  createBooking,
  findOverlappingBookings,
  updateBookingStatus,
  getBookingById
} = require("../repositories/booking.repo");
const { addMinutes, parseTimeToMinutes } = require("../utils/time");
const { badRequest, notFound } = require("../utils/errors");
const { BOOKING_STATUS, PAYMENT_STATUS } = require("../utils/constants");
const { sendBookingEmail } = require("./mail.service");

const isWithinHours = (startTime, endTime, openTime, closeTime) => {
  return (
    parseTimeToMinutes(startTime) >= parseTimeToMinutes(openTime) &&
    parseTimeToMinutes(endTime) <= parseTimeToMinutes(closeTime)
  );
};

const resolveStaffHours = async (tenantId, staffId, date, fallbackOpen, fallbackClose) => {
  const day = new Date(`${date}T00:00:00`).getDay();
  const staffHours = await getWorkingHoursForStaffDay(tenantId, staffId, day);
  if (staffHours && staffHours.is_off) {
    return null;
  }
  return {
    openTime: staffHours?.start_time || fallbackOpen,
    closeTime: staffHours?.end_time || fallbackClose
  };
};

const pickAvailableStaff = async ({ tenantId, serviceId, date, startTime, endTime }) => {
  const staffMembers = await listStaffByService(tenantId, serviceId);
  if (!staffMembers.length) return null;
  const settings = await getSettings(tenantId);
  for (const staff of staffMembers) {
    const hours = await resolveStaffHours(tenantId, staff.id, date, settings.open_time, settings.close_time);
    if (!hours) continue;
    if (!isWithinHours(startTime, endTime, hours.openTime, hours.closeTime)) continue;
    const overlaps = await findOverlappingBookings(null, tenantId, staff.id, date, startTime, endTime);
    if (!overlaps.length) return staff;
  }
  return null;
};

const createNewBooking = async ({
  tenantId,
  userId,
  serviceId,
  staffId,
  bookingDate,
  startTime,
  customerName,
  customerPhone,
  customerEmail,
  notes,
  paymentMode,
  paymentCompleted
}) => {
  const service = await getServiceById(tenantId, serviceId);
  if (!service) throw badRequest("Service not found");

  const endTime = addMinutes(startTime, Number(service.duration_minutes));
  const settings = await getSettings(tenantId);
  if (!settings) throw badRequest("Salon settings not configured");

  let assignedStaffId = staffId;
  if (assignedStaffId) {
    const staff = await getStaffById(tenantId, assignedStaffId);
    if (!staff) throw badRequest("Staff not found");
    const hours = await resolveStaffHours(tenantId, assignedStaffId, bookingDate, settings.open_time, settings.close_time);
    if (!hours) throw badRequest("Staff is not available on this day");
    if (!isWithinHours(startTime, endTime, hours.openTime, hours.closeTime)) {
      throw badRequest("Time outside working hours");
    }
  } else {
    const staff = await pickAvailableStaff({ tenantId, serviceId, date: bookingDate, startTime, endTime });
    if (!staff) throw badRequest("No staff available for this slot");
    assignedStaffId = staff.id;
  }

  const checkInCode = String(Math.floor(100000 + Math.random() * 900000));

  const resolvedPaymentMode = paymentMode || "offline";
  const resolvedPaymentStatus =
    resolvedPaymentMode === "online" && paymentCompleted ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.UNPAID;

  const bookingId = await withTransaction(async (connection) => {
    const overlaps = await findOverlappingBookings(
      connection,
      tenantId,
      assignedStaffId,
      bookingDate,
      startTime,
      endTime
    );
    if (overlaps.length) throw badRequest("Slot already booked");

    return createBooking(connection, {
      tenantId,
      userId,
      serviceId,
      staffId: assignedStaffId,
      bookingDate,
      startTime,
      endTime,
      status: BOOKING_STATUS.PENDING,
      paymentMode: resolvedPaymentMode,
      paymentStatus: resolvedPaymentStatus,
      paymentId: null,
      checkInCode,
      customerName,
      customerPhone,
      customerEmail,
      notes
    });
  });

  if (customerEmail) {
    await sendBookingEmail({
      to: customerEmail,
      subject: "Booking Received",
      bookingDate,
      startTime,
      serviceName: service.name
    });
  }

  return { bookingId, endTime, staffId: assignedStaffId, checkInCode };
};

const checkInBooking = async (tenantId, bookingId, code) => {
  const booking = await getBookingById(tenantId, bookingId);
  if (!booking) throw notFound("Booking not found");
  if (!code) throw badRequest("Check-in code required");
  if (!booking.check_in_code) throw badRequest("Check-in code not set");
  if (booking.check_in_code !== code) throw badRequest("Invalid check-in code");
  if (booking.status === BOOKING_STATUS.CANCELLED || booking.status === BOOKING_STATUS.COMPLETED) {
    throw badRequest("Booking already closed");
  }
  await updateBookingStatus(tenantId, bookingId, BOOKING_STATUS.CHECKED_IN);
};

const updateBookingStatusById = async (tenantId, bookingId, status) => {
  const booking = await getBookingById(tenantId, bookingId);
  if (!booking) throw notFound("Booking not found");
  await updateBookingStatus(tenantId, bookingId, status);
};

const cancelBooking = async (tenantId, bookingId, userId, isAdmin) => {
  const booking = await getBookingById(tenantId, bookingId);
  if (!booking) throw notFound("Booking not found");
  if (!isAdmin && booking.user_id !== userId) throw badRequest("Cannot cancel this booking");
  await updateBookingStatus(tenantId, bookingId, BOOKING_STATUS.CANCELLED);
};

module.exports = {
  createNewBooking,
  checkInBooking,
  updateBookingStatusById,
  cancelBooking
};
