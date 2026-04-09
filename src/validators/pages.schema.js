const { z } = require("zod");

const sectionSchema = z.object({
  type: z.string().min(1),
  data: z.any().optional()
});

const pageCreateSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    slug: z.string().min(1),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    template: z.string().optional(),
    status: z.boolean().optional(),
    sections: z.array(sectionSchema).optional()
  })
});

const pageUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    slug: z.string().min(1).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    template: z.string().optional(),
    status: z.boolean().optional()
  })
});

const pageSectionsSchema = z.object({
  body: z.object({
    sections: z.array(sectionSchema)
  })
});

module.exports = { pageCreateSchema, pageUpdateSchema, pageSectionsSchema };
