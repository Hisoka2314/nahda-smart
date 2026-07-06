import {
  DepotType,
  FilterInputType,
  ProductCondition,
  ProductStatus,
  StockMovementType,
} from "@prisma/client";
import { z } from "zod";
import {
  nonNegativeMoneySchema,
  optionalTextSchema,
  slugSchema,
} from "@/lib/validations/common";

const optionalString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    const text = value?.trim();
    return text ? text : undefined;
  });

export const adminProductSchema = z
  .object({
    id: optionalString,
    name: z.string().trim().min(2, "Nom produit obligatoire."),
    slug: slugSchema,
    sku: z.string().trim().min(2, "SKU obligatoire."),
    barcode: optionalString,
    brandId: z.string().min(1, "Marque obligatoire."),
    categoryId: z.string().min(1, "Categorie obligatoire."),
    shortDescription: z.string().trim().max(360).optional().or(z.literal("")),
    description: z.string().trim().min(10, "Description obligatoire."),
    technicalDescription: optionalTextSchema,
    priceBuy: nonNegativeMoneySchema,
    priceSell: nonNegativeMoneySchema,
    promoPrice: z
      .preprocess((value) => (value === "" ? undefined : value), nonNegativeMoneySchema.optional()),
    warrantyMonths: z.coerce.number().int().min(0).max(120).default(12),
    condition: z.enum(ProductCondition).default("NEW"),
    status: z.enum(ProductStatus).default("DRAFT"),
    isPromo: z.coerce.boolean().default(false),
    isNew: z.coerce.boolean().default(false),
    isRecommended: z.coerce.boolean().default(false),
    isBestSeller: z.coerce.boolean().default(false),
    seoTitle: optionalString,
    seoDescription: optionalString,
  })
  .superRefine((value, context) => {
    if (value.promoPrice !== undefined && value.promoPrice > value.priceSell) {
      context.addIssue({
        code: "custom",
        path: ["promoPrice"],
        message: "Le prix promo ne peut pas depasser le prix de vente.",
      });
    }
  });

export const adminProductImageSchema = z.object({
  productId: z.string().min(1),
  alt: optionalString,
  order: z.coerce.number().int().min(0).default(0),
});

export const adminProductImageUpdateSchema = z.object({
  imageId: z.string().min(1),
  productId: z.string().min(1),
  alt: optionalString,
  order: z.coerce.number().int().min(0).default(0),
});

export const adminProductAttributeSchema = z.object({
  productId: z.string().min(1),
  attributeId: z.string().min(1),
  optionId: optionalString,
  valueString: optionalString,
  valueNumber: z
    .preprocess((value) => (value === "" ? undefined : value), z.coerce.number().optional()),
  valueBoolean: z
    .enum(["true", "false", ""])
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value === "true")),
});

export const adminCategorySchema = z.object({
  id: optionalString,
  name: z.string().trim().min(2, "Nom categorie obligatoire."),
  slug: slugSchema,
  parentId: optionalString,
  icon: optionalString,
  bannerUrl: optionalString,
  description: optionalTextSchema,
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(false),
});

export const adminBrandSchema = z.object({
  id: optionalString,
  name: z.string().trim().min(2, "Nom marque obligatoire."),
  slug: slugSchema,
  logoPath: optionalString,
  isActive: z.coerce.boolean().default(false),
  isOfficialAsset: z.coerce.boolean().default(false),
});

export const adminBrandLogoSchema = z.object({
  brandId: z.string().min(1),
  isOfficialAsset: z.coerce.boolean().default(false),
});

export const adminFilterGroupSchema = z.object({
  id: optionalString,
  categoryId: z.string().min(1),
  name: z.string().trim().min(2, "Nom groupe obligatoire."),
  slug: slugSchema,
  order: z.coerce.number().int().min(0).default(0),
  defaultOpen: z.coerce.boolean().default(false),
  isAdvanced: z.coerce.boolean().default(false),
  visible: z.coerce.boolean().default(false),
});

export const adminFilterAttributeSchema = z.object({
  id: optionalString,
  groupId: z.string().min(1),
  categoryId: z.string().min(1),
  label: z.string().trim().min(1, "Libelle filtre obligatoire."),
  slug: slugSchema,
  type: z.enum(FilterInputType),
  unit: optionalString,
  filterable: z.coerce.boolean().default(false),
  searchable: z.coerce.boolean().default(false),
  visible: z.coerce.boolean().default(false),
  order: z.coerce.number().int().min(0).default(0),
});

export const adminFilterOptionSchema = z.object({
  id: optionalString,
  attributeId: z.string().min(1),
  label: z.string().trim().min(1, "Libelle option obligatoire."),
  value: z.string().trim().min(1, "Valeur option obligatoire."),
  order: z.coerce.number().int().min(0).default(0),
  visible: z.coerce.boolean().default(false),
});

export const adminDepotSchema = z.object({
  id: optionalString,
  name: z.string().trim().min(2, "Nom depot obligatoire."),
  type: z.enum(DepotType),
  address: optionalString,
  managerName: optionalString,
  isActive: z.coerce.boolean().default(false),
});

export const adminStockMovementSchema = z
  .object({
    productId: z.string().min(1),
    depotId: z.string().min(1),
    targetDepotId: optionalString,
    type: z.enum(StockMovementType),
    // Signee uniquement pour ADJUSTMENT (correction d'inventaire a la
    // baisse) ; les autres types exigent une quantite positive.
    quantity: z.coerce
      .number()
      .int("La quantite doit etre un nombre entier.")
      .refine((value) => value !== 0, "La quantite ne peut pas etre nulle."),
    reason: optionalString,
    reference: optionalString,
    lowStockThreshold: z.coerce.number().int().min(0).default(3),
  })
  .superRefine((value, context) => {
    if (value.type !== "ADJUSTMENT" && value.quantity <= 0) {
      context.addIssue({
        code: "custom",
        path: ["quantity"],
        message:
          "La quantite doit etre positive. Utilisez le type Ajustement pour une correction negative.",
      });
    }
    if (value.type === "TRANSFER" && !value.targetDepotId) {
      context.addIssue({
        code: "custom",
        path: ["targetDepotId"],
        message: "Depot destination obligatoire pour un transfert.",
      });
    }
    if (value.type === "TRANSFER" && value.targetDepotId === value.depotId) {
      context.addIssue({
        code: "custom",
        path: ["targetDepotId"],
        message: "Le depot destination doit etre different.",
      });
    }
  });

export const adminStockThresholdSchema = z.object({
  productId: z.string().min(1),
  depotId: z.string().min(1),
  lowStockThreshold: z.coerce.number().int().min(0).max(100000),
});

export type AdminProductInput = z.infer<typeof adminProductSchema>;
