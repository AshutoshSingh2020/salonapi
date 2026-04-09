const { z } = require("zod");

const tenantCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    domain: z.string().min(3).optional()
  })
});

const tenantDomainSchema = z.object({
  body: z.object({
    domain: z.string().min(3),
    isPrimary: z.boolean().optional()
  })
});

const tenantProvisionSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    domain: z.string().min(3).optional(),
    adminName: z.string().min(2),
    adminEmail: z.string().email(),
    adminPhone: z.string().min(6),
    adminPassword: z.string().min(6),
    timezone: z.string().min(3).optional(),
    seedDefaults: z.boolean().optional()
  })
});

const tenantAdminSchema = z.object({
  body: z.object({
    adminName: z.string().min(2),
    adminEmail: z.string().email(),
    adminPhone: z.string().min(6),
    adminPassword: z.string().min(6),
    timezone: z.string().min(3).optional(),
    seedDefaults: z.boolean().optional()
  })
});

module.exports = { tenantCreateSchema, tenantDomainSchema, tenantProvisionSchema, tenantAdminSchema };
