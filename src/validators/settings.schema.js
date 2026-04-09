const { z } = require("zod");

const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
const timeValidationMessage = "Time must be in HH:mm or HH:mm:ss format";

const settingsSchema = z.object({
  body: z.object({
    openTime: z.string().regex(timeRegex, timeValidationMessage),
    closeTime: z.string().regex(timeRegex, timeValidationMessage),
    slotDurationMinutes: z.coerce.number().int().positive(),
    timezone: z.string().min(3).optional()
  })
});

module.exports = { settingsSchema };
