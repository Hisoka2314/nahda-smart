import { z } from "zod";

const requiredText = (label: string) =>
  z.string().trim().min(2, `${label} obligatoire.`).max(160);

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .optional()
  .or(z.literal(""))
  .transform((value) => value ?? "")
  .refine(
    (value) => value === "" || /^https:\/\/.+/.test(value),
    "URL invalide : elle doit commencer par https://",
  );

export const siteSettingsSchema = z.object({
  companyName: requiredText("Nom de la société"),
  email: z.string().trim().email("E-mail invalide.").max(160),
  phone: requiredText("Téléphone"),
  whatsapp: z
    .string()
    .trim()
    .min(6, "Numéro WhatsApp obligatoire.")
    .max(30)
    .refine(
      (value) => value.replace(/\D/g, "").length >= 8,
      "Numéro WhatsApp invalide (au moins 8 chiffres, format international).",
    ),
  addressPrimary: requiredText("Adresse principale"),
  addressSecondary: z
    .string()
    .trim()
    .max(160)
    .optional()
    .or(z.literal(""))
    .transform((value) => value ?? ""),
  mapsUrl: optionalUrl,
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  openingHours: requiredText("Horaires d'ouverture"),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
