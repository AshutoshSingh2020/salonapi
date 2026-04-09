const { z } = require("zod");

const baseSchema = z.object({
  location: z.enum(["header", "footer"]),
  label: z.string().min(1),
  url: z.string().optional(),
  pageId: z.coerce.number().optional(),
  parentId: z.coerce.number().optional(),
  position: z.coerce.number().optional(),
  isActive: z.boolean().optional()
});

const menuCreateSchema = z.object({
  body: baseSchema.refine((data) => data.url || data.pageId, {
    message: "Either url or pageId must be provided"
  })
});

const menuUpdateSchema = z.object({
  body: baseSchema.partial().refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required"
  })
});

module.exports = { menuCreateSchema, menuUpdateSchema };
