const { z } = require("zod");

const sectionSchema = z.object({
  type: z.string().min(1),
  data: z.any().optional()
});

const serviceDetailSchema = z.object({
  body: z.object({
    layout: z.enum(["default", "custom"]).optional(),
    sections: z.array(sectionSchema).optional()
  })
});

module.exports = { serviceDetailSchema };
