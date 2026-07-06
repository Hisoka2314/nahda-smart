import { z } from "zod";
import {
  moroccanPhoneSchema,
  optionalEmailSchema,
  optionalTextSchema,
} from "@/lib/validations/common";

export const customerTypeSchema = z.enum([
  "INDIVIDUAL",
  "COMPANY",
  "SCHOOL",
  "ADMINISTRATION",
  "RESELLER",
  "ASSOCIATION",
]);

export const customerSourceSchema = z.enum([
  "WEBSITE",
  "WHATSAPP",
  "FACEBOOK",
  "GOOGLE",
  "STORE",
  "RECOMMENDATION",
]);

export const customerLevelSchema = z.enum(["NEW", "LOYAL", "VIP", "B2B"]);

export const customerSchema = z
  .object({
    name: z.string().trim().min(2, "Le nom complet est obligatoire."),
    phone: moroccanPhoneSchema,
    email: optionalEmailSchema,
    city: z.string().trim().min(2, "La ville est obligatoire.").optional(),
    address: z.string().trim().min(4, "Adresse trop courte.").optional(),
    type: customerTypeSchema,
    source: customerSourceSchema.default("WEBSITE"),
    level: customerLevelSchema.default("NEW"),
    organizationName: z.string().trim().optional(),
    internalNotes: optionalTextSchema,
  })
  .superRefine((value, context) => {
    if (value.type !== "INDIVIDUAL" && !value.organizationName?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["organizationName"],
        message: "Le nom de l’organisation est obligatoire pour ce type client.",
      });
    }
  });

export type CustomerInput = z.infer<typeof customerSchema>;
