const express = require("express");
const {
  dashboard,
  dailyReport,
  monthlyReport,
  staffReport,
  getSalonSettings,
  updateSalonSettings
} = require("../controllers/admin.controller");
const { getAboutAdmin, updateAbout } = require("../controllers/about.controller");
const { list, updateStatus } = require("../controllers/contact.controller");
const {
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
} = require("../controllers/theme.controller");
const {
  listAdmin: listPagesAdmin,
  getAdmin: getPageAdmin,
  createAdmin: createPageAdmin,
  updateAdmin: updatePageAdmin,
  updateSectionsAdmin: updatePageSectionsAdmin,
  removeAdmin: removePageAdmin
} = require("../controllers/pages.controller");
const { listAll, create, domains, admins, addDomain, provision, createTenantAdmin } = require("../controllers/tenant.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { requireTenantContext } = require("../middleware/tenant");
const { settingsSchema } = require("../validators/settings.schema");
const { aboutSchema } = require("../validators/about.schema");
const { contactStatusSchema } = require("../validators/contact.schema");
const { headerSettingsSchema, footerSettingsSchema, navLinkSchema } = require("../validators/theme.schema");
const { pageCreateSchema, pageUpdateSchema, pageSectionsSchema } = require("../validators/pages.schema");
const { menuCreateSchema, menuUpdateSchema } = require("../validators/menu.schema");
const { tenantCreateSchema, tenantDomainSchema, tenantProvisionSchema, tenantAdminSchema } = require("../validators/tenant.schema");
const {
  listAdmin: listMenusAdmin,
  createAdmin: createMenuAdmin,
  updateAdmin: updateMenuAdmin,
  removeAdmin: removeMenuAdmin
} = require("../controllers/menu.controller");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

router.get("/tenants", requireAuth, requireRole("super_admin"), asyncHandler(listAll));
router.post(
  "/tenants",
  requireAuth,
  requireRole("super_admin"),
  validate(tenantCreateSchema),
  asyncHandler(create)
);
router.post(
  "/tenants/provision",
  requireAuth,
  requireRole("super_admin"),
  validate(tenantProvisionSchema),
  asyncHandler(provision)
);
router.get("/tenants/:id/domains", requireAuth, requireRole("super_admin"), asyncHandler(domains));
router.get("/tenants/:id/admins", requireAuth, requireRole("super_admin"), asyncHandler(admins));
router.post(
  "/tenants/:id/domains",
  requireAuth,
  requireRole("super_admin"),
  validate(tenantDomainSchema),
  asyncHandler(addDomain)
);
router.post(
  "/tenants/:id/admins",
  requireAuth,
  requireRole("super_admin"),
  validate(tenantAdminSchema),
  asyncHandler(createTenantAdmin)
);

router.use(requireTenantContext);

router.get("/dashboard", requireAuth, requireRole("admin"), asyncHandler(dashboard));
router.get("/reports/daily", requireAuth, requireRole("admin"), asyncHandler(dailyReport));
router.get("/reports/monthly", requireAuth, requireRole("admin"), asyncHandler(monthlyReport));
router.get("/reports/staff", requireAuth, requireRole("admin"), asyncHandler(staffReport));
router.get("/settings", requireAuth, requireRole("super_admin"), asyncHandler(getSalonSettings));
router.put(
  "/settings",
  requireAuth,
  requireRole("super_admin"),
  validate(settingsSchema),
  asyncHandler(updateSalonSettings)
);
router.get("/about", requireAuth, requireRole("super_admin"), asyncHandler(getAboutAdmin));
router.put(
  "/about",
  requireAuth,
  requireRole("super_admin"),
  validate(aboutSchema),
  asyncHandler(updateAbout)
);
router.get("/contacts", requireAuth, requireRole("super_admin"), asyncHandler(list));
router.patch(
  "/contacts/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(contactStatusSchema),
  asyncHandler(updateStatus)
);

router.get("/theme/header", requireAuth, requireRole("super_admin"), asyncHandler(getHeaderAdmin));
router.put(
  "/theme/header",
  requireAuth,
  requireRole("super_admin"),
  validate(headerSettingsSchema),
  asyncHandler(updateHeaderAdmin)
);
router.post(
  "/theme/header-links",
  requireAuth,
  requireRole("super_admin"),
  validate(navLinkSchema),
  asyncHandler(createHeaderLinkAdmin)
);
router.put(
  "/theme/header-links/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(navLinkSchema),
  asyncHandler(updateHeaderLinkAdmin)
);
router.delete(
  "/theme/header-links/:id",
  requireAuth,
  requireRole("super_admin"),
  asyncHandler(deleteHeaderLinkAdmin)
);

router.get("/theme/footer", requireAuth, requireRole("super_admin"), asyncHandler(getFooterAdmin));
router.put(
  "/theme/footer",
  requireAuth,
  requireRole("super_admin"),
  validate(footerSettingsSchema),
  asyncHandler(updateFooterAdmin)
);
router.post(
  "/theme/footer-links",
  requireAuth,
  requireRole("super_admin"),
  validate(navLinkSchema),
  asyncHandler(createFooterLinkAdmin)
);
router.put(
  "/theme/footer-links/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(navLinkSchema),
  asyncHandler(updateFooterLinkAdmin)
);
router.delete(
  "/theme/footer-links/:id",
  requireAuth,
  requireRole("super_admin"),
  asyncHandler(deleteFooterLinkAdmin)
);

router.get("/pages", requireAuth, requireRole("super_admin"), asyncHandler(listPagesAdmin));
router.post(
  "/pages",
  requireAuth,
  requireRole("super_admin"),
  validate(pageCreateSchema),
  asyncHandler(createPageAdmin)
);
router.get("/pages/:id", requireAuth, requireRole("super_admin"), asyncHandler(getPageAdmin));
router.put(
  "/pages/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(pageUpdateSchema),
  asyncHandler(updatePageAdmin)
);
router.put(
  "/pages/:id/sections",
  requireAuth,
  requireRole("super_admin"),
  validate(pageSectionsSchema),
  asyncHandler(updatePageSectionsAdmin)
);
router.delete("/pages/:id", requireAuth, requireRole("super_admin"), asyncHandler(removePageAdmin));

router.get("/menus", requireAuth, requireRole("super_admin"), asyncHandler(listMenusAdmin));
router.post(
  "/menus",
  requireAuth,
  requireRole("super_admin"),
  validate(menuCreateSchema),
  asyncHandler(createMenuAdmin)
);
router.put(
  "/menus/:id",
  requireAuth,
  requireRole("super_admin"),
  validate(menuUpdateSchema),
  asyncHandler(updateMenuAdmin)
);
router.delete("/menus/:id", requireAuth, requireRole("super_admin"), asyncHandler(removeMenuAdmin));

module.exports = router;
