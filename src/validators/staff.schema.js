const { z } = require("zod");

const staffSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(7),
    specialization: z.string().min(2),
    isActive: z.coerce.boolean().optional(),
    serviceIds: z.array(z.number().int().positive()).optional()
  })
});

module.exports = { staffSchema };
