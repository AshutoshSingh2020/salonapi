const { z } = require("zod");

const aboutSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    subtitle: z.string().optional(),
    content: z.string().optional(),
    highlights: z.string().optional(),
    imageUrl: z.string().optional()
  })
});

module.exports = { aboutSchema };
