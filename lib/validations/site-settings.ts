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

const texteFacultatif = z
  .string()
  .trim()
  .max(160)
  .optional()
  .or(z.literal(""))
  .transform((value) => value ?? "");

// Un identifiant administratif ne porte que des chiffres, des lettres, des
// espaces et des tirets. La contrainte reste large : les formats marocains
// varient d'une administration a l'autre.
const identifiantFacultatif = texteFacultatif.refine(
  (value) => value === "" || /^[A-Za-z0-9 /.-]{3,40}$/.test(value),
  "Identifiant invalide : chiffres, lettres, espaces et tirets seulement.",
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
  deliveryFee: z.coerce
    .number()
    .nonnegative("Les frais de livraison ne peuvent pas être négatifs.")
    .max(10000, "Frais de livraison irréalistes."),

  // Mentions legales. Toutes facultatives : le magasin les saisit au fur et a
  // mesure qu'il recoit ses attestations, et les documents omettent la ligne
  // tant qu'elle est vide. Les bloquer empecherait d'enregistrer le reste.
  legalName: texteFacultatif,
  legalForm: texteFacultatif,
  legalCapital: texteFacultatif,
  legalAddress: texteFacultatif,
  ice: identifiantFacultatif,
  rc: identifiantFacultatif,
  rcCity: texteFacultatif,
  taxId: identifiantFacultatif,
  patente: identifiantFacultatif,
  cnss: identifiantFacultatif,
  vatRate: z.coerce
    .number()
    .min(0, "Le taux de TVA ne peut pas être négatif.")
    .max(100, "Un taux de TVA ne dépasse pas 100 %."),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
