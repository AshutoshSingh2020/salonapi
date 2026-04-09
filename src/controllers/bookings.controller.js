const { listBookings, listBookingsByUser } = require("../repositories/booking.repo");
const { createNewBooking, checkInBooking, updateBookingStatusById, cancelBooking } = require("../services/booking.service");
const { getAvailableSlots } = require("../services/slot.service");
const { BOOKING_STATUS } = require("../utils/constants");

const listAdmin = async (req, res) => {
  const data = await listBookings(req.tenantId);
  res.json(data);
};

const listMine = async (req, res) => {
  const data = await listBookingsByUser(req.tenantId, req.user.id);
  res.json(data);
};

const availability = async (req, res) => {
  const { date, serviceId, staffId } = req.validated.query;
  const slots = await getAvailableSlots({
    tenantId: req.tenantId,
    date,
    serviceId: Number(serviceId),
    staffId: staffId ? Number(staffId) : undefined
  });
  res.json(slots);
};

const create = async (req, res) => {
  const {
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
  } = req.validated.body;
  const data = await createNewBooking({
    tenantId: req.tenantId,
    userId: req.user?.id,
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
  });
  res.status(201).json(data);
};

const checkIn = async (req, res) => {
  const { code } = req.body;
  await checkInBooking(req.tenantId, req.params.id, code);
  res.json({ success: true });
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  await updateBookingStatusById(req.tenantId, req.params.id, status || BOOKING_STATUS.CONFIRMED);
  res.json({ success: true });
};

const cancel = async (req, res) => {
  const isAdmin = req.user.role !== "customer";
  await cancelBooking(req.tenantId, req.params.id, req.user.id, isAdmin);
  res.json({ success: true });
};

module.exports = { listAdmin, listMine, availability, create, checkIn, updateStatus, cancel };
