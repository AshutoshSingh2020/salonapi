const { z } = require("zod");

const contactSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    subject: z.string().optional().or(z.literal("")),
    message: z.string().min(5)
  })
});

const contactStatusSchema = z.object({
  body: z.object({
    status: z.enum(["new", "in_progress", "completed"])
  })
});

module.exports = { contactSchema, contactStatusSchema };
