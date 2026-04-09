const { getDashboardStats, getDailyRevenue, getMonthlyRevenue, getStaffReport } = require("../services/report.service");
const { getSettings, upsertSettings } = require("../repositories/settings.repo");

const dashboard = async (req, res) => {
  const data = await getDashboardStats(req.tenantId);
  res.json(data);
};

const dailyReport = async (req, res) => {
  const { date } = req.query;
  const total = await getDailyRevenue(req.tenantId, date);
  res.json({ date, total });
};

const monthlyReport = async (req, res) => {
  const { month } = req.query;
  const total = await getMonthlyRevenue(req.tenantId, month);
  res.json({ month, total });
};

const staffReport = async (req, res) => {
  const { date, month } = req.query;
  const data = await getStaffReport({ tenantId: req.tenantId, date, month });
  res.json({ date: date || null, month: month || null, data });
};

const getSalonSettings = async (req, res) => {
  const settings = await getSettings(req.tenantId);
  res.json(settings);
};

const updateSalonSettings = async (req, res) => {
  const { openTime, closeTime, slotDurationMinutes, timezone } = req.validated.body;
  const id = await upsertSettings({ tenantId: req.tenantId, openTime, closeTime, slotDurationMinutes, timezone });
  res.json({ id });
};

module.exports = { dashboard, dailyReport, monthlyReport, staffReport, getSalonSettings, updateSalonSettings };
