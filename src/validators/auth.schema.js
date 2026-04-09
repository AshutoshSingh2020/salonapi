const { z } = require("zod");

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    password: z.string().min(6)
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    tenantId: z.coerce.number().int().positive().optional(),
    tenantDomain: z.string().min(3).optional()
  })
});

const phoneLoginSchema = z.object({
  body: z.object({
    phone: z.string().min(7),
    tenantId: z.coerce.number().int().positive().optional(),
    tenantDomain: z.string().min(3).optional()
  })
});

module.exports = { registerSchema, loginSchema, phoneLoginSchema };
