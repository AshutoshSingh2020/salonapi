const {
  listPages,
  getPageById,
  getPageBySlug,
  listPageSections,
  createPage,
  updatePage,
  deletePage,
  replacePageSections
} = require("../repositories/pages.repo");
const { notFound, badRequest } = require("../utils/errors");
const { ensureMenuItemForPage, setMenuItemActiveForPage } = require("../repositories/menu.repo");

const syncMenuItem = async ({ tenantId, pageId, title, isActive }) => {
  if (isActive) {
    await ensureMenuItemForPage({ tenantId, location: "header", pageId, label: title });
  } else {
    await setMenuItemActiveForPage({ tenantId, location: "header", pageId, isActive: false });
  }
};

const mapPage = (page) => ({
  id: page.id,
  title: page.title,
  slug: page.slug,
  metaTitle: page.meta_title || "",
  metaDescription: page.meta_description || "",
  template: page.template || "default",
  status: !!page.status,
  createdAt: page.created_at,
  updatedAt: page.updated_at
});

const listAdmin = async (req, res) => {
  const pages = await listPages(req.tenantId);
  res.json(pages.map(mapPage));
};

const getAdmin = async (req, res) => {
  const page = await getPageById(req.tenantId, req.params.id);
  if (!page) throw notFound("Page not found");
  const sections = await listPageSections(page.id);
  res.json({ ...mapPage(page), sections });
};

const createAdmin = async (req, res) => {
  const { title, slug, metaTitle, metaDescription, template, status, sections } = req.validated.body;
  const existingSlug = await getPageBySlug(req.tenantId, slug);
  if (existingSlug) throw badRequest("Page slug already exists for this tenant.");
  const id = await createPage({ tenantId: req.tenantId, title, slug, metaTitle, metaDescription, template, status });
  if (sections && Array.isArray(sections)) {
    await replacePageSections(id, sections);
  }
  if (status) {
    await syncMenuItem({ tenantId: req.tenantId, pageId: id, title, isActive: true });
  }
  res.status(201).json({ id });
};

const updateAdmin = async (req, res) => {
  const existing = await getPageById(req.tenantId, req.params.id);
  if (!existing) throw notFound("Page not found");
  if (req.validated.body.slug !== undefined) {
    const duplicate = await getPageBySlug(req.tenantId, req.validated.body.slug);
    if (duplicate && Number(duplicate.id) !== Number(existing.id)) {
      throw badRequest("Page slug already exists for this tenant.");
    }
  }
  await updatePage(req.tenantId, req.params.id, req.validated.body);
  if (req.validated.body.status !== undefined) {
    await syncMenuItem({
      tenantId: req.tenantId,
      pageId: existing.id,
      title: req.validated.body.title || existing.title,
      isActive: !!req.validated.body.status
    });
  } else if (req.validated.body.title && existing.status) {
    await syncMenuItem({
      tenantId: req.tenantId,
      pageId: existing.id,
      title: req.validated.body.title,
      isActive: true
    });
  }
  res.json({ success: true });
};

const updateSectionsAdmin = async (req, res) => {
  const existing = await getPageById(req.tenantId, req.params.id);
  if (!existing) throw notFound("Page not found");
  await replacePageSections(req.params.id, req.validated.body.sections || []);
  res.json({ success: true });
};

const removeAdmin = async (req, res) => {
  await deletePage(req.tenantId, req.params.id);
  res.json({ success: true });
};

const getPublic = async (req, res) => {
  const page = await getPageBySlug(req.tenantId, req.params.slug, true);
  if (!page) throw notFound("Page not found");
  const sections = await listPageSections(page.id);
  res.json({
    id: page.id,
    title: page.title,
    slug: page.slug,
    metaTitle: page.meta_title || "",
    metaDescription: page.meta_description || "",
    template: page.template || "default",
    sections
  });
};

module.exports = {
  listAdmin,
  getAdmin,
  createAdmin,
  updateAdmin,
  updateSectionsAdmin,
  removeAdmin,
  getPublic
};
