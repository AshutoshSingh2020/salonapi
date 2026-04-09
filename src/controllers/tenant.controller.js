const bcrypt = require("bcryptjs");
const {
  listTenants,
  createTenant,
  addTenantDomain,
  listTenantDomains
} = require("../repositories/tenant.repo");
const { createUser, findAnyByEmail, listAdminsByTenant } = require("../repositories/user.repo");
const { createPage, replacePageSections, listPages, getPageBySlug } = require("../repositories/pages.repo");
const { ensureMenuItemForPage } = require("../repositories/menu.repo");
const { upsertSettings } = require("../repositories/settings.repo");
const { ROLES } = require("../utils/constants");
const { badRequest } = require("../utils/errors");
const { normalizeDomain } = require("../utils/domain");

const listAll = async (_req, res) => {
  const tenants = await listTenants();
  res.json(tenants);
};

const create = async (req, res) => {
  const { name, domain } = req.validated.body;
  const id = await createTenant({ name, status: "active" });
  if (domain) {
    const normalizedDomain = normalizeDomain(domain);
    if (!normalizedDomain) throw badRequest("Invalid domain");
    await addTenantDomain({ tenantId: id, domain: normalizedDomain, isPrimary: true });
  }
  res.status(201).json({ id });
};

const domains = async (req, res) => {
  const rows = await listTenantDomains(req.params.id);
  res.json(rows);
};

const admins = async (req, res) => {
  const tenantId = Number(req.params.id);
  if (!Number.isFinite(tenantId)) throw badRequest("Invalid tenant id");
  const rows = await listAdminsByTenant(tenantId);
  res.json({
    tenantId,
    totalAdmins: rows.length,
    admins: rows
  });
};

const addDomain = async (req, res) => {
  const { domain, isPrimary } = req.validated.body;
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain) throw badRequest("Invalid domain");
  const id = await addTenantDomain({ tenantId: req.params.id, domain: normalizedDomain, isPrimary });
  res.status(201).json({ id });
};

const seedTenantDefaults = async ({ tenantId, timezone }) => {
  await upsertSettings({
    tenantId,
    openTime: "10:00",
    closeTime: "20:00",
    slotDurationMinutes: 30,
    timezone: timezone || "UTC"
  });

  const defaultPages = [
    {
      title: "Home",
      slug: "home",
      sections: [
        {
          type: "banner",
          data: {
            title: "Welcome to your salon",
            subtitle: "Update this content in Pages → Home",
            imageUrl:
              "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=60",
            ctaText: "Book Now",
            ctaLink: "/booking"
          }
        },
        {
          type: "services_list",
          data: {
            heading: "Services",
            subtitle: "Explore the services you offer and add pricing.",
            ctaText: "View details →"
          }
        }
      ]
    },
    {
      title: "Services",
      slug: "services",
      sections: [
        {
          type: "services_list",
          data: {
            heading: "Our Services",
            subtitle: "Highlight your most requested treatments.",
            ctaText: "View details →"
          }
        }
      ]
    },
    {
      title: "About Us",
      slug: "about",
      sections: [
        {
          type: "about_content",
          data: {
            badge: "About Us",
            ctaText: "Book a Visit",
            ctaLink: "/booking",
            promiseTitle: "Our Promise",
            promiseText: "Clean, consistent, and confident - every single appointment.",
            statOneValue: "7+",
            statOneLabel: "Years Experience",
            statTwoValue: "4.9",
            statTwoLabel: "Average Rating",
            storyTitle: "Our Story",
            storyBody: "Share the story behind your brand, mission, and values."
          }
        }
      ]
    },
    {
      title: "Contact",
      slug: "contact",
      sections: [
        {
          type: "contact_form",
          data: {
            badge: "Contact Us",
            heading: "We are here to help",
            subtitle: "Tell us what you need. Our team responds quickly during working hours.",
            hoursTitle: "Salon Hours",
            hours: ["Mon - Sat: 10:00 AM - 8:00 PM", "Sunday: Closed"],
            supportText: "Support: +91 99999 99999",
            visitTitle: "Visit Us",
            visitSubtitle: "Walk-ins are welcome. For priority service, book in advance.",
            locationName: "Salonify Studio",
            addressLines: ["21 MG Road, Bengaluru", "India"],
            ctaText: "Send Message"
          }
        }
      ]
    }
  ];

  for (const page of defaultPages) {
    const existingPage = await getPageBySlug(tenantId, page.slug);
    let pageId = existingPage?.id;
    if (!pageId) {
      pageId = await createPage({
        tenantId,
        title: page.title,
        slug: page.slug,
        metaTitle: page.title,
        metaDescription: "",
        template: "default",
        status: true
      });
      if (page.sections?.length) {
        await replacePageSections(pageId, page.sections);
      }
    }
    await ensureMenuItemForPage({ tenantId, location: "header", pageId, label: page.title });
  }
};

const provision = async (req, res) => {
  const { name, domain, adminName, adminEmail, adminPhone, adminPassword, seedDefaults, timezone } =
    req.validated.body;
  const tenantId = await createTenant({ name, status: "active" });
  if (domain) {
    const normalizedDomain = normalizeDomain(domain);
    if (!normalizedDomain) throw badRequest("Invalid domain");
    await addTenantDomain({ tenantId, domain: normalizedDomain, isPrimary: true });
  }
  const existingUsers = await findAnyByEmail(adminEmail);
  const existing = existingUsers.find((row) => row.role === ROLES.ADMIN || row.role === ROLES.SUPER_ADMIN);
  if (existing) throw badRequest("Admin email already exists");

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const adminId = await createUser({
    tenantId,
    name: adminName,
    email: adminEmail,
    phone: adminPhone,
    passwordHash,
    role: ROLES.ADMIN
  });

  if (seedDefaults !== false) {
    await seedTenantDefaults({ tenantId, timezone });
  }

  res.status(201).json({ tenantId, adminId });
};

const createTenantAdmin = async (req, res) => {
  const tenantId = Number(req.params.id);
  if (!Number.isFinite(tenantId)) throw badRequest("Invalid tenant id");
  const { adminName, adminEmail, adminPhone, adminPassword, seedDefaults, timezone } = req.validated.body;
  const existingUsers = await findAnyByEmail(adminEmail);
  const existing = existingUsers.find((row) => row.role === ROLES.ADMIN || row.role === ROLES.SUPER_ADMIN);
  if (existing) throw badRequest("Admin email already exists");
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const adminId = await createUser({
    tenantId,
    name: adminName,
    email: adminEmail,
    phone: adminPhone,
    passwordHash,
    role: ROLES.ADMIN
  });

  if (seedDefaults) {
    const pages = await listPages(tenantId);
    if (!pages.length) {
      await seedTenantDefaults({ tenantId, timezone });
    }
  }

  res.status(201).json({ adminId });
};

module.exports = { listAll, create, domains, admins, addDomain, provision, createTenantAdmin };
