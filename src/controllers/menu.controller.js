const { listMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } = require("../repositories/menu.repo");

const buildTree = (items) => {
  const map = new Map();
  const roots = [];
  for (const item of items) {
    const entry = { ...item, children: [] };
    map.set(item.id, entry);
  }
  for (const item of items) {
    const entry = map.get(item.id);
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId).children.push(entry);
    } else {
      roots.push(entry);
    }
  }
  return roots;
};

const listAdmin = async (req, res) => {
  const location = req.query.location || "header";
  const items = await listMenuItems(req.tenantId, location, false);
  res.json(items);
};

const createAdmin = async (req, res) => {
  const { location, label, url, pageId, parentId, position, isActive } = req.validated.body;
  const id = await createMenuItem({ tenantId: req.tenantId, location, label, url, pageId, parentId, position, isActive });
  res.status(201).json({ id });
};

const updateAdmin = async (req, res) => {
  await updateMenuItem(req.tenantId, req.params.id, req.validated.body);
  res.json({ ok: true });
};

const removeAdmin = async (req, res) => {
  await deleteMenuItem(req.tenantId, req.params.id);
  res.json({ ok: true });
};

const listPublic = async (tenantId, location) => {
  const items = await listMenuItems(tenantId, location, true);
  return buildTree(items);
};

module.exports = { listAdmin, createAdmin, updateAdmin, removeAdmin, listPublic };
