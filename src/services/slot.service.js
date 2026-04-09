const { getSettings } = require("../repositories/settings.repo");
const { getServiceById } = require("../repositories/service.repo");
const { listStaffByService } = require("../repositories/staff.repo");
const { listBookingsForStaffDate } = require("../repositories/booking.repo");
const { getWorkingHoursForStaffDay } = require("../repositories/staff-hours.repo");
const { parseTimeToMinutes, minutesToTime, isOverlap } = require("../utils/time");
const { badRequest } = require("../utils/errors");

const getDayOfWeek = (date) => {
  const [year, month, day] = String(date).split("-").map((value) => Number(value));
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

const getNowInTimezone = (timezone) => {
  const tz = timezone || "UTC";
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value || "00";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    minutes: Number(part("hour")) * 60 + Number(part("minute"))
  };
};

const buildSlots = (openTime, closeTime, slotDuration, serviceDuration) => {
  const open = parseTimeToMinutes(openTime);
  const close = parseTimeToMinutes(closeTime);
  const slots = [];
  let start = open;
  while (start + serviceDuration <= close) {
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(start + serviceDuration);
    slots.push({ startTime, endTime });
    start += slotDuration;
  }
  return slots;
};

const applyBookingsFilter = (slots, bookings) => {
  return slots.filter((slot) => {
    return !bookings.some((booking) =>
      isOverlap(slot.startTime, slot.endTime, booking.start_time, booking.end_time)
    );
  });
};

const resolveHoursForStaff = async (tenantId, staffId, date, fallbackOpen, fallbackClose) => {
  const day = getDayOfWeek(date);
  const staffHours = await getWorkingHoursForStaffDay(tenantId, staffId, day);
  if (staffHours && staffHours.is_off) {
    return null;
  }
  return {
    openTime: staffHours?.start_time || fallbackOpen,
    closeTime: staffHours?.end_time || fallbackClose
  };
};

const getAvailableSlots = async ({ tenantId, date, serviceId, staffId }) => {
  const settings = await getSettings(tenantId);
  if (!settings) throw badRequest("Salon settings not configured");
  const timezone = settings.timezone || "UTC";
  const now = getNowInTimezone(timezone);
  if (date < now.date) {
    return [];
  }
  const trimPastSlots = (slots) => {
    if (date !== now.date) return slots;
    return slots.filter((slot) => parseTimeToMinutes(slot.startTime) > now.minutes);
  };

  const slotDuration = Number(settings.slot_duration_minutes || 30);
  let serviceDuration = slotDuration;
  if (serviceId) {
    const service = await getServiceById(tenantId, serviceId);
    if (!service) throw badRequest("Service not found");
    serviceDuration = Number(service.duration_minutes);
  }

  if (staffId) {
    const hours = await resolveHoursForStaff(tenantId, staffId, date, settings.open_time, settings.close_time);
    if (!hours) return [];
    const slots = buildSlots(hours.openTime, hours.closeTime, slotDuration, serviceDuration);
    const bookings = await listBookingsForStaffDate(tenantId, staffId, date);
    const available = trimPastSlots(applyBookingsFilter(slots, bookings));
    return available.map((slot) => ({
      ...slot,
      availableStaffIds: [staffId]
    }));
  }

  const staffMembers = await listStaffByService(tenantId, serviceId);
  if (!staffMembers.length) return [];

  const slotMap = new Map();
  for (const staff of staffMembers) {
    const hours = await resolveHoursForStaff(tenantId, staff.id, date, settings.open_time, settings.close_time);
    if (!hours) continue;
    const slots = buildSlots(hours.openTime, hours.closeTime, slotDuration, serviceDuration);
    const bookings = await listBookingsForStaffDate(tenantId, staff.id, date);
    const available = trimPastSlots(applyBookingsFilter(slots, bookings));
    for (const slot of available) {
      const key = `${slot.startTime}-${slot.endTime}`;
      const entry = slotMap.get(key) || { ...slot, availableStaffIds: [] };
      entry.availableStaffIds.push(staff.id);
      slotMap.set(key, entry);
    }
  }
  return Array.from(slotMap.values()).sort((a, b) => {
    return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
  });
};

module.exports = { getAvailableSlots };
