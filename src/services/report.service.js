const { asNumber, getCollection } = require("../repositories/_mongo");

const REVENUE_BOOKING_STATUSES = ["confirmed", "completed"];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mapServicePrices = async (tenantId, serviceIds) => {
  if (!serviceIds.length) return new Map();

  const services = await getCollection("services")
    .find({ tenant_id: asNumber(tenantId), id: { $in: serviceIds } })
    .project({ _id: 0, id: 1, name: 1, price: 1 })
    .toArray();

  return new Map(services.map((service) => [Number(service.id), service]));
};

const listRevenueBookings = async (tenantId, extraQuery = {}) => {
  return getCollection("bookings")
    .find({
      tenant_id: asNumber(tenantId),
      payment_status: "paid",
      status: { $in: REVENUE_BOOKING_STATUSES },
      ...extraQuery
    })
    .project({ _id: 0, service_id: 1 })
    .toArray();
};

const sumRevenue = (bookings, serviceMap) => {
  return bookings.reduce((total, booking) => {
    const price = Number(serviceMap.get(Number(booking.service_id))?.price || 0);
    return total + price;
  }, 0);
};

const getDashboardStats = async (tenantId) => {
  const tenant = asNumber(tenantId);
  const today = getLocalDateString();

  const [totalBookings, todayBookings, paidBookings, popularCounts] = await Promise.all([
    getCollection("bookings").countDocuments({ tenant_id: tenant }),
    getCollection("bookings").countDocuments({ tenant_id: tenant, booking_date: today }),
    listRevenueBookings(tenant),
    getCollection("bookings")
      .aggregate([
        { $match: { tenant_id: tenant } },
        { $group: { _id: "$service_id", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 5 }
      ])
      .toArray()
  ]);

  const serviceIdsForRevenue = [...new Set(paidBookings.map((row) => Number(row.service_id)).filter((id) => id))];
  const serviceIdsForPopular = [...new Set(popularCounts.map((row) => Number(row._id)).filter((id) => id))];
  const serviceMap = await mapServicePrices(tenant, [...new Set([...serviceIdsForRevenue, ...serviceIdsForPopular])]);

  const popularServices = popularCounts.map((row) => {
    const service = serviceMap.get(Number(row._id));
    return {
      id: Number(row._id),
      name: service?.name || "Unknown",
      count: Number(row.count || 0)
    };
  });

  return {
    totalBookings,
    todayBookings,
    totalRevenue: sumRevenue(paidBookings, serviceMap),
    popularServices
  };
};

const getDailyRevenue = async (tenantId, date) => {
  const paidBookings = await listRevenueBookings(tenantId, { booking_date: date });
  const serviceIds = [...new Set(paidBookings.map((row) => Number(row.service_id)).filter((id) => id))];
  const serviceMap = await mapServicePrices(tenantId, serviceIds);
  return sumRevenue(paidBookings, serviceMap);
};

const getMonthlyRevenue = async (tenantId, month) => {
  const safeMonth = escapeRegex(month);
  const paidBookings = await listRevenueBookings(tenantId, { booking_date: { $regex: `^${safeMonth}` } });
  const serviceIds = [...new Set(paidBookings.map((row) => Number(row.service_id)).filter((id) => id))];
  const serviceMap = await mapServicePrices(tenantId, serviceIds);
  return sumRevenue(paidBookings, serviceMap);
};

const getStaffReport = async ({ tenantId, date, month }) => {
  const tenant = asNumber(tenantId);

  const [staffRows, mappingRows] = await Promise.all([
    getCollection("staff")
      .find({ tenant_id: tenant })
      .project({ _id: 0, id: 1, name: 1, phone: 1 })
      .toArray(),
    getCollection("staff_services")
      .aggregate([
        { $match: { tenant_id: tenant } },
        { $group: { _id: "$staff_id", assigned_services: { $sum: 1 } } }
      ])
      .toArray()
  ]);

  const bookingFilter = { tenant_id: tenant };
  if (date) {
    bookingFilter.booking_date = date;
  } else if (month) {
    const safeMonth = escapeRegex(month);
    bookingFilter.booking_date = { $regex: `^${safeMonth}` };
  }

  const bookings = await getCollection("bookings")
    .find(bookingFilter)
    .project({ _id: 0, staff_id: 1, service_id: 1, status: 1, payment_status: 1 })
    .toArray();

  const serviceIds = [...new Set(bookings.map((row) => Number(row.service_id)).filter((id) => id))];
  const serviceMap = await mapServicePrices(tenant, serviceIds);

  const assignedMap = new Map(mappingRows.map((row) => [Number(row._id), Number(row.assigned_services || 0)]));
  const bookingStats = new Map();

  for (const booking of bookings) {
    const staffId = booking.staff_id === null || booking.staff_id === undefined ? null : Number(booking.staff_id);
    if (!staffId) continue;

    const current = bookingStats.get(staffId) || {
      total_bookings: 0,
      completed_bookings: 0,
      revenue: 0
    };

    current.total_bookings += 1;

    if (booking.status === "completed") {
      current.completed_bookings += 1;
      if (booking.payment_status === "paid") {
        current.revenue += Number(serviceMap.get(Number(booking.service_id))?.price || 0);
      }
    }

    bookingStats.set(staffId, current);
  }

  return staffRows
    .map((staff) => {
      const stats = bookingStats.get(Number(staff.id)) || {
        total_bookings: 0,
        completed_bookings: 0,
        revenue: 0
      };

      return {
        id: Number(staff.id),
        name: staff.name,
        phone: staff.phone,
        assigned_services: assignedMap.get(Number(staff.id)) || 0,
        total_bookings: stats.total_bookings,
        completed_bookings: stats.completed_bookings,
        revenue: stats.revenue
      };
    })
    .sort((a, b) => {
      if (b.revenue !== a.revenue) return b.revenue - a.revenue;
      return b.completed_bookings - a.completed_bookings;
    });
};

module.exports = { getDashboardStats, getDailyRevenue, getMonthlyRevenue, getStaffReport };
