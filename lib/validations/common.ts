import { z } from "zod";

// Forme canonique unique d'un numero marocain : 212XXXXXXXXX.
// Le formulaire accepte 06.12.34.56.78, 0612345678 et +212612345678 ; sans
// cette canonicalisation le meme client etait duplique en base et ne pouvait
// pas retrouver sa commande s'il changeait de notation entre deux saisies.
export function normalizeMoroccanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("212")) return digits;
  if (digits.startsWith("0")) return `212${digits.slice(1)}`;

  return digits;
}

// On normalise AVANT de valider : la regex s'appliquait a la saisie brute et
// rejetait "06 12 34 56 78" ou "06.12.34.56.78", pourtant des notations
// courantes. La valeur produite est toujours la forme canonique, ce qui
// garantit qu'un meme numero donne la meme cle en base.
export const moroccanPhoneSchema = z
  .string()
  .trim()
  .transform(normalizeMoroccanPhone)
  .refine((value) => /^212[5-8]\d{8}$/.test(value), {
    message: "Téléphone marocain invalide.",
  });

export const optionalEmailSchema = z
  .string()
  .trim()
  .email("Email invalide.")
  .optional()
  .or(z.literal(""));

export const positiveQuantitySchema = z.coerce
  .number()
  .int("La quantité doit être un nombre entier.")
  .positive("La quantité doit être supérieure à zéro.");

export const nonNegativeMoneySchema = z.coerce
  .number()
  .nonnegative("Le montant ne peut pas être négatif.");

export const optionalTextSchema = z
  .string()
  .trim()
  .max(2000, "Le texte est trop long.")
  .optional()
  .or(z.literal(""));

export const slugSchema = z
  .string()
  .trim()
  .min(2, "Le slug est obligatoire.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide.");
