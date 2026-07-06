import { z } from "zod";

export const moroccanPhoneSchema = z
  .string()
  .trim()
  .regex(/^(?:0[5-8]\d{8}|\+?212[5-8]\d{8})$/, {
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
