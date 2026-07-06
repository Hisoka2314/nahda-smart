import { z } from "zod";
import {
  nonNegativeMoneySchema,
  optionalTextSchema,
  positiveQuantitySchema,
  slugSchema,
} from "@/lib/validations/common";
import { customerSchema } from "@/lib/validations/customer";
import { publicCustomerTypeSchema } from "@/lib/validations/order";

export const quoteUrgencySchema = z.enum([
  "NORMAL",
  "URGENT",
  "PLANNED_PROJECT",
]);

export const quoteNeedTypeSchema = z.enum([
  "SIMPLE_PURCHASE",
  "INSTALLATION",
  "MAINTENANCE",
  "TECHNICAL_ADVICE",
  "FULL_SOLUTION",
]);

export const quoteItemSchema = z.object({
  productId: z.string().min(1).optional(),
  productName: z.string().trim().min(2).optional(),
  quantity: positiveQuantitySchema,
  unitPrice: nonNegativeMoneySchema.optional(),
});

export const createQuoteSchema = z.object({
  customer: customerSchema.optional(),
  organizationName: z.string().trim().optional(),
  message: optionalTextSchema,
  urgency: quoteUrgencySchema.default("NORMAL"),
  needType: quoteNeedTypeSchema.default("SIMPLE_PURCHASE"),
  budget: nonNegativeMoneySchema.optional(),
  items: z.array(quoteItemSchema).default([]),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

export const publicQuoteUrgencySchema = z.enum([
  "normal",
  "urgent",
  "planned",
]);

export const publicQuoteNeedSchema = z.enum([
  "simple_purchase",
  "installation",
  "maintenance",
  "technical_advice",
  "complete_solution",
]);

export const websiteQuoteSchema = z
  .object({
    fullName: z.string().trim().min(2, "Le nom complet est obligatoire."),
    phone: z
      .string()
      .trim()
      .min(1, "Le téléphone est obligatoire.")
      .regex(/^(?:0[5-8]\d{8}|\+?212[5-8]\d{8})$/, {
        message: "Téléphone marocain invalide.",
      }),
    email: z
      .string()
      .trim()
      .email("Email invalide.")
      .optional()
      .or(z.literal("")),
    customerType: publicCustomerTypeSchema,
    organizationName: z.string().trim().optional().or(z.literal("")),
    city: z.string().trim().min(2, "La ville est obligatoire."),
    message: optionalTextSchema,
    productSlug: slugSchema.optional().or(z.literal("")),
    productName: z.string().trim().optional().or(z.literal("")),
    desiredProducts: z.string().trim().optional().or(z.literal("")),
    desiredQuantity: positiveQuantitySchema,
    estimatedBudget: nonNegativeMoneySchema.optional(),
    urgency: publicQuoteUrgencySchema.default("normal"),
    needs: z
      .array(publicQuoteNeedSchema)
      .min(1, "Choisissez au moins un besoin."),
  })
  .superRefine((value, context) => {
    if (
      value.customerType !== "individual" &&
      !value.organizationName?.trim()
    ) {
      context.addIssue({
        code: "custom",
        path: ["organizationName"],
        message: "Le nom de l'organisation est obligatoire pour ce type client.",
      });
    }

    if (!value.productSlug && !value.desiredProducts?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["desiredProducts"],
        message: "Indiquez les produits souhaités ou partez d'un produit.",
      });
    }
  });

export type WebsiteQuoteInput = z.infer<typeof websiteQuoteSchema>;
