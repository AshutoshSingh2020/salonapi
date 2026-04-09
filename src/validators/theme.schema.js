const { z } = require("zod");

const headerSettingsSchema = z.object({
  body: z.object({
    ctaText: z.string().optional().or(z.literal("")),
    ctaLink: z.string().optional().or(z.literal("")),
    showTopBar: z.coerce.boolean().optional(),
    instagramUrl: z.string().optional().or(z.literal("")),
    facebookUrl: z.string().optional().or(z.literal("")),
    whatsappUrl: z.string().optional().or(z.literal("")),
    homeLabel: z.string().optional().or(z.literal("")),
    servicesLabel: z.string().optional().or(z.literal("")),
    aboutLabel: z.string().optional().or(z.literal("")),
    contactLabel: z.string().optional().or(z.literal(""))
  })
});

const footerSettingsSchema = z.object({
  body: z.object({
    brandName: z.string().optional().or(z.literal("")),
    tagline: z.string().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    email: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    mapLink: z.string().optional().or(z.literal("")),
    copyrightText: z.string().optional().or(z.literal("")),
    instagramUrl: z.string().optional().or(z.literal("")),
    facebookUrl: z.string().optional().or(z.literal("")),
    whatsappUrl: z.string().optional().or(z.literal("")),
    homeLabel: z.string().optional().or(z.literal("")),
    servicesLabel: z.string().optional().or(z.literal("")),
    aboutLabel: z.string().optional().or(z.literal("")),
    contactLabel: z.string().optional().or(z.literal(""))
  })
});

const navLinkSchema = z.object({
  body: z.object({
    label: z.string().min(2),
    url: z.string().min(1),
    position: z.coerce.number().int().optional(),
    isActive: z.coerce.boolean().optional()
  })
});

module.exports = { headerSettingsSchema, footerSettingsSchema, navLinkSchema };
