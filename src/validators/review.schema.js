const { z } = require("zod");

const reviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(3)
  })
});

module.exports = { reviewSchema };
