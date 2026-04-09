const { listGallery, createGallery, deleteGallery } = require("../repositories/gallery.repo");

const list = async (req, res) => {
  const data = await listGallery(req.tenantId);
  res.json(data);
};

const create = async (req, res) => {
  const { title, category } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const id = await createGallery({ tenantId: req.tenantId, title, imageUrl, category });
  res.status(201).json({ id });
};

const remove = async (req, res) => {
  await deleteGallery(req.tenantId, req.params.id);
  res.json({ success: true });
};

module.exports = { list, create, remove };
