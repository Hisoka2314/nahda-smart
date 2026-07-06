import { z } from "zod";
import {
  nonNegativeMoneySchema,
  optionalTextSchema,
  slugSchema,
} from "@/lib/validations/common";

export const productConditionSchema = z.enum(["NEW", "USED", "REFURBISHED"]);
export const productStatusSchema = z.enum([
  "PUBLISHED",
  "DRAFT",
  "ARCHIVED",
  "OUT_OF_STOCK",
  "ON_ORDER",
]);

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Nom produit obligatoire."),
    slug: slugSchema,
    sku: z.string().trim().min(2, "SKU obligatoire."),
    barcode: z.string().trim().optional(),
    brandId: z.string().min(1, "Marque obligatoire."),
    categoryId: z.string().min(1, "Catégorie obligatoire."),
    shortDescription: z.string().trim().max(280).optional(),
    description: z.string().trim().min(10, "Description obligatoire."),
    technicalDescription: optionalTextSchema,
    priceBuy: nonNegativeMoneySchema,
    priceSell: nonNegativeMoneySchema,
    promoPrice: nonNegativeMoneySchema.optional(),
    warrantyMonths: z.coerce.number().int().min(0).max(120).default(12),
    condition: productConditionSchema.default("NEW"),
    status: productStatusSchema.default("DRAFT"),
    isPromo: z.boolean().default(false),
    isNew: z.boolean().default(false),
    isRecommended: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.promoPrice && value.promoPrice > value.priceSell) {
      context.addIssue({
        code: "custom",
        path: ["promoPrice"],
        message: "Le prix promotionnel ne peut pas dépasser le prix de vente.",
      });
    }
  });

export type ProductInput = z.infer<typeof productSchema>;
