const { z } = require("zod");

const serviceSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().min(5),
    category: z.string().optional(),
    details: z.string().optional(),
    benefits: z.string().optional(),
    aftercare: z.string().optional(),
    price: z.coerce.number().positive(),
    durationMinutes: z.coerce.number().int().positive(),
    isActive: z.coerce.boolean().optional()
  })
});

module.exports = { serviceSchema };
