const {
  listStaff,
  listAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  setStaffServices
} = require("../repositories/staff.repo");

const listPublic = async (req, res) => {
  const data = await listStaff(req.tenantId);
  res.json(data);
};

const listAdmin = async (req, res) => {
  const data = await listAllStaff(req.tenantId);
  res.json(data);
};

const create = async (req, res) => {
  const { name, phone, specialization, isActive, serviceIds } = req.validated.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const id = await createStaff({ tenantId: req.tenantId, name, phone, specialization, imageUrl, isActive });
  if (serviceIds && serviceIds.length) {
    await setStaffServices(req.tenantId, id, serviceIds);
  }
  res.status(201).json({ id });
};

const update = async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
  await updateStaff(req.tenantId, req.params.id, data);
  res.json({ success: true });
};

const remove = async (req, res) => {
  await deleteStaff(req.tenantId, req.params.id);
  res.json({ success: true });
};

const assignServices = async (req, res) => {
  const { serviceIds } = req.body;
  await setStaffServices(req.tenantId, req.params.id, serviceIds || []);
  res.json({ success: true });
};

module.exports = { listPublic, listAdmin, create, update, remove, assignServices };
