/**
 * Site / business configuration.
 *
 * This module is the single source of truth for business-facing constants.
 * Settings that the admin can later manage through the dashboard (phone,
 * address, business hours, social links, etc.) are read from a `settings`
 * row in Supabase at runtime, but these provide sensible static defaults so
 * the site works before the backend is connected.
 *
 * IMPORTANT: Only include real details that were supplied (phone, address,
 * social links, etc.). Fields not yet known stay blank here so they can be
 * filled from the admin dashboard / Supabase settings at runtime.
 */

export const siteConfig = {
  name: "Al Zajel Rent Car",
  nameAr: "الزاجل لتأجير السيارات",
  description:
    "More than a rental. Premium car rental services. استأجر سيارتك وانطلق بطريقتك.",
  email: "email@example.com", // TODO: replace with the real business email

  // Provided from the admin dashboard (Supabase settings) or set here as default.
  phone: "+968 9710 2438",
  whatsapp: "+968 9710 2438",
  address: "Al Hidd, Bahrain",
  addressAr: "الحد، البحرين",

  // Google Maps embedded location (leave blank — added later from the admin dashboard).
  mapsUrl: "https://maps.app.goo.gl/Jvn9JeoxitUQV9XFA",

  // Social media (leave blank for channels not in use).
  social: {
    instagram: "https://www.instagram.com/se7en.rent",
    tiktok: "",
    snapchat: "",
  },

  // Business hours (supplied). Keys use ISO weekday (0 = Sunday).
  hours: {
    0: { open: "10:00", close: "22:00" }, // Sunday
    1: { open: "10:00", close: "22:00" }, // Monday
    2: { open: "10:00", close: "22:00" }, // Tuesday
    3: { open: "10:00", close: "22:00" }, // Wednesday
    4: { open: "10:00", close: "22:00" }, // Thursday
    5: { open: "16:00", close: "22:00" }, // Friday
    6: { open: "09:00", close: "22:00" }, // Saturday
  },
} as const;

export type SiteConfig = typeof siteConfig;
