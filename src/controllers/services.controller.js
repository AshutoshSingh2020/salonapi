const {
  listServices,
  listAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} = require("../repositories/service.repo");
const {
  listDetailSections,
  replaceDetailSections,
  getDetailLayout,
  updateDetailLayout
} = require("../repositories/service-detail.repo");
const { notFound } = require("../utils/errors");

const listPublic = async (req, res) => {
  const data = await listServices(req.tenantId);
  res.json(data);
};

const listAdmin = async (req, res) => {
  const data = await listAllServices(req.tenantId);
  res.json(data);
};

const getById = async (req, res) => {
  const service = await getServiceById(req.tenantId, req.params.id);
  if (!service) throw notFound("Service not found");
  res.json(service);
};

const getDetail = async (req, res) => {
  const service = await getServiceById(req.tenantId, req.params.id);
  if (!service) throw notFound("Service not found");
  const layout = await getDetailLayout(req.tenantId, service.id);
  const sections = await listDetailSections(req.tenantId, service.id);
  res.json({ service, layout, sections });
};

const create = async (req, res) => {
  const { name, description, category, details, benefits, aftercare, price, durationMinutes, isActive } =
    req.validated.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const id = await createService({
    tenantId: req.tenantId,
    name,
    description,
    category,
    details,
    benefits,
    aftercare,
    price,
    durationMinutes,
    imageUrl,
    isActive
  });
  res.status(201).json({ id });
};

const update = async (req, res) => {
  const data = { ...req.body };
  if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
  await updateService(req.tenantId, req.params.id, data);
  res.json({ success: true });
};

const updateDetail = async (req, res) => {
  const service = await getServiceById(req.tenantId, req.params.id);
  if (!service) throw notFound("Service not found");
  const layout = req.validated.body.layout || "default";
  await updateDetailLayout(req.tenantId, service.id, layout);
  await replaceDetailSections(req.tenantId, service.id, req.validated.body.sections || []);
  res.json({ success: true });
};

const remove = async (req, res) => {
  await deleteService(req.tenantId, req.params.id);
  res.json({ success: true });
};

module.exports = { listPublic, listAdmin, getById, getDetail, create, update, updateDetail, remove };
