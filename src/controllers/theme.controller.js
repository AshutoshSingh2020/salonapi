const {
  getHeaderSettings,
  upsertHeaderSettings,
  listHeaderLinks,
  createHeaderLink,
  updateHeaderLink,
  deleteHeaderLink,
  getFooterSettings,
  upsertFooterSettings,
  listFooterLinks,
  createFooterLink,
  updateFooterLink,
  deleteFooterLink
} = require("../repositories/theme.repo");
const { listPublic: listMenuPublic } = require("./menu.controller");

const normalizeHeaderSettings = (settings) => ({
  cta_text: settings?.cta_text || "Book Now",
  cta_link: settings?.cta_link || "/booking",
  show_top_bar: settings?.show_top_bar !== undefined ? !!settings.show_top_bar : true,
  instagram_url: settings?.instagram_url || "",
  facebook_url: settings?.facebook_url || "",
  whatsapp_url: settings?.whatsapp_url || "",
  home_label: settings?.home_label || "Home",
  services_label: settings?.services_label || "Services",
  about_label: settings?.about_label || "About Us",
  contact_label: settings?.contact_label || "Contact Us"
});

const normalizeFooterSettings = (settings) => ({
  brand_name: settings?.brand_name || "Salonify",
  tagline: settings?.tagline || "",
  phone: settings?.phone || "",
  email: settings?.email || "",
  address: settings?.address || "",
  map_link: settings?.map_link || "",
  copyright_text: settings?.copyright_text || "",
  instagram_url: settings?.instagram_url || "",
  facebook_url: settings?.facebook_url || "",
  whatsapp_url: settings?.whatsapp_url || "",
  home_label: settings?.home_label || "Home",
  services_label: settings?.services_label || "Services",
  about_label: settings?.about_label || "About Us",
  contact_label: settings?.contact_label || "Contact Us"
});

const getHeaderPublic = async (req, res) => {
  const settings = await getHeaderSettings(req.tenantId);
  const links = await listHeaderLinks(req.tenantId, true);
  const menu = await listMenuPublic(req.tenantId, "header");
  res.json({ settings: normalizeHeaderSettings(settings), links, menu });
};

const getFooterPublic = async (req, res) => {
  const settings = await getFooterSettings(req.tenantId);
  const links = await listFooterLinks(req.tenantId, true);
  const menu = await listMenuPublic(req.tenantId, "footer");
  res.json({ settings: normalizeFooterSettings(settings), links, menu });
};

const getHeaderAdmin = async (req, res) => {
  const settings = await getHeaderSettings(req.tenantId);
  const links = await listHeaderLinks(req.tenantId, false);
  res.json({ settings: normalizeHeaderSettings(settings), links });
};

const updateHeaderAdmin = async (req, res) => {
  const { ctaText, ctaLink, showTopBar, instagramUrl, facebookUrl, whatsappUrl, homeLabel, servicesLabel, aboutLabel, contactLabel } = req.validated.body;
  await upsertHeaderSettings(req.tenantId, {
    ctaText,
    ctaLink,
    showTopBar,
    instagramUrl,
    facebookUrl,
    whatsappUrl,
    homeLabel,
    servicesLabel,
    aboutLabel,
    contactLabel
  });
  res.json({ ok: true });
};

const createHeaderLinkAdmin = async (req, res) => {
  const { label, url, position, isActive } = req.validated.body;
  const id = await createHeaderLink(req.tenantId, { label, url, position, isActive });
  res.status(201).json({ id });
};

const updateHeaderLinkAdmin = async (req, res) => {
  const { label, url, position, isActive } = req.validated.body;
  await updateHeaderLink(req.tenantId, req.params.id, { label, url, position, isActive });
  res.json({ ok: true });
};

const deleteHeaderLinkAdmin = async (req, res) => {
  await deleteHeaderLink(req.tenantId, req.params.id);
  res.json({ ok: true });
};

const getFooterAdmin = async (req, res) => {
  const settings = await getFooterSettings(req.tenantId);
  const links = await listFooterLinks(req.tenantId, false);
  res.json({ settings: normalizeFooterSettings(settings), links });
};

const updateFooterAdmin = async (req, res) => {
  const {
    brandName,
    tagline,
    phone,
    email,
    address,
    mapLink,
    copyrightText,
    instagramUrl,
    facebookUrl,
    whatsappUrl,
    homeLabel,
    servicesLabel,
    aboutLabel,
    contactLabel
  } = req.validated.body;
  await upsertFooterSettings(req.tenantId, {
    brandName,
    tagline,
    phone,
    email,
    address,
    mapLink,
    copyrightText,
    instagramUrl,
    facebookUrl,
    whatsappUrl,
    homeLabel,
    servicesLabel,
    aboutLabel,
    contactLabel
  });
  res.json({ ok: true });
};

const createFooterLinkAdmin = async (req, res) => {
  const { label, url, position, isActive } = req.validated.body;
  const id = await createFooterLink(req.tenantId, { label, url, position, isActive });
  res.status(201).json({ id });
};

const updateFooterLinkAdmin = async (req, res) => {
  const { label, url, position, isActive } = req.validated.body;
  await updateFooterLink(req.tenantId, req.params.id, { label, url, position, isActive });
  res.json({ ok: true });
};

const deleteFooterLinkAdmin = async (req, res) => {
  await deleteFooterLink(req.tenantId, req.params.id);
  res.json({ ok: true });
};

module.exports = {
  getHeaderPublic,
  getFooterPublic,
  getHeaderAdmin,
  updateHeaderAdmin,
  createHeaderLinkAdmin,
  updateHeaderLinkAdmin,
  deleteHeaderLinkAdmin,
  getFooterAdmin,
  updateFooterAdmin,
  createFooterLinkAdmin,
  updateFooterLinkAdmin,
  deleteFooterLinkAdmin
};
