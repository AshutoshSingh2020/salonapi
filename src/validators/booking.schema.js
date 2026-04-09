const { z } = require("zod");

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

const createBookingSchema = z.object({
  body: z.object({
    serviceId: z.coerce.number().int().positive(),
    staffId: z.coerce.number().int().positive().optional(),
    bookingDate: z.string().regex(dateRegex, "Invalid date format"),
    startTime: z.string().regex(timeRegex, "Invalid time format"),
    customerName: z.string().min(2),
    customerPhone: z.string().min(7),
    customerEmail: z.string().email().optional(),
    notes: z.string().optional(),
    paymentMode: z.enum(["offline", "online"]).optional(),
    paymentCompleted: z.coerce.boolean().optional()
  })
});

const availabilitySchema = z.object({
  query: z.object({
    date: z.string().regex(dateRegex, "Invalid date format"),
    serviceId: z.string().regex(/\d+/),
    staffId: z.string().regex(/\d+/).optional()
  })
});

const checkInSchema = z.object({
  body: z.object({
    code: z.string().min(4)
  })
});

module.exports = { createBookingSchema, availabilitySchema, checkInSchema };
